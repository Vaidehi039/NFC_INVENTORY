from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(String(50), default="user")
    is_active = Column(Integer, default=1)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Linked to owner
    name = Column(String(255))
    sku = Column(String(100))
    category = Column(String(100))
    tag_id = Column(String(100))
    stock = Column(Integer, default=0)
    price = Column(Integer)
    last_scanned = Column(DateTime)

    user = relationship("User", backref="products")

    __table_args__ = (UniqueConstraint('tag_id', 'user_id', name='_tag_user_uc'),)

class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    action = Column(String(50))
    quantity = Column(Integer)
    status = Column(String(50), default="Completed")
    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product", backref="logs", lazy="joined")
    user = relationship("User", backref="logs")


class NfcScan(Base):
    __tablename__ = "nfc_scans"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    serial_number = Column(String(255), nullable=False)
    tag_data = Column(Text, nullable=True)          # raw payload from the tag
    reader_type = Column(String(50), default="usb")  # 'web_nfc', 'usb', 'manual'
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    scanned_by = Column(String(255), nullable=True)  # email of the user
    status = Column(String(50), default="Detected")  # Detected / Linked / Error
    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product", backref="scans", lazy="joined")
    user = relationship("User", backref="scans")
