from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.models.booking import BookingStatus


class BookingEstimateIn(BaseModel):
    service_id: int
    booked_hours: float
    distance_km: float = 0.0
    ends_at_different_location: bool = False


class BookingEstimateOut(BaseModel):
    booked_hours: float
    hourly_rate: float
    service_subtotal: float
    arrival_fee: float
    return_fee: float
    gst_amount: float
    estimated_total: float


class BookingCreateIn(BaseModel):
    service_id: int
    address: str
    contact_on_arrival_name: Optional[str] = None
    contact_on_arrival_phone: Optional[str] = None
    notes: Optional[str] = None
    scheduled_start: datetime
    booked_hours: float
    distance_km: float = 0.0
    ends_at_different_location: bool = False
    city_id: Optional[int] = None


class BookingOut(BaseModel):
    id: int
    booking_code: str
    service_id: int
    agent_id: Optional[int]
    membership_id: Optional[int] = None
    is_membership_covered: bool = False
    address: str
    contact_on_arrival_name: Optional[str]
    contact_on_arrival_phone: Optional[str]
    scheduled_start: datetime
    booked_hours: float
    distance_km: float
    ends_at_different_location: bool
    status: BookingStatus
    actual_start_at: Optional[datetime]
    actual_end_at: Optional[datetime]
    service_subtotal: Optional[float]
    arrival_fee: Optional[float]
    return_fee: Optional[float]
    discount_amount: Optional[float]
    gst_amount: Optional[float]
    total_amount: Optional[float]
    sos_triggered: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BookingWithPinsOut(BookingOut):
    """Returned only to the customer right after booking — carries the Start PIN
    only. The End PIN is deliberately withheld here: it's only revealed by the
    Relationship Officer once the visit is genuinely finished (see
    app/routers/admin.py::get_booking_pins), so the customer can't stop the
    billing clock early on their own."""
    start_pin: Optional[str]


class BookingMineOut(BookingOut):
    """Used for GET /bookings/mine and GET /bookings/{id} — the customer's own
    booking, so re-showing the Start PIN here (as a "I forgot it" safety net) is
    safe; it's still the same customer who saw it once already at booking time.
    It's only populated while still relevant (see
    app/routers/bookings.py::_with_customer_pins), so it disappears again once
    used or once the booking is completed/cancelled. The End PIN is never
    included here — the customer only ever learns it verbally from the
    Relationship Officer at job completion, then types it in to stop the clock."""
    start_pin: Optional[str] = None
    hourly_rate: Optional[float] = None


class SubmitStartPinIn(BaseModel):
    start_pin: str


class SubmitEndPinIn(BaseModel):
    end_pin: str


class AssignAgentIn(BaseModel):
    agent_id: int


class SosIn(BaseModel):
    note: Optional[str] = None
