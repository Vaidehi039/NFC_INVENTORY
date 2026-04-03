from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from passlib.context import CryptContext
from datetime import datetime

import re
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

import os
import auth
from auth import access_role, get_current_user
from schemas import SuperAdminCreate
from dotenv import load_dotenv

load_dotenv()
SUPERADMIN_SECRET = os.getenv("SUPERADMIN_SECRET", "FALLBACK_SECRET")

# =========================
# INCLUDE AUTH ROUTER
# =========================

app.include_router(auth.router)

# =========================
# CREATE SUPERADMIN
# =========================

@app.post("/api/auth/create-superadmin")
def create_superadmin(payload: schemas.SuperAdminCreate, db: Session = Depends(get_db)):
    
    # 1. Validate Secret Key
    if payload.secret_key != SUPERADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid superadmin secret key")

    # 2. Prevent Duplicate SuperAdmins
    existing = db.query(models.User).filter(models.User.role == "superadmin").first()
    if existing:
        raise HTTPException(status_code=403, detail="A SuperAdmin already exists.")

    # 3. Create
    new_super = models.User(
        name=payload.name,
        email=payload.email,
        hashed_password=auth.get_password_hash(payload.password),
        role="superadmin",
        is_active=True
    )

    db.add(new_super)
    db.commit()
    db.refresh(new_super)

    return {"message": "SuperAdmin created successfully", "role": new_super.role}

# =========================
# DASHBOARD
# =========================
from datetime import datetime, timedelta

@app.post("/api/user/status")
def update_user_status(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    status = payload.get("status", "offline")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.status = status
    user.last_seen = datetime.now()
    db.commit()
    return {"message": "Status updated"}

@app.get("/api/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db), auth_user=Depends(access_role(["manager", "admin", "superadmin", "staff"]))):
    # 0. Sync Offline Status (Heartbeat Timeout: 60s)
    threshold = datetime.now() - timedelta(seconds=60)
    db.query(models.User).filter(models.User.last_seen < threshold).update({"status": "offline"})
    db.commit()

    total_items = db.query(models.Product).count()
    total_stock = db.query(func.sum(models.Product.total_stock)).scalar() or 0
    low_stock = db.query(models.Product).filter(models.Product.remaining_stock < 10).count()

    # 1. User Online Tracking
    users = db.query(models.User).all()
    users_data = []
    online_count = 0
    
    for u in users:
        is_online = u.status == "online"
        if is_online:
            online_count += 1
        users_data.append({
            "id": u.id,
            "name": u.name,
            "role": u.role,
            "status": u.status,
            "last_seen": u.last_seen
        })
    
    global_status = "All Users Online" if online_count == len(users) and len(users) > 0 else "Some Users Offline"
    if online_count == 0:
        global_status = "All Users Offline"

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
            "action": log.action or "UNKNOWN",
            "quantity": log.quantity or 0,
            "created_at": log.created_at,
            "status": log.status or "Completed",
            "product_id": log.product_id or 0,
            "product": {
                "id": log.product.id,
                "name": log.product.name or "Deleted Product",
                "sku": log.product.sku or "N/A",
                "category": log.product.category or "Uncategorized",
                "stock": log.product.stock or 0,
                "price": log.product.price or 0.0,
                "tag_id": log.product.tag_id
            } if log.product else None
        })

    # For unified dashboard experience, mix in some recent scans too
    recent_scans = (
        db.query(models.NfcScan)
        .order_by(models.NfcScan.created_at.desc())
        .limit(10)
        .all()
    )
    
    for scan in recent_scans:
        logs_data.append({
            "id": 1000000 + scan.id,
            "action": "SCAN",
            "quantity": 0,
            "status": scan.status or "Detected",
            "created_at": scan.created_at,
            "product_id": scan.product_id or 0,
            "product": {
                "id": scan.product.id,
                "name": scan.product.name or "Unknown Item",
                "sku": scan.product.sku or "N/A",
                "category": scan.product.category or "Scan",
                "stock": scan.product.stock or 0,
                "price": scan.product.price or 0.0,
                "tag_id": scan.product.tag_id or scan.serial_number
            } if scan.product else None
        })
    
    # Sort unified activity by time
    logs_data.sort(key=lambda x: x["created_at"], reverse=True)

    # For the dedicated recent scans list (Live Scans widget)
    scans_data = []
    for scan in recent_scans:
        product_data = None
        if scan.product:
            product_data = {
                "id": scan.product.id,
                "name": scan.product.name or "Unknown Item",
                "sku": scan.product.sku or "N/A"
            }
        else:
            # Fallback for old records or unlinked tags
            matched = db.query(models.Product).filter(models.Product.tag_id == scan.serial_number).first()
            if matched:
                product_data = {
                    "id": matched.id,
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
            "lowStock": low_stock,
            "globalStatus": global_status
        },
        "users": users_data,
        "scans": scans_data,
        "recentActivity": logs_data[:15] # Return top 15 mixed items for dashboard
    }

# =========================
# PRODUCTS
# =========================

@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db), auth_user=Depends(access_role(["manager", "admin", "superadmin"]))):
    return db.query(models.Product).all()


# =========================
# CALCULATION HELPER
# =========================

def apply_product_calculations(product: models.Product):
    product.remaining_stock = product.stock_in - product.stock_out
    product.total_stock = product.stock_in
    product.profit = (product.selling_price - product.purchase_price) * product.stock_out
    product.stock = product.remaining_stock
    # Keep legacy price field in sync
    product.price = product.selling_price

@app.get("/api/product/{tag_id}", response_model=schemas.ProductResponse)
def get_product_by_tag(tag_id: str, db: Session = Depends(get_db), auth_user=Depends(access_role(["manager", "admin", "superadmin", "staff"]))):
    product = db.query(models.Product).filter(models.Product.tag_id == tag_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/api/products", response_model=schemas.ProductResponse)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), auth_user=Depends(access_role(["admin", "superadmin"]))):
    # 🚨 VALIDATION CHECK (already present in the logic below)
    # 🚨 VALIDATION CHECK
    is_valid, error_msg = check_product_validity(db, product.name, product.category, product.sku)
    if not is_valid:
        raise HTTPException(status_code=403, detail=error_msg)

    # Check if SKU already exists
    existing_sku = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if existing_sku:
        raise HTTPException(status_code=400, detail="⚠️ Product already exists with this SKU")

    db_product = models.Product(**product.dict())
    apply_product_calculations(db_product)
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # Log the creation/initial stock
    log = models.InventoryLog(
        user_id=None,
        product_id=db_product.id,
        action="IN",
        quantity=db_product.stock,
        status="Product Registered"
    )
    db.add(log)
    db.commit()

    return db_product

@app.post("/api/stock/update")
def stock_update(payload: schemas.StockUpdate, db: Session = Depends(get_db), auth_user=Depends(access_role(["staff", "manager", "admin", "superadmin"]))):
    product = db.query(models.Product).filter(models.Product.id == payload.productId).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    quantity = max(1, payload.quantity)
    if payload.action.upper() == "IN":
        product.stock += quantity
    elif payload.action.upper() == "OUT":
        product.stock = max(0, product.stock - quantity)
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'IN' or 'OUT'")

    apply_product_calculations(product)
    db.commit()

    log = models.InventoryLog(
        user_id=None,
        product_id=product.id,
        action=payload.action.upper(),
        quantity=quantity,
        status="Manual Update"
    )
    db.add(log)
    db.commit()

    return {"message": f"Stock {payload.action.upper()} updated successfully"}

# =========================
# NFC SCAN
# =========================

@app.post("/api/scan")
def scan_product(payload: dict, db: Session = Depends(get_db), auth_user=Depends(access_role(["staff", "manager", "admin", "superadmin"]))):

    tag_id = payload.get("tag_id")

    product = db.query(models.Product).filter(models.Product.tag_id == tag_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock > 0:
        product.stock -= 1

    db.commit()

    # Log the scan-out
    log = models.InventoryLog(
        user_id=None,
        product_id=product.id,
        action="OUT",
        quantity=1,
        status="Completed"
    )
    db.add(log)
    db.commit()

    return {
        "name": product.name,
        "sku": product.sku,
        "remaining_stock": product.stock,
        "price": product.price
    }

# =========================
# VALIDATION HELPER
# =========================

def log_invalid_attempt(db: Session, email: Optional[str], item_name: str, details: str, reason: str):
    attempt = models.InvalidAttempt(
        email=email,
        item_name=item_name,
        attempt_details=details,
        reason=reason
    )
    db.add(attempt)
    db.commit()

def check_product_validity(db: Session, name: str, category: str, sku: str, email: Optional[str] = None):
    # 🕵️ SPAM & MEANINGFUL DATA CHECK
    name = (name or "").strip()
    sku = (sku or "").strip()
    category = (category or "").strip()

    # Rule 1: No excessive repeated characters (max 3 consecutive)
    # Regex: (Any char) followed by 3 or more of the SAME char -> Reject
    if re.search(r'(.)\1{3,}', name) or re.search(r'(.)\1{3,}', sku):
        log_invalid_attempt(db, email, name, "Repeated character spam detected.", "SPAM_DATA")
        return False, "Invalid product name. Please enter a valid name"

    # Rule 2: Length (3-50 chars)
    if len(name) < 3 or len(name) > 50:
        log_invalid_attempt(db, email, name, f"Invalid length: {len(name)}", "LENGTH_ERROR")
        return False, "Product name must be 3–50 characters"

    # Rule 3: Reject if entire string is ONE repeated alphanumeric character
    if re.match(r'^([a-zA-Z0-9])\1+$', name) or re.search(r'(.+)\1{2,}', name):
        log_invalid_attempt(db, email, name, "Repeating pattern spam (e.g. ghghgh).", "SPAM_DATA")
        return False, "Invalid product name. Please enter a valid name"

    # Rule 4: Stricter Category Whitelist & Pattern
    ALLOWED_CATEGORIES = ["Electronics", "Clothing", "Grocery", "Stationery", "Accessories"]
    
    # 🕵️ CATEGORY QUALITY CHECKS (Vowels, Patterns, Alpha)
    # - Length: 3-20, Alpha only
    # - At least TWO vowels (e.g. "Electronics" has 4)
    # - No alternating spam like "dhdh" or "abcabc"
    # - Must be in whitelist
    is_valid_pattern = (
        re.match(r'^[A-Za-z ]+$', category) and
        re.search(r'[aeiouAEIOU].*[aeiouAEIOU]', category) and
        not re.search(r'(.)\1{3,}', category) and
        not re.match(r'^([a-zA-Z]{1,2})\1+$', category) and
        (3 <= len(category) <= 50)
    )

    if not is_valid_pattern or category not in ALLOWED_CATEGORIES:
        log_invalid_attempt(db, email, name, f"Invalid category: {category}", "CATEGORY_ERROR")
        return False, "Invalid category name"
    # Check Restricted List (is_allowed = 0)
    restricted = db.query(models.ValidationRule).filter(
        models.ValidationRule.is_allowed == 0,
        (
            ((models.ValidationRule.type == "name") & (models.ValidationRule.value == name)) |
            ((models.ValidationRule.type == "category") & (models.ValidationRule.value == category)) |
            ((models.ValidationRule.type == "sku") & (models.ValidationRule.value == sku))
        )
    ).first()

    if restricted:
        log_invalid_attempt(db, email, name, f"Type: {restricted.type}, Value: {restricted.value}", "RESTRICTED")
        return False, f"Unauthorized: {restricted.type} '{restricted.value}' is restricted."

    # If there are ANY allowed rules (is_allowed = 1), the product MUST match one
    allowed_count = db.query(models.ValidationRule).filter(models.ValidationRule.is_allowed == 1).count()
    if allowed_count > 0:
        allowed = db.query(models.ValidationRule).filter(
            models.ValidationRule.is_allowed == 1,
            (
                ((models.ValidationRule.type == "name") & (models.ValidationRule.value == name)) |
                ((models.ValidationRule.type == "category") & (models.ValidationRule.value == category)) |
                ((models.ValidationRule.type == "sku") & (models.ValidationRule.value == sku))
            )
        ).first()
        if not allowed:
            log_invalid_attempt(db, email, name, f"Name: {name}, Cat: {category}, SKU: {sku}", "NOT_ALLOWED")
            return False, "Unauthorized: Product/Category not in allowed list."

    return True, None

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

    # Log the link
    log = models.InventoryLog(
        user_id=None,
        product_id=product_id,
        action="LINK",
        quantity=0,
        status="Completed"
    )
    db.add(log)
    db.commit()

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
        product.stock_in += quantity
    elif action == "OUT":
        product.stock_out += quantity
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    apply_product_calculations(product)
    
    db.commit()
    db.refresh(product)

    # Log the action
    log = models.InventoryLog(
        user_id=None,
        product_id=product.id,
        action=action,
        quantity=quantity,
        status="Completed"
    )
    db.add(log)
    db.commit()

    return product

# =========================
# PRODUCT UPDATE/DELETE/TRANSACTION
# =========================
@app.put("/api/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db), auth_user=Depends(access_role(["manager", "admin", "superadmin"]))):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in product.dict(exclude_unset=True).items():
        setattr(db_product, key, value)
    
    apply_product_calculations(db_product)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), auth_user=Depends(access_role(["admin", "superadmin"]))):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted"}

@app.post("/api/products/{product_id}/transaction")
def product_transaction(product_id: int, action: str, quantity: int, db: Session = Depends(get_db), auth_user=Depends(access_role(["manager", "admin", "superadmin"]))):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    if action == "IN":
        db_product.stock_in += quantity
    elif action == "OUT":
        db_product.stock_out += quantity
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    apply_product_calculations(db_product)
    
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
@app.post("/api/users", response_model=schemas.UserResponse)
def create_management_user(user: schemas.UserCreate, db: Session = Depends(get_db), auth_user=Depends(access_role(["admin", "superadmin"]))):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Admins can create staff OR managers, but NOT admins/superadmins
    target_role = user.role if user.role in ["staff", "manager"] else "staff"
    
    # Superadmin can create anyone? Usually yes, but keep it safe.
    if auth_user.get("role") == "admin":
        target_role = user.role if user.role in ["staff", "manager"] else "staff"
    else:
        target_role = user.role or "staff"

    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=auth.get_password_hash(user.password),
        role=target_role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db), auth_user=Depends(access_role(["admin", "superadmin", "manager"]))):
    return db.query(models.User).all()

@app.put("/api/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db), auth_user=Depends(get_current_user)):
    # auth_user = payload from JWT
    current_role = auth_user.get("role")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # LOGIC:
    # 1. SuperAdmin can update anything.
    # 2. Admin can block/unblock STAFF only.
    # 3. Nobody else can do this.
    
    if current_role == "superadmin":
        pass # All good
    elif current_role == "admin":
        if db_user.role == "superadmin":
            raise HTTPException(status_code=403, detail="Admins cannot modify Superadmins")
        if user.role and user.role != db_user.role:
            raise HTTPException(status_code=403, detail="Admins cannot change roles. Superadmin only.")
    else:
        raise HTTPException(status_code=403, detail="Forbidden: Unauthorized user management")

    for key, value in user.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), auth_user=Depends(access_role(["superadmin"]))):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Restricted: Only Superadmin can delete Users in the latest request.
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
def get_nfc_scans(db: Session = Depends(get_db), auth_user=Depends(access_role(["manager", "admin", "superadmin", "staff"]))):
    return db.query(models.NfcScan).all()

# =========================
# LOGS GET
# =========================
@app.get("/api/logs", response_model=List[schemas.InventoryLogResponse])
def get_logs(db: Session = Depends(get_db), auth_user=Depends(access_role(["manager", "admin", "superadmin"]))):
    try:
        # Get all inventory logs
        inventory_logs = db.query(models.InventoryLog).all()
        
        # Get all scans but map them to the same format
        nfc_scans = db.query(models.NfcScan).all()
        
        merged_logs = []
        
        # Add manual transactions/stock updates (with safe null-handling)
        for log in inventory_logs:
            merged_logs.append({
                "id": log.id,
                "product_id": log.product_id or 0,
                "action": log.action or "UNKNOWN",
                "quantity": log.quantity or 0,
                "status": log.status or "Completed",
                "created_at": log.created_at or datetime.now(),
                "product": {
                    "id": log.product.id,
                    "name": log.product.name or "Deleted Product",
                    "sku": log.product.sku or "N/A",
                    "category": log.product.category or "General",
                    "stock": log.product.stock or 0,
                    "price": float(log.product.price or 0.0),
                    "tag_id": log.product.tag_id
                } if log.product else None,
                "tag_data": None
            })
            
        # Add raw scan activities (with safe null-handling)
        for scan in nfc_scans:
            merged_logs.append({
                "id": 1000000 + scan.id, # Ensure unique IDs for the frontend
                "product_id": scan.product_id or 0,
                "action": "SCAN",
                "quantity": 0,
                "status": scan.status or "Detected",
                "created_at": scan.created_at or datetime.now(),
                "product": {
                    "id": scan.product.id,
                    "name": scan.product.name or "Unknown Tag",
                    "sku": scan.product.sku or "N/A",
                    "category": scan.product.category or "Scan",
                    "stock": scan.product.stock or 0,
                    "price": float(scan.product.price or 0.0),
                    "tag_id": scan.product.tag_id or scan.serial_number
                } if scan.product else None,
                "tag_data": scan.tag_data
            })
            
        # Sort by time descending
        merged_logs.sort(key=lambda x: x["created_at"] if x["created_at"] else datetime.min, reverse=True)
        
        return merged_logs
    except Exception as e:
        print(f"Error in get_logs: {str(e)}")
        # Fallback to avoid complete failure
        return []

# =========================
# ADMIN VALIDATION CONFIG
# =========================

@app.post("/api/admin/validation-rules", response_model=schemas.ValidationRuleResponse)
def add_validation_rule(rule: schemas.ValidationRuleCreate, db: Session = Depends(get_db)):
    db_rule = models.ValidationRule(**rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@app.get("/api/admin/validation-rules", response_model=List[schemas.ValidationRuleResponse])
def get_validation_rules(db: Session = Depends(get_db)):
    return db.query(models.ValidationRule).all()

@app.delete("/api/admin/validation-rules/{rule_id}")
def delete_validation_rule(rule_id: int, db: Session = Depends(get_db)):
    db_rule = db.query(models.ValidationRule).filter(models.ValidationRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(db_rule)
    db.commit()
    return {"message": "Rule deleted"}

@app.get("/api/admin/invalid-attempts", response_model=List[schemas.InvalidAttemptResponse])
def get_invalid_attempts(db: Session = Depends(get_db)):
    return db.query(models.InvalidAttempt).order_by(models.InvalidAttempt.created_at.desc()).all()


if __name__ == "__main__":
    import uvicorn
    # Using port 8000 as configured in the frontend and network scripts
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)