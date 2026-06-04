from fastapi import APIRouter, HTTPException
from app.models.schemas import LoginRequest, UserResponse, RegisterRequest
from app.services.db_service import get_db_connection
import bcrypt
import logging
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


@router.post("/login", response_model=UserResponse)
async def login(request: LoginRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM students WHERE username = %s OR roll_number = %s OR email = %s",
            (request.username, request.username, request.username)
        )
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        if not verify_password(request.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        return UserResponse(
            id=user["id"], name=user["name"], username=user["username"],
            email=user["email"], roll_number=user["roll_number"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred")
    finally:
        try: cursor.close()
        except: pass
        conn.close()


@router.post("/register", response_model=UserResponse)
async def register(request: RegisterRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(dictionary=True)

        # Duplicate check
        cursor.execute(
            "SELECT id FROM students WHERE username = %s OR email = %s",
            (request.username, request.email)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username or email already exists")

        roll = request.roll_number or uuid.uuid4().hex[:20]
        cursor.execute(
            "INSERT INTO students (name, email, username, roll_number, password) VALUES (%s, %s, %s, %s, %s)",
            (request.name, request.email, request.username, roll, hash_password(request.password))
        )
        conn.commit()
        return UserResponse(
            id=cursor.lastrowid, name=request.name, username=request.username,
            email=request.email, roll_number=roll
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred")
    finally:
        try: cursor.close()
        except: pass
        conn.close()
