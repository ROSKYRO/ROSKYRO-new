from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from app.models.booking import BookingStatus
from app.models.patient_case import PatientCaseStatus


class OfficerBookingOut(BaseModel):
    """What the officer's no-login capture page shows them — just enough to
    confirm they're looking at the right visit, nothing about billing."""
    booking_code: str
    status: BookingStatus
    customer_name: str
    address: str
    scheduled_start: datetime
    service_name: str
    has_arrival_photo: bool
    has_completion_photo: bool


class OfficerPhotoIn(BaseModel):
    """A photo captured on the officer's phone, base64-encoded (data URL or
    raw base64 — routers/officer.py strips a data: prefix if present), plus
    GPS coordinates when the browser provided them (never required — some
    officers may deny location access, so this degrades gracefully to
    photo + timestamp only)."""
    photo_base64: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class OfficerArrivalOut(BaseModel):
    status: BookingStatus
    message: str


class OfficerCompletionOut(BaseModel):
    status: BookingStatus
    message: str
    end_pin: str


# ---------------------------------------------------------------------------
# Hospital patient-case discharge — the assigned Relationship Officer's side
# of the dual discharge confirmation, via their own no-login token link.
# ---------------------------------------------------------------------------

class OfficerPatientCaseOut(BaseModel):
    """What the assigned officer's no-login discharge page shows them — just
    enough to confirm they're looking at the right patient, nothing about
    hospital billing."""
    patient_name: str
    hospital_name: Optional[str] = None
    admission_date: date
    status: PatientCaseStatus
    hospital_discharge_at: Optional[datetime] = None  # set once the hospital has confirmed their side
    officer_discharge_at: Optional[datetime] = None   # set once this officer has confirmed their side
    waiting_on: Optional[str] = None                  # "hospital" | "officer" | None
    link_expires_at: Optional[datetime] = None        # when this link stops working


class OfficerDischargeIn(BaseModel):
    """The officer's side of the dual discharge confirmation. discharge_datetime
    defaults to right now if omitted."""
    discharge_datetime: Optional[datetime] = None


class OfficerDischargeOut(BaseModel):
    status: PatientCaseStatus
    message: str


# ---------------------------------------------------------------------------
# The officer's own no-login "my day" portal — everything this officer is
# covering right now, across every hospital, in one place. Previously an
# officer had no way to see this themselves; only a per-case discharge link.
# ---------------------------------------------------------------------------

class OfficerPortalCaseOut(BaseModel):
    """One case this officer is currently on. Deliberately as light as the
    other officer-facing schemas — no billing, no attendant contact details
    beyond what they'd need to find the right patient."""
    patient_name: str
    hospital_name: Optional[str] = None
    ward_or_room: Optional[str] = None
    admission_date: date
    status: PatientCaseStatus
    covering_today: bool
    hospital_discharge_at: Optional[datetime] = None
    officer_discharge_at: Optional[datetime] = None
    discharge_link_token: Optional[str] = None  # this case's own discharge-confirmation link


class OfficerPortalOut(BaseModel):
    full_name: str
    today_patient_count: int
    cases: List[OfficerPortalCaseOut] = []
