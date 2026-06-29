"""
psycopg2 connection pool — raw SQL, no ORM.
Provides get_db() for dependency injection in FastAPI routes.
"""
import psycopg2
from psycopg2 import pool as pg_pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Module-level connection pool (initialised once at startup)
_pool: pg_pool.ThreadedConnectionPool | None = None


def init_pool() -> None:
    global _pool
    _pool = pg_pool.ThreadedConnectionPool(
        minconn=2,
        maxconn=20,
        dsn=settings.DATABASE_URL,
    )
    logger.info("[DB] PostgreSQL connection pool initialised")


def close_pool() -> None:
    global _pool
    if _pool:
        _pool.closeall()
        logger.info("🔌  PostgreSQL connection pool closed")


@contextmanager
def get_conn():
    """Context manager — borrows a connection from the pool."""
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def get_db():
    """
    FastAPI dependency — yields a RealDictCursor.
    Use with:  db: RealDictCursor = Depends(get_db)
    """
    with get_conn() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()


