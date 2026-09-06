import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class UserRole(str, enum.Enum):
    customer = "customer"
    admin = "admin"
    support = "support"


class User(Base):
    """A customer (or internal staff) account on ROSKYRO."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    preferred_language = Column(String, default="en")  # en / hi / bho etc.
    role = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="customer")
