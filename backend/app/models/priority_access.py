import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Float, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class PartnerType(str, enum.Enum):
    doctor = "doctor"
    hospital = "hospital"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"        # ⚪ Pending verification
    approved = "approved"
    rejected = "rejected"


class PartnerStatus(str, enum.Enum):
    active = "active"                      # 🟢
    temporarily_unavailable = "temporarily_unavailable"  # 🟡
    inactive = "inactive"                  # 🔴


class PriorityAccessAvailability(str, enum.Enum):
    available = "available"
    not_available = "not_available"
    by_request = "by_request"


class AppointmentRequestStatus(str, enum.Enum):
    requested = "requested"
    confirmed = "confirmed"
    cancelled = "cancelled"


class PartnerApplication(Base):
    """A doctor/hospital's self-submitted request to become a ROSKYRO
    Priority Access Partner. Public can submit; only admin can see the full
    record and approve/reject it."""
    __tablename__ = "partner_applications"

    id = Column(Integer, primary_key=True, index=True)

    partner_type = Column(Enum(PartnerType), nullable=False)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False, index=True)
    area = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    contact_number = Column(String, nullable=False)
    whatsapp = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    maps_link = Column(String, nullable=True)

    specialty = Column(String, nullable=True, index=True)
    sub_specialty = Column(String, nullable=True)
    qualification = Column(String, nullable=True)
    affiliation = Column(String, nullable=True)
    consultation_fee = Column(Float, nullable=True)
    priority_fee = Column(Float, nullable=True)
    priority_slots = Column(String, nullable=True)
    available_days = Column(String, nullable=True)
    available_timings = Column(String, nullable=True)

    departments = Column(Text, nullable=True)
    specialists = Column(Text, nullable=True)
    opd_timings = Column(String, nullable=True)
    emergency_available = Column(Boolean, nullable=True)
    concierge_desk_contact = Column(String, nullable=True)

    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.pending, nullable=False)
    review_notes = Column(Text, nullable=True)     # admin-only, never shown publicly
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    submitted_at = Column(DateTime, default=datetime.utcnow)

    reviewed_by = relationship("User")
    partner = relationship("Partner", back_populates="source_application", uselist=False)


class Partner(Base):
    """A live, approved ROSKYRO Priority Access Partner — what patients see
    in the public directory and profile pages."""
    __tablename__ = "priority_partners"

    id = Column(Integer, primary_key=True, index=True)
    source_application_id = Column(Integer, ForeignKey("partner_applications.id"), unique=True, nullable=True)

    partner_type = Column(Enum(PartnerType), nullable=False)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False, index=True)
    area = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    contact_number = Column(String, nullable=False)
    whatsapp = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    maps_link = Column(String, nullable=True)

    specialty = Column(String, nullable=True, index=True)
    sub_specialty = Column(String, nullable=True)
    qualification = Column(String, nullable=True)
    affiliation = Column(String, nullable=True)
    consultation_fee = Column(Float, nullable=True)
    priority_fee = Column(Float, nullable=True)
    priority_slots = Column(String, nullable=True)
    available_days = Column(String, nullable=True)
    available_timings = Column(String, nullable=True)

    departments = Column(Text, nullable=True)
    specialists = Column(Text, nullable=True)
    opd_timings = Column(String, nullable=True)
    emergency_available = Column(Boolean, nullable=True)
    concierge_desk_contact = Column(String, nullable=True)

    partner_status = Column(Enum(PartnerStatus), default=PartnerStatus.active, nullable=False)
    priority_access_status = Column(Enum(PriorityAccessAvailability), default=PriorityAccessAvailability.available, nullable=False)
    internal_notes = Column(Text, nullable=True)  # commercial terms etc. — admin-only, never serialized publicly

    approved_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    source_application = relationship("PartnerApplication", back_populates="partner")
    appointment_requests = relationship("AppointmentRequest", back_populates="partner", cascade="all, delete-orphan")

    @property
    def is_publicly_visible(self) -> bool:
        return self.partner_status != PartnerStatus.inactive


class AppointmentRequest(Base):
    """Patient's 'Request Priority Appointment' — concierge-mediated, not
    an automated booking (Phase 1 scope, per the agreed design)."""
    __tablename__ = "priority_appointment_requests"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("priority_partners.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    patient_name = Column(String, nullable=False)
    patient_phone = Column(String, nullable=False)
    preferred_time = Column(String, nullable=True)  # free text — "tomorrow morning", "15 Sep, afternoon"
    notes = Column(Text, nullable=True)

    status = Column(Enum(AppointmentRequestStatus), default=AppointmentRequestStatus.requested, nullable=False)
    assigned_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    concierge_notes = Column(Text, nullable=True)   # e.g. confirmed slot + fee + priority fee, shared back to patient

    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    partner = relationship("Partner", back_populates="appointment_requests")
    user = relationship("User", foreign_keys=[user_id])
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id])
