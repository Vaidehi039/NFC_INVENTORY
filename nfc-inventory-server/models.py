from sqlalchemy import Column, Integer, String, ForeignKey, Text, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from sqlalchemy.orm import relationship
from database import Base


# =========================
# USER TABLE
# =========================

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255))

    email = Column(String(255), unique=True, index=True)

    hashed_password = Column(String(255))

    role = Column(String(50), default="user")

    is_active = Column(Integer, default=1)


# =========================
# PRODUCT TABLE
# =========================

class Product(Base):

    __tablename__ = "products"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    name = Column(String(255))

    sku = Column(String(100), unique=True, index=True)

    category = Column(String(100))

    tag_id = Column(String(100), nullable=True)

    stock = Column(Integer, default=0)

    price = Column(Integer)

    last_scanned = Column(DateTime)

    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", backref="products")

    scans = relationship("NfcScan", back_populates="product")

    logs = relationship("InventoryLog", back_populates="product")

    __table_args__ = (
        UniqueConstraint("tag_id", "user_id", name="_tag_user_uc"),
    )


# =========================
# INVENTORY TRANSACTION LOG
# =========================

class InventoryLog(Base):

    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    product_id = Column(Integer, ForeignKey("products.id"))

    action = Column(String(50))

    quantity = Column(Integer)

    status = Column(String(50), default="Completed")

    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product", back_populates="logs", lazy="joined")

    user = relationship("User", backref="logs")


# =========================
# NFC SCAN LOG TABLE
# =========================

class NfcScan(Base):

    __tablename__ = "nfc_scans"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    serial_number = Column(String(255), nullable=False)

    tag_data = Column(Text, nullable=True)

    reader_type = Column(String(50), default="usb")

    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    scanned_by = Column(String(255), nullable=True)

    status = Column(String(50), default="Detected")

    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product", back_populates="scans", lazy="joined")

    user = relationship("User", backref="scans")