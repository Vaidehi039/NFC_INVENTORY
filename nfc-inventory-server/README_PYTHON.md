# NFC Inventory Backend (FastAPI)

This is a Python-based recreation of the original Node.js backend using FastAPI.

## Setup

1. **Install Python 3.8+**
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run the server**:
   ```bash
   python main.py
   ```
   The server will run on the port specified in `.env` (default: 3000).

## Features
- Functional parity with the original Express backend.
- Automatic database seeding on startup.
- Supports both SQLite and MySQL (via `.env`).
- JWT-based authentication.
- Pydantic models for data validation.
- SQLAlchemy ORM.
