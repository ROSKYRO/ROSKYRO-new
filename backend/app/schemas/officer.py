from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.models.booking import BookingStatus


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
