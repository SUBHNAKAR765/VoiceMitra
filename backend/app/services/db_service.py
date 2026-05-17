import os
import mysql.connector
import logging

logger = logging.getLogger(__name__)


def get_db_connection():
    try:
        return mysql.connector.connect(
            host=os.getenv("MYSQLHOST"),
            port=int(os.getenv("MYSQLPORT", 3306)),
            user=os.getenv("MYSQLUSER"),
            password=os.getenv("MYSQLPASSWORD"),
            database=os.getenv("MYSQLDATABASE"),
            connection_timeout=30
        )
    except mysql.connector.Error as err:
        logger.error(f"Database error: {err}")
        return None
