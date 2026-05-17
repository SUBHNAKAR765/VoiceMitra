import mysql.connector
from mysql.connector import errorcode
import logging
from urllib.parse import urlparse
from app.config import get_settings

logger = logging.getLogger(__name__)


def _build_config() -> dict:
    settings = get_settings()

    # Priority 1: Railway individual MySQL vars (MYSQLHOST, MYSQLPORT, etc.)
    if settings.mysqlhost:
        return {
            "host":              settings.mysqlhost,
            "port":              settings.mysqlport,
            "user":              settings.mysqluser,
            "password":          settings.mysqlpassword,
            "database":          settings.mysqldatabase,
            "ssl_disabled":      False,
            "connection_timeout": 30,
        }

    # Priority 2: DATABASE_URL fallback
    if settings.database_url:
        parsed = urlparse(settings.database_url)
        return {
            "host":              parsed.hostname,
            "port":              parsed.port or 3306,
            "user":              parsed.username,
            "password":          parsed.password,
            "database":          parsed.path.lstrip("/"),
            "ssl_disabled":      False,
            "connection_timeout": 30,
        }

    # Priority 3: Local dev DB_* vars
    return {
        "host":              settings.db_host,
        "port":              settings.db_port,
        "user":              settings.db_user,
        "password":          settings.db_password,
        "database":          settings.db_name,
        "connection_timeout": 10,
    }


def get_db_connection():
    config = _build_config()
    try:
        conn = mysql.connector.connect(**config)
        return conn
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            logger.error("Database access denied — check credentials")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            logger.error("Database does not exist")
        else:
            logger.error(f"Database error: {err}")
        return None
