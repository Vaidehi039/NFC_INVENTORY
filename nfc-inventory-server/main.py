import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import timedelta

import models
import schemas
import auth
import database
from database import engine, get_db, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NFC Inventory API")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        # Seed Admin User
        admin = db.query(models.User).filter(models.User.email == "admin@example.com").first()
        if not admin:
            admin = models.User(
                name="Admin User",
                email="admin@example.com",
                hashed_password=auth.get_password_hash("password123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # Seed Product linked to Admin
        p1 = db.query(models.Product).filter(models.Product.sku == "APPLE-15-PM").first()
        if not p1:
            p1 = models.Product(
                name="iPhone 15 Pro Max", 
                sku="APPLE-15-PM", 
                category="Electronics", 
                stock=50, 
                price=159900, 
                tag_id="2190962515",
                user_id=admin.id
            )
            db.add(p1)
            db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

# 🔹 AUTH ENDPOINTS
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=auth.get_password_hash(user.password),
        role=user.role or "user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not auth.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email, "email": user.email, "role": user.role, "id": user.id})
    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@app.post("/api/auth/forgot-password")
def forgot_password(request: dict):
    # This is a stub for the password reset functionality
    return {"message": "Password reset instructions sent to your email"}

@app.post("/api/auth/google")
def google_auth(request: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    idinfo = auth.verify_google_token(request.token)
    if not idinfo:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    
    email = idinfo.get("email")
    name = idinfo.get("name", email.split("@")[0])
    
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Create new user
        user = models.User(
            name=name,
            email=email,
            hashed_password=auth.get_password_hash(os.urandom(16).hex()), # Random password for OAuth users
            role="user"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    access_token = auth.create_access_token(data={"sub": user.email, "email": user.email, "role": user.role, "id": user.id})
    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

# 🔹 DASHBOARD ENDPOINTS
@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    user_id = current_user.get("id")
    total_items = db.query(models.Product).filter(models.Product.user_id == user_id).count()
    total_stock = db.query(func.sum(models.Product.stock)).filter(models.Product.user_id == user_id).scalar() or 0
    low_stock = db.query(models.Product).filter(models.Product.user_id == user_id, models.Product.stock < 10).count()
    
    # Category distribution for this user
    categories = db.query(models.Product.category, func.count(models.Product.id)).filter(models.Product.user_id == user_id).group_by(models.Product.category).all()
    category_mix = [{"category": c[0], "count": c[1]} for c in categories]

    # Recent activity for this user - serialize with product info
    recent_activity = db.query(models.InventoryLog).filter(models.InventoryLog.user_id == user_id).order_by(models.InventoryLog.created_at.desc()).limit(10).all()
    recent_activity_data = []
    for log in recent_activity:
        log_data = {
            "id": log.id,
            "product_id": log.product_id,
            "action": log.action,
            "quantity": log.quantity,
            "status": log.status,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "product": {
                "id": log.product.id,
                "name": log.product.name,
                "sku": log.product.sku,
                "category": log.product.category,
                "tag_id": log.product.tag_id,
                "stock": log.product.stock,
                "price": log.product.price
            } if log.product else None
        }
        recent_activity_data.append(log_data)
    
    return {
        "stats": {
            "totalItems": total_items,
            "totalStock": total_stock,
            "lowStock": low_stock
        },
        "performance": {
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "scans": [120, 150, 180, 130, 200, 170, 190],
            "stockLevel": [600, 750, 700, 900, 850, 950, 1100]
        },
        "categories": category_mix,
        "recentActivity": recent_activity_data
    }

# 🔹 PRODUCT ENDPOINTS
@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    user_id = current_user.get("id")
    return db.query(models.Product).filter(models.Product.user_id == user_id).all()

@app.post("/api/products", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    user_id = current_user.get("id")
    db_product = models.Product(
        **product.dict(),
        user_id=user_id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/api/product/{tag_id}", response_model=schemas.ProductResponse)
def get_product_by_tag(tag_id: str, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    user_id = current_user.get("id")
    product = db.query(models.Product).filter(models.Product.tag_id == tag_id, models.Product.user_id == user_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="No product mapped to this tag")
    return product

@app.post("/api/link-tag")
def link_tag(request: dict, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    user_id = current_user.get("id")
    product_id = request.get("product_id")
    tag_id = request.get("tag_id")
    product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.user_id == user_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or not owned by user")
    product.tag_id = tag_id
    
    # Log the action
    log = models.InventoryLog(product_id=product.id, action="LINK", quantity=0, user_id=user_id)
    db.add(log)
    db.commit()
    return {"message": "Tag linked successfully"}

@app.post("/api/scan-action")
def scan_action(request: dict, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    user_id = current_user.get("id")
    tag_id = request.get("tag_id", "").strip()
    action = request.get("action")
    quantity = int(request.get("quantity", 1))

    product = db.query(models.Product).filter(models.Product.tag_id == tag_id, models.Product.user_id == user_id).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"No product mapped to tag: {tag_id} or not owned by user")

    if action == "IN":
        product.stock += quantity
    elif action == "OUT":
        if product.stock < quantity:
            raise HTTPException(status_code=400, detail="Not enough stock")
        product.stock -= quantity

    log = models.InventoryLog(
        product_id=product.id,
        action=action,
        quantity=quantity,
        user_id=user_id
    )

    db.add(log)
    db.commit()
    db.refresh(product)

    return {
        "product": {
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "new_stock": product.stock,
            "price": product.price
        }
    }

@app.post("/api/scan")
def scan_product(payload: dict, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    from datetime import datetime
    user_id = current_user.get("id")
    tag_id = payload.get("tag_id")

    # Find product by tag_id and user_id
    product = db.query(models.Product).filter(models.Product.tag_id == tag_id, models.Product.user_id == user_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found or not owned by user")

    if product.stock <= 0:
        raise HTTPException(status_code=400, detail="Out of stock")

    # Decrement stock and update timestamp
    product.stock -= 1
    product.last_scanned = datetime.utcnow()

    # Log the action
    log = models.InventoryLog(product_id=product.id, action="OUT", quantity=1, user_id=user_id)
    db.add(log)
    
    db.commit()
    db.refresh(product)

    return {
        "id": product.id,
        "sku": product.sku,
        "name": product.name,
        "category": product.category,
        "price": product.price,
        "remaining_stock": product.stock
    }

@app.put("/api/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    user_id = current_user.get("id")
    product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.user_id == user_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or not owned by user")
    
    for var, value in product_update.dict(exclude_unset=True).items():
        setattr(product, var, value)
    
    try:
        db.commit()
        db.refresh(product)
    except Exception as e:
        db.rollback()
        # Check if it's a uniqueness constraint violation
        if "Duplicate entry" in str(e) or "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail="This Tag ID is already linked to another of your products.")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return product

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    user_id = current_user.get("id")
    product = db.query(models.Product).filter(models.Product.id == product_id, models.Product.user_id == user_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or not owned by user")
    
    try:
        # Delete associated logs first to avoid FK constraint issues
        db.query(models.InventoryLog).filter(models.InventoryLog.product_id == product_id, models.InventoryLog.user_id == user_id).delete(synchronize_session=False)
        
        db.delete(product)
        db.commit()
        return {"message": "Product deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Delete Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/products/{product_id}/transaction")
def product_transaction(product_id: int, request: dict, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    action = request.get("action")
    quantity = request.get("quantity", 1)
    
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if action == "IN":
        product.stock += quantity
    elif action == "OUT":
        if product.stock < quantity:
            raise HTTPException(status_code=400, detail="Not enough stock")
        product.stock -= quantity

    log = models.InventoryLog(product_id=product.id, action=action, quantity=quantity)
    db.add(log)
    db.commit()
    db.refresh(product)
    return product

# 🔹 USER ENDPOINTS
@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.User).all()

@app.put("/api/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

# 🔹 NFC SCAN ENDPOINTS (Store raw tag data in XAMPP MySQL)
@app.post("/api/nfc-scan", response_model=schemas.NfcScanResponse)
def create_nfc_scan(scan_data: schemas.NfcScanCreate, db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    user_id = current_user.get("id")
    # Link scan to user's product
    product = db.query(models.Product).filter(models.Product.tag_id == scan_data.serial_number, models.Product.user_id == user_id).first()

    nfc_scan = models.NfcScan(
        serial_number=scan_data.serial_number,
        tag_data=scan_data.tag_data,
        reader_type=scan_data.reader_type,
        product_id=product.id if product else None,
        scanned_by=current_user.get("email"),
        user_id=user_id,
        status="Linked" if product else "Detected"
    )
    db.add(nfc_scan)

    # Also create an inventory log entry for the scan
    if product:
        log = models.InventoryLog(
            product_id=product.id,
            action="SCAN",
            quantity=0,
            status="Completed",
            user_id=user_id
        )
        db.add(log)

    db.commit()
    db.refresh(nfc_scan)

@app.get("/api/nfc-scans", response_model=List[schemas.NfcScanResponse])
def get_nfc_scans(db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    """Get the history of all NFC scans stored in the database."""
    user_id = current_user.get("id")
    return db.query(models.NfcScan).filter(models.NfcScan.user_id == user_id).order_by(models.NfcScan.created_at.desc()).limit(50).all()

# 🔹 LOGS ENDPOINTS
@app.get("/api/logs")
def get_logs(db: Session = Depends(get_db), current_user: dict = Depends(auth.get_current_user)):
    user_id = current_user.get("id")
    logs = db.query(models.InventoryLog).filter(models.InventoryLog.user_id == user_id).order_by(models.InventoryLog.created_at.desc()).all()
    logs_data = []
    for log in logs:
        log_data = {
            "id": log.id,
            "product_id": log.product_id,
            "action": log.action,
            "quantity": log.quantity,
            "status": log.status,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "product": {
                "id": log.product.id,
                "name": log.product.name,
                "sku": log.product.sku,
                "category": log.product.category,
                "tag_id": log.product.tag_id,
                "stock": log.product.stock,
                "price": log.product.price
            } if log.product else None
        }
        logs_data.append(log_data)
    return logs_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
