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
    A partner hospital in the ROSKYRO Hospital Concierge Program. Hospital staff
    log into their own Hospital Console (scoped to this record only) and submit
    short patient details; ROSKYRO assigns a dedicated Relationship Officer for
    each day of the patient's stay (see models/patient_case.py). The hospital
    bills the patient/family its own concierge fee and pays ROSKYRO the fixed
    per_patient_daily_rate set here — the hospital can present the whole thing
    to families as "our concierge service, managed by ROSKYRO".
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
    monthly_contract_amount = Column(Float, nullable=True)  # optional flat retainer, if the contract has one

    # The core of the concierge-program billing model: a fixed amount this
    # hospital pays ROSKYRO for every patient, for every day a dedicated
    # Relationship Officer is assigned to them. Snapshotted onto each
    # PatientCase at intake so a later rate change never rewrites history.
    per_patient_daily_rate = Column(Float, nullable=True)

    is_active = Column(Boolean, default=True)  # quick on/off switch, independent of contract_status
    logo_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City")
    staff = relationship("User", back_populates="hospital")
    patients = relationship("PatientCase", back_populates="hospital", cascade="all, delete-orphan")
    invoices = relationship("HospitalInvoice", back_populates="hospital", cascade="all, delete-orphan")
