import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class UserRole(str, enum.Enum):
    customer = "customer"
    admin = "admin"
    support = "support"
    hospital_staff = "hospital_staff"  # logs into the Hospital Console, scoped to hospital_id


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

    # Only set for role == hospital_staff — which Hospital Console this login belongs to.
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)

    bookings = relationship("Booking", back_populates="customer")
    hospital = relationship("Hospital", back_populates="staff")
