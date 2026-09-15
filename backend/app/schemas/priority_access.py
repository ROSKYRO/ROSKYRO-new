from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------- Public: application (become a partner) ----------

class PartnerApplicationIn(BaseModel):
    partner_type: str = Field(..., description="doctor | hospital")
    name: str
    city: str
    area: Optional[str] = None
    address: Optional[str] = None
    contact_number: str
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    maps_link: Optional[str] = None

    # Doctor fields
    specialty: Optional[str] = None
    sub_specialty: Optional[str] = None
    qualification: Optional[str] = None
    affiliation: Optional[str] = None
    consultation_fee: Optional[float] = None
    priority_fee: Optional[float] = None
    priority_slots: Optional[str] = None
    available_days: Optional[str] = None
    available_timings: Optional[str] = None

    # Hospital fields
    departments: Optional[str] = None
    specialists: Optional[str] = None
    opd_timings: Optional[str] = None
    emergency_available: Optional[bool] = None
    concierge_desk_contact: Optional[str] = None


class PartnerApplicationOut(BaseModel):
    id: int
    partner_type: str
    name: str
    city: str
    status: str
    submitted_at: datetime

    class Config:
        from_attributes = True


# ---------- Public: directory / profile ----------
# Deliberately excludes internal_notes / review_notes / contact_number in
# the summary card — full contact detail only on the profile page, nothing
# commercial-terms ever, per the admin-only-vs-public split.

class PartnerSummaryOut(BaseModel):
    id: int
    partner_type: str
    name: str
    city: str
    area: Optional[str] = None
    specialty: Optional[str] = None
    departments: Optional[str] = None
    affiliation: Optional[str] = None
    consultation_fee: Optional[float] = None
    priority_fee: Optional[float] = None
    partner_status: str
    priority_access_status: str

    class Config:
        from_attributes = True


class PartnerDetailOut(BaseModel):
    id: int
    partner_type: str
    name: str
    city: str
    area: Optional[str] = None
    address: Optional[str] = None
    contact_number: str
    whatsapp: Optional[str] = None
    website: Optional[str] = None
    maps_link: Optional[str] = None

    specialty: Optional[str] = None
    sub_specialty: Optional[str] = None
    qualification: Optional[str] = None
    affiliation: Optional[str] = None
    consultation_fee: Optional[float] = None
    priority_fee: Optional[float] = None
    priority_slots: Optional[str] = None
    available_days: Optional[str] = None
    available_timings: Optional[str] = None

    departments: Optional[str] = None
    specialists: Optional[str] = None
    opd_timings: Optional[str] = None
    emergency_available: Optional[bool] = None
    concierge_desk_contact: Optional[str] = None

    partner_status: str
    priority_access_status: str

    class Config:
        from_attributes = True


# ---------- Public: appointment request (requires login, like bookings) ----------

class AppointmentRequestIn(BaseModel):
    partner_id: int
    patient_name: str
    patient_phone: str
    preferred_time: Optional[str] = None
    notes: Optional[str] = None


class AppointmentRequestOut(BaseModel):
    id: int
    partner_id: int
    patient_name: str
    patient_phone: str
    preferred_time: Optional[str] = None
    notes: Optional[str] = None
    status: str
    concierge_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
