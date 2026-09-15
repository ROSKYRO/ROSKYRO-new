from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.hospital import HospitalContractStatus
from app.models.journey import JourneyStage


# ---------------------------------------------------------------------------
# Hospital (partner) records
# ---------------------------------------------------------------------------

class HospitalOut(BaseModel):
    id: int
    name: str
    city_id: Optional[int] = None
    city_name: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contract_status: HospitalContractStatus
    monthly_contract_amount: Optional[float] = None
    is_active: bool
    logo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PublicHospitalOut(BaseModel):
    """What families see while booking — no contract/commercial fields."""
    id: int
    name: str
    city_name: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None

    class Config:
        from_attributes = True


class HospitalCreateIn(BaseModel):
    name: str
    city_id: Optional[int] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contract_status: HospitalContractStatus = HospitalContractStatus.prospect
    monthly_contract_amount: Optional[float] = None
    notes: Optional[str] = None


class HospitalUpdateIn(BaseModel):
    name: Optional[str] = None
    city_id: Optional[int] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contract_status: Optional[HospitalContractStatus] = None
    monthly_contract_amount: Optional[float] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class HospitalStaffCreateIn(BaseModel):
    """Admin creates a Hospital Console login for a given hospital."""
    full_name: str
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    hospital_id: int


class HospitalStaffOut(BaseModel):
    id: int
    full_name: str
    phone: str
    email: Optional[str] = None
    hospital_id: Optional[int] = None
    hospital_name: Optional[str] = None
    is_active: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Journey Engine — stage updates & timeline ("Family Updates")
# ---------------------------------------------------------------------------

class JourneyUpdateIn(BaseModel):
    stage: JourneyStage
    note: Optional[str] = None


class JourneyUpdateOut(BaseModel):
    id: int
    stage: JourneyStage
    note: Optional[str] = None
    posted_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class JourneyOut(BaseModel):
    """A booking as a patient journey — used by the family timeline and the
    Hospital Console's Active Journeys view."""
    id: int
    booking_code: str
    customer_name: str
    customer_phone: str
    service_name: str
    hospital_name: Optional[str] = None
    status: str
    current_stage: Optional[JourneyStage] = None
    scheduled_start: datetime
    agent_name: Optional[str] = None
    updates: List[JourneyUpdateOut] = []


# ---------------------------------------------------------------------------
# Hospital Console dashboard
# ---------------------------------------------------------------------------

class HospitalDashboardOut(BaseModel):
    hospital_name: str
    todays_patients: int
    active_journeys: int
    admission_queue: int
    discharge_queue: int
    family_updates_today: int
    feedback_avg_rating: Optional[float] = None
    feedback_count: int
