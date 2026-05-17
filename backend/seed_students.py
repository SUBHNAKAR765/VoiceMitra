"""
Run this once to create the DB table and insert all CGU students.

Usage (local):
    python seed_students.py

Usage (Railway MySQL):
    set MYSQL_HOST=monorail.proxy.rlwy.net
    set MYSQL_PORT=12345
    set MYSQL_USER=root
    set MYSQL_PASSWORD=AbCdEfGh123
    set MYSQL_DATABASE=railway
    python seed_students.py
"""
import mysql.connector
import bcrypt
import csv
import os

# ── Connection config ─────────────────────────────────────────────────────────
MYSQL_HOST     = os.environ.get("MYSQL_HOST",     "localhost")
MYSQL_PORT     = int(os.environ.get("MYSQL_PORT", 3306))
MYSQL_USER     = os.environ.get("MYSQL_USER",     "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "voicemitra")

IS_REMOTE = MYSQL_HOST != "localhost"

DATA_FILE        = os.path.join(os.path.dirname(__file__), "CGUStudentsData.txt")
DEFAULT_PASSWORD = "Student@123"


def get_connection(database=None):
    cfg = {
        "host":     MYSQL_HOST,
        "port":     MYSQL_PORT,
        "user":     MYSQL_USER,
        "password": MYSQL_PASSWORD,
        "connection_timeout": 30,
    }
    if IS_REMOTE:
        cfg["ssl_disabled"] = False
    if database:
        cfg["database"] = database
    return mysql.connector.connect(**cfg)


def create_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            name        VARCHAR(150)  NOT NULL,
            roll_number VARCHAR(20)   NOT NULL UNIQUE,
            username    VARCHAR(20)   NOT NULL UNIQUE,
            email       VARCHAR(150)  NOT NULL UNIQUE,
            password    VARCHAR(255)  NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    print("Table `students` ready.")


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def load_students():
    students = []
    with open(DATA_FILE, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            name  = row["Name"].strip()
            roll  = row["Roll Number"].strip()
            email = row["Email"].strip()
            if name and roll and email:
                students.append((name, roll, email))
    return students


def seed():
    # For Railway, the database already exists — connect directly
    if IS_REMOTE:
        conn = get_connection(database=MYSQL_DATABASE)
    else:
        # Local: create DB first if needed
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"Database `{MYSQL_DATABASE}` ready.")
        conn.commit()
        cur.close()
        conn.close()
        conn = get_connection(database=MYSQL_DATABASE)

    cur = conn.cursor()
    create_table(cur)

    students = load_students()
    hashed   = hash_password(DEFAULT_PASSWORD)

    inserted = skipped = 0
    for name, roll, email in students:
        try:
            cur.execute(
                "INSERT INTO students (name, roll_number, username, email, password) VALUES (%s, %s, %s, %s, %s)",
                (name, roll, roll, email, hashed),
            )
            inserted += 1
        except mysql.connector.IntegrityError:
            skipped += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nDone! {inserted} inserted, {skipped} skipped (duplicates).")
    print(f"Default password: {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    seed()
