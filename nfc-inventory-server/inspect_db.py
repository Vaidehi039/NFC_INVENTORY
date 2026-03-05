from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_NAME = os.getenv("DB_NAME", "nfc_inventory")

MYSQL_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

try:
    engine = create_engine(MYSQL_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in database '{DB_NAME}': {tables}")
    
    for table in tables:
        columns = inspector.get_columns(table)
        print(f"\nTable: {table}")
        for column in columns:
            print(f" - {column['name']} ({column['type']})")

except Exception as e:
    print(f"Error inspecting database: {e}")
