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
    hospital_name: Optional[str] = None
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
