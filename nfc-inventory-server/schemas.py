from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    name: Optional[str] = None
    email: str
    role: Optional[str] = "staff"
    is_active: Optional[int] = 1
    status: Optional[str] = "offline"
    last_seen: Optional[datetime] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class SuperAdminCreate(BaseModel):
    name: str
    email: str
    password: str
    secret_key: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[int] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    sku: str
    tag_id: Optional[str] = None
    category: str
    stock: int = 0
    price: float = 0.0
    purchase_price: float = 0.0
    selling_price: float = 0.0
    stock_in: int = 0
    stock_out: int = 0
    remaining_stock: int = 0
    total_stock: int = 0
    profit: float = 0.0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    price: Optional[float] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    stock_in: Optional[int] = None
    stock_out: Optional[int] = None
    tag_id: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True

class InventoryLogBase(BaseModel):
    action: str
    quantity: int
    status: str = "Completed"
    tag_data: Optional[str] = None

class InventoryLogResponse(InventoryLogBase):
    id: int
    product_id: int
    created_at: datetime
    product: Optional[ProductResponse] = None
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    totalItems: int
    totalStock: int
    lowStock: int

class PerformanceData(BaseModel):
    labels: List[str]
    scans: List[int]
    stockLevel: List[int]

class CategoryStat(BaseModel):
    category: str
    count: int

class DashboardResponse(BaseModel):
    stats: DashboardStats
    performance: PerformanceData
    categories: List[CategoryStat]
    recentActivity: List[InventoryLogResponse]


class NfcScanCreate(BaseModel):
    serial_number: str
    tag_data: Optional[str] = None
    reader_type: Optional[str] = "usb"

class NfcScanResponse(BaseModel):
    id: int
    serial_number: str
    tag_data: Optional[str] = None
    reader_type: str
    product_id: Optional[int] = None
    scanned_by: Optional[str] = None
    status: str
    created_at: datetime
    product: Optional[ProductResponse] = None
    class Config:
        from_attributes = True

class ValidationRuleBase(BaseModel):
    type: str # "category", "name", "sku"
    value: str
    is_allowed: int = 1

class ValidationRuleCreate(ValidationRuleBase):
    pass

class ValidationRuleResponse(ValidationRuleBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class StockUpdate(BaseModel):
    productId: int
    action: str  # "IN" or "OUT"
    quantity: int = 1

class InvalidAttemptResponse(BaseModel):
    id: int
    email: Optional[str] = None
    item_name: Optional[str] = None
    attempt_details: Optional[str] = None
    reason: str
    created_at: datetime
    class Config:
        from_attributes = True
