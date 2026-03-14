import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# =========================
# DATABASE CONFIG
# =========================

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_NAME = os.getenv("DB_NAME", "nfc_inventory")

MYSQL_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

SQLITE_URL = "sqlite:///./nfc_inventory.db"


# =========================
# CREATE DATABASE ENGINE
# =========================

def get_engine():
    dialect = os.getenv("DB_DIALECT", "mysql").lower()
    
    if dialect == "mysql":
        try:
            print(f"Attempting to connect to MySQL: {DB_USER}@{DB_HOST}/{DB_NAME}...")
            engine = create_engine(
                MYSQL_URL,
                pool_pre_ping=True,
                pool_recycle=3600
            )
            # Test connection
            with engine.connect() as conn:
                print("Successfully connected to MySQL (XAMPP)")
            return engine
        except Exception as e:
            print("--- DATABASE ERROR ---")
            print("MySQL Connection Failed!")
            print(f"Error: {str(e)}")
            print("DB_DIALECT is set to 'mysql'. Refusing silent fallback to SQLite.")
            print("Please ensure XAMPP MySQL is running and your .env credentials are correct.")
            # Explicitly exit to prevent running with empty data
            import sys
            sys.exit(1)
    
    print("MySQL not requested. Falling back to SQLite.")
    return create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False}
    )


engine = get_engine()


# =========================
# SESSION CONFIG
# =========================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()


# =========================
# DATABASE SESSION
# =========================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()