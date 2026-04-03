import models
import database
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

db = database.SessionLocal()
try:
    user = db.query(models.User).filter(models.User.email == "admin@example.com").first()
    if user:
        user.hashed_password = pwd_context.hash("password123")
        db.commit()
        print("SUCCESS: Admin password reset to 'password123'")
    else:
        user = models.User(
            name="Superadmin",
            email="admin@example.com",
            hashed_password=pwd_context.hash("password123"),
            role="superadmin",
            is_active=True
        )
        db.add(user)
        db.commit()
        print("SUCCESS: Admin user created with password 'password123'")
finally:
    db.close()
