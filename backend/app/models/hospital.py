import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, Float, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class HospitalContractStatus(str, enum.Enum):
    prospect = "prospect"      # in discussion, not yet signed
    active = "active"          # signed, live on the platform
    paused = "paused"          # temporarily off (non-payment, off-boarding, etc.)
    churned = "churned"


class Hospital(Base):
    """
    A partner hospital using ROSKYRO Hospital Console (Concierge-as-a-Service +
    Technology). Families pick a hospital when booking ROSKYRO Assist; hospital
    staff log into their own console scoped to this record only.
    """
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)
    address = Column(Text, nullable=True)

    contact_name = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)

    contract_status = Column(Enum(HospitalContractStatus), default=HospitalContractStatus.prospect, nullable=False)
    monthly_contract_amount = Column(Float, nullable=True)  # ₹25K–₹75K+/month tier, per FINAL REVENUE ARCHITECTURE

    is_active = Column(Boolean, default=True)  # quick on/off switch, independent of contract_status
    logo_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City")
    staff = relationship("User", back_populates="hospital")
    bookings = relationship("Booking", back_populates="hospital")
