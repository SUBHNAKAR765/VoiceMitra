import mysql.connector
from mysql.connector import errorcode
import logging
from urllib.parse import urlparse
from app.config import get_settings

logger = logging.getLogger(__name__)


def get_db_connection():
    settings = get_settings()

    # Railway injects DATABASE_URL — parse it if present
    if settings.database_url:
        parsed = urlparse(settings.database_url)
        config = {
            "host":     parsed.hostname,
            "port":     parsed.port or 3306,
            "user":     parsed.username,
            "password": parsed.password,
            "database": parsed.path.lstrip("/"),
        }
    else:
        config = {
            "host":     settings.db_host,
            "port":     settings.db_port,
            "user":     settings.db_user,
            "password": settings.db_password,
            "database": settings.db_name,
        }

    try:
        conn = mysql.connector.connect(**config)
        return conn
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            logger.error("Database access denied — check DB credentials")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            logger.error("Database does not exist — check DB_NAME")
        else:
            logger.error(f"Database error: {err}")
        return None
