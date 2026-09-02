from pydantic import BaseModel
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
