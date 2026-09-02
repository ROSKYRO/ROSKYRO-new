import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Float, ForeignKey

from app.db.session import Base
from sqlalchemy.orm import relationship


class PaymentStatus(str, enum.Enum):
    pending = "pending"      # generated after End PIN, awaiting customer payment
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class PaymentMethod(str, enum.Enum):
    upi = "upi"
    cash = "cash"           # discouraged/blocked for agents by policy, kept for admin overrides


class Payment(Base):
    """Pay-after-service billing record, generated once a booking's End PIN is confirmed."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(Enum(PaymentMethod), default=PaymentMethod.upi)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    upi_reference = Column(String, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="payment")
