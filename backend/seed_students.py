"""
Run this once to create the DB, table, and insert all CGU students.
Usage: python seed_students.py
"""
import mysql.connector
from mysql.connector import errorcode
import bcrypt
import csv
import os

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "0624",
}
DB_NAME = "voicemitra"
DATA_FILE = os.path.join(os.path.dirname(__file__), "CGUStudentsData.txt")
DEFAULT_PASSWORD = "Student@123"


def get_connection(database=None):
    cfg = {**DB_CONFIG}
    if database:
        cfg["database"] = database
    return mysql.connector.connect(**cfg)


def create_database(cursor):
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    print(f"Database `{DB_NAME}` ready.")


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
    # Add username column if table already existed without it
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN username VARCHAR(20) NOT NULL UNIQUE AFTER roll_number")
        print("Added `username` column.")
    except Exception:
        pass  # column already exists
    print("Table `students` ready.")


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def load_students():
    students = []
    with open(DATA_FILE, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            name = row["Name"].strip()
            roll = row["Roll Number"].strip()
            email = row["Email"].strip()
            if name and roll and email:
                students.append((name, roll, email))
    return students


def seed():
    # Step 1 – create DB
    conn = get_connection()
    cur = conn.cursor()
    create_database(cur)
    conn.commit()
    cur.close()
    conn.close()

    # Step 2 – create table & insert
    conn = get_connection(database=DB_NAME)
    cur = conn.cursor()
    create_table(cur)

    students = load_students()
    hashed = hash_password(DEFAULT_PASSWORD)

    inserted = 0
    skipped = 0
    for name, roll, email in students:
        username = roll  # username = roll number
        try:
            cur.execute(
                "INSERT INTO students (name, roll_number, username, email, password) VALUES (%s, %s, %s, %s, %s)",
                (name, roll, username, email, hashed),
            )
            inserted += 1
        except mysql.connector.IntegrityError:
            # Update username on existing rows that may be missing it
            cur.execute(
                "UPDATE students SET username=%s WHERE roll_number=%s AND (username IS NULL OR username='')",
                (username, roll),
            )
            skipped += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"\nDone! {inserted} students inserted, {skipped} skipped (duplicates).")
    print(f"Login with email ({DEFAULT_PASSWORD}) OR username/roll number ({DEFAULT_PASSWORD})")


if __name__ == "__main__":
    seed()
