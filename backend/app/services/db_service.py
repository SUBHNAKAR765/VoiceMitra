import mysql.connector
from mysql.connector import errorcode
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)

# Hardcoded for now based on seed_students.py, but ideally should be in config/.env
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "0624",
    "database": "voicemitra"
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            logger.error("Something is wrong with your user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            logger.error("Database does not exist")
        else:
            logger.error(err)
        return None
