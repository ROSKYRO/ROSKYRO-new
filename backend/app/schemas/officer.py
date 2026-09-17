from pydantic import BaseModel
from typing import Optional
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


class OfficerDischargeIn(BaseModel):
    """The officer's side of the dual discharge confirmation. discharge_datetime
    defaults to right now if omitted."""
    discharge_datetime: Optional[datetime] = None


class OfficerDischargeOut(BaseModel):
    status: PatientCaseStatus
    message: str
