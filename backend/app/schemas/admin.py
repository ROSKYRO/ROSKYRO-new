from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.models.booking import BookingStatus
from app.models.complaint import ComplaintCategory, ComplaintStatus


class CustomerOut(BaseModel):
    id: int
    full_name: str
    phone: str
    email: Optional[str] = None
    preferred_language: str
    is_active: bool
    created_at: datetime
    total_bookings: int

    class Config:
        from_attributes = True


class AdminBookingOut(BaseModel):
    id: int
    booking_code: str
    customer_name: str
    customer_phone: str
    agent_name: Optional[str] = None
    service_name: str
    status: BookingStatus
    scheduled_start: datetime
    booked_hours: float
    total_amount: Optional[float] = None
    sos_triggered: bool
    created_at: datetime


class ComplaintOut(BaseModel):
    id: int
    name: str
    phone: str
    booking_code: Optional[str] = None
    category: ComplaintCategory
    message: str
    status: ComplaintStatus
    is_priority: bool
    resolution_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintUpdateIn(BaseModel):
    status: ComplaintStatus
    resolution_note: Optional[str] = None


class TeamMemberOut(BaseModel):
    id: int
    full_name: str
    phone: str
    email: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TeamMemberCreateIn(BaseModel):
    full_name: str
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    role: str = Field(default="support", pattern="^(admin|support)$")


class TeamMemberUpdateIn(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = Field(default=None, pattern="^(admin|support)$")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6)


class AdminMembershipOut(BaseModel):
    id: int
    member_code: str
    plan: str
    status: str
    monthly_price_snapshot: float
    started_at: datetime
    next_billing_date: Optional[datetime] = None
    customer_name: str
    customer_phone: str
    family_member_count: int

    class Config:
        from_attributes = True


class AdminMembershipStatusIn(BaseModel):
    status: str = Field(..., pattern="^(pending|active|paused|cancelled|expired)$")


class AdminInvoiceOut(BaseModel):
    id: int
    membership_id: int
    period_start: datetime
    period_end: datetime
    amount: float
    status: str
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- Priority Access Network (admin) ----------

class AdminPartnerApplicationOut(BaseModel):
    id: int
    partner_type: str
    name: str
    city: str
    area: Optional[str] = None
    address: Optional[str] = None
    contact_number: str
    whatsapp: Optional[str] = None
    email: Optional[str] = None
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
    status: str
    review_notes: Optional[str] = None
    submitted_at: datetime

    class Config:
        from_attributes = True


class AdminApplicationReviewIn(BaseModel):
    approve: bool
    review_notes: Optional[str] = None


class AdminPartnerOut(BaseModel):
    id: int
    source_application_id: Optional[int] = None
    partner_type: str
    name: str
    city: str
    area: Optional[str] = None
    address: Optional[str] = None
    contact_number: str
    whatsapp: Optional[str] = None
    email: Optional[str] = None
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
    internal_notes: Optional[str] = None
    approved_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class AdminPartnerUpdateIn(BaseModel):
    partner_status: Optional[str] = Field(default=None, pattern="^(active|temporarily_unavailable|inactive)$")
    priority_access_status: Optional[str] = Field(default=None, pattern="^(available|not_available|by_request)$")
    internal_notes: Optional[str] = None
    consultation_fee: Optional[float] = None
    priority_fee: Optional[float] = None


class AdminAppointmentRequestOut(BaseModel):
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


class AdminAppointmentRequestUpdateIn(BaseModel):
    status: str = Field(..., pattern="^(requested|confirmed|cancelled)$")
    concierge_notes: Optional[str] = None


# ---------- Quick Add (manual entry for WhatsApp/phone-origin activity) ----------

class AdminPartnerQuickAddIn(BaseModel):
    partner_type: str = Field(..., pattern="^(doctor|hospital)$")
    name: str
    city: str
    area: Optional[str] = None
    address: Optional[str] = None
    contact_number: str
    whatsapp: Optional[str] = None
    email: Optional[str] = None
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
    internal_notes: Optional[str] = None


class AdminAppointmentQuickAddIn(BaseModel):
    partner_id: int
    patient_name: str
    patient_phone: str
    preferred_time: Optional[str] = None
    notes: Optional[str] = None
    status: str = Field(default="requested", pattern="^(requested|confirmed|cancelled)$")
    concierge_notes: Optional[str] = None


class AdminMembershipQuickAddIn(BaseModel):
    full_name: str
    phone: str
    plan: str = Field(..., pattern="^(care|family|nri)$")
    mark_as_paid: bool = True   # ROSKYRO already collected payment over WhatsApp/UPI


class AdminMembershipQuickAddOut(BaseModel):
    membership: AdminMembershipOut
    account_created: bool
    temp_password: Optional[str] = None  # only returned when a new account was created — share with the member once
