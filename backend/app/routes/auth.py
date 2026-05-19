from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import LoginRequest, UserResponse, RegisterRequest
from app.services.db_service import get_db_connection
import bcrypt
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.post("/login", response_model=UserResponse)
async def login(request: LoginRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Check username, roll_number, or email
        query = "SELECT * FROM students WHERE username = %s OR roll_number = %s OR email = %s"
        cursor.execute(query, (request.username, request.username, request.username))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        if not verify_password(request.password, user['password']):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        return UserResponse(
            id=user['id'],
            name=user['name'],
            username=user['username'],
            email=user['email'],
            roll_number=user['roll_number']
        )
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred")
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

@router.post("/register", response_model=UserResponse)
async def register(request: RegisterRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Check if user already exists
        check_query = "SELECT * FROM students WHERE username = %s OR email = %s"
        cursor.execute(check_query, (request.username, request.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username or Email already exists")
        
        hashed = hash_password(request.password)
        roll = request.roll_number or ''
        insert_query = """
            INSERT INTO students (name, email, username, roll_number, password)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (request.name, request.email, request.username, roll, hashed))
        conn.commit()
        
        new_id = cursor.lastrowid
        return UserResponse(
            id=new_id,
            name=request.name,
            username=request.username,
            email=request.email,
            roll_number=roll
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred")
    finally:
        cursor.close()
        conn.close()

