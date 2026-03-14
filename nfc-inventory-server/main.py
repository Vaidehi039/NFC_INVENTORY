from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from passlib.context import CryptContext

import models
import schemas
import database
from database import engine, get_db, Base

# =========================
# CREATE TABLES
# =========================

Base.metadata.create_all(bind=engine)

app = FastAPI(title="NFC Inventory API")

# =========================
# PASSWORD HASHING
# =========================

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# HOME
# =========================

@app.get("/")
def home():
    return {"message": "NFC Inventory API Running"}

# =========================
# CREATE ADMIN USER
# =========================

@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        superadmin = db.query(models.User).filter(models.User.email == "admin@example.com").first()
        if not superadmin:
            superadmin = models.User(
                name="Superadmin",
                email="admin@example.com",
                hashed_password=pwd_context.hash("password123"),
                role="superadmin",
                is_active=True
            )
            db.add(superadmin)
            db.commit()
    finally:
        db.close()

# =========================
# REGISTER
# =========================

@app.post("/api/auth/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):

    existing = db.query(models.User).filter(models.User.email == user.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)

    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role="user",
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}

# =========================
# LOGIN
# =========================

@app.post("/api/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": "demo_token",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        }
    }

# =========================
# DASHBOARD
# =========================

@app.get("/api/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):

    total_items = db.query(models.Product).count()

    total_stock = db.query(func.sum(models.Product.stock)).scalar() or 0

    low_stock = db.query(models.Product).filter(models.Product.stock < 10).count()

    recent_logs = (
        db.query(models.InventoryLog)
        .order_by(models.InventoryLog.created_at.desc())
        .limit(10)
        .all()
    )

    logs_data = []

    for log in recent_logs:
        logs_data.append({
            "id": log.id,
            "action": log.action,
            "quantity": log.quantity,
            "created_at": log.created_at,
            "product": {
                "name": log.product.name,
                "sku": log.product.sku
            } if log.product else None
        })

    # For recent scans
    recent_scans = (
        db.query(models.NfcScan)
        .order_by(models.NfcScan.created_at.desc())
        .limit(10)
        .all()
    )
    
    scans_data = []
    for scan in recent_scans:
        product_data = None
        if scan.product:
            product_data = {
                "name": scan.product.name,
                "sku": scan.product.sku
            }
        else:
            # Fallback for old records that didn't save product_id
            matched = db.query(models.Product).filter(models.Product.tag_id == scan.serial_number).first()
            if matched:
                product_data = {
                    "name": matched.name,
                    "sku": matched.sku
                }
                
        scans_data.append({
            "id": scan.id,
            "serial_number": scan.serial_number,
            "reader_type": scan.reader_type,
            "created_at": scan.created_at,
            "product": product_data
        })

    return {
        "stats": {
            "totalItems": total_items,
            "totalStock": total_stock,
            "lowStock": low_stock
        },
        "scans": scans_data,
        "recentActivity": logs_data
    }

# =========================
# PRODUCTS
# =========================

@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@app.get("/api/product/{tag_id}", response_model=schemas.ProductResponse)
def get_product_by_tag(tag_id: str, db: Session = Depends(get_db)):

    product = db.query(models.Product).filter(models.Product.tag_id == tag_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@app.post("/api/products", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):

    db_product = models.Product(**product.dict())

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product

# =========================
# NFC SCAN
# =========================

@app.post("/api/scan")
def scan_product(payload: dict, db: Session = Depends(get_db)):

    tag_id = payload.get("tag_id")

    product = db.query(models.Product).filter(models.Product.tag_id == tag_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock > 0:
        product.stock -= 1

    db.commit()

    return {
        "name": product.name,
        "sku": product.sku,
        "remaining_stock": product.stock,
        "price": product.price
    }

# =========================
# LINK TAG
# =========================
@app.post("/api/link-tag")
def link_tag(product_id: int, tag_id: str, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db_product.tag_id = tag_id
    db.commit()
    db.refresh(db_product)
    return db_product

# =========================
# SCAN ACTION
# =========================
@app.post("/api/scan-action")
def scan_action(payload: dict, db: Session = Depends(get_db)):
    tag_id = payload.get("tag_id")
    action = payload.get("action")
    quantity = payload.get("quantity")
    
    product = db.query(models.Product).filter(models.Product.tag_id == tag_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if action == "IN":
        product.stock += quantity
    elif action == "OUT":
        product.stock = max(product.stock - quantity, 0)
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    db.commit()
    db.refresh(product)
    return product

# =========================
# PRODUCT UPDATE/DELETE/TRANSACTION
# =========================
@app.put("/api/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in product.dict(exclude_unset=True).items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted"}

@app.post("/api/products/{product_id}/transaction")
def product_transaction(product_id: int, action: str, quantity: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    if action == "IN":
        db_product.stock += quantity
    elif action == "OUT":
        db_product.stock = max(db_product.stock - quantity, 0)
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    db.commit()
    db.refresh(db_product)
    log = models.InventoryLog(
        user_id=None,
        product_id=product_id,
        action=action,
        quantity=quantity,
        status="Completed"
    )
    db.add(log)
    db.commit()
    return db_product

# =========================
# USER GET/UPDATE/DELETE
# =========================
@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.put("/api/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in user.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted"}

# =========================
# NFC SCAN CREATE/GET
# =========================
@app.post("/api/nfc-scan", response_model=schemas.NfcScanResponse)
def create_nfc_scan(scan: schemas.NfcScanCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.tag_id == scan.serial_number).first()
    
    db_scan = models.NfcScan(
        serial_number=scan.serial_number,
        tag_data=scan.tag_data,
        reader_type=scan.reader_type,
        product_id=product.id if product else None
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    return db_scan

@app.get("/api/nfc-scans", response_model=List[schemas.NfcScanResponse])
def get_nfc_scans(db: Session = Depends(get_db)):
    return db.query(models.NfcScan).all()

# =========================
# LOGS GET
# =========================
@app.get("/api/logs", response_model=List[schemas.InventoryLogResponse])
def get_logs(db: Session = Depends(get_db)):
    return db.query(models.InventoryLog).order_by(models.InventoryLog.created_at.desc()).all()