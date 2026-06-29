import os
import glob
from app.core.database import get_conn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")

def run_migrations():
    logger.info("[MIGRATE] Starting database migrations...")
    with get_conn() as conn:
        with conn.cursor() as cur:
            # Create migration history table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS migration_history (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) UNIQUE NOT NULL,
                    applied_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            
            # Get list of applied migrations
            cur.execute("SELECT filename FROM migration_history")
            applied = set(row[0] for row in cur.fetchall())

            # Find all .sql files in migrations directory
            migration_files = sorted(glob.glob(os.path.join(MIGRATIONS_DIR, "*.sql")))

            for file_path in migration_files:
                filename = os.path.basename(file_path)
                if filename not in applied:
                    logger.info(f"[MIGRATE] Applying {filename}...")
                    with open(file_path, "r", encoding="utf-8") as f:
                        sql = f.read()
                    
                    try:
                        cur.execute(sql)
                        cur.execute(
                            "INSERT INTO migration_history (filename) VALUES (%s)", 
                            (filename,)
                        )
                        conn.commit()
                        logger.info(f"[MIGRATE] Successfully applied {filename}")
                    except Exception as e:
                        conn.rollback()
                        logger.error(f"[MIGRATE] Error applying {filename}: {e}")
                        raise
                else:
                    logger.debug(f"[MIGRATE] Skipping {filename}, already applied")
                    
    logger.info("[MIGRATE] Migrations complete.")

if __name__ == "__main__":
    run_migrations()
