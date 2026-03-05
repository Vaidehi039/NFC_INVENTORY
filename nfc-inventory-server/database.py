from sqlalchemy import create_engine, exc
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration from .env
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_NAME = os.getenv("DB_NAME", "nfc_inventory")

# Try MySQL first (XAMPP)
MYSQL_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
SQLITE_URL = "sqlite:///./nfc_inventory.db"

def get_engine():
    try:
        # Attempt to create MySQL engine and test connection
        engine = create_engine(MYSQL_URL, pool_pre_ping=True)
        # Try a simple connection to see if MySQL is alive
        with engine.connect() as conn:
            print("Successfully connected to MySQL (XAMPP).")
            return engine
    except Exception as e:
        print(f"MySQL connection failed: {e}")
        print("Falling back to SQLite (nfc_inventory.db) for high availability.")
        # Fallback to SQLite if MySQL is down
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
