from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.models.booking import BookingStatus
from app.models.journey import JourneyStage


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
    hospital_id: Optional[int] = None  # which partner hospital this journey is for, if any


class BookingOut(BaseModel):
    id: int
    booking_code: str
    service_id: int
    agent_id: Optional[int]
    hospital_id: Optional[int] = None
    current_stage: Optional[JourneyStage] = None
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
    """Returned only to the customer right after booking - carries the PINs."""
    start_pin: Optional[str]
    end_pin: Optional[str]


class SubmitStartPinIn(BaseModel):
    start_pin: str


class SubmitEndPinIn(BaseModel):
    end_pin: str


class AssignAgentIn(BaseModel):
    agent_id: int


class SosIn(BaseModel):
    note: Optional[str] = None
