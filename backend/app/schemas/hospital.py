from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.hospital import HospitalContractStatus
from app.models.patient_case import PatientCaseStatus, DailyAssignmentStatus


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
    per_patient_daily_rate: Optional[float] = None
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
    per_patient_daily_rate: Optional[float] = None
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
    per_patient_daily_rate: Optional[float] = None
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
# Patient Cases — the hospital hands off short patient details, ROSKYRO
# takes it from there with one dedicated Relationship Officer per day.
# ---------------------------------------------------------------------------

class PatientCaseCreateIn(BaseModel):
    """What a hospital fills in to hand a patient/attendant over to ROSKYRO
    — deliberately short. No journey/stage tracking; ROSKYRO's Relationship
    Officer takes it from here."""
    patient_name: str
    patient_age: Optional[int] = None
    attendant_name: Optional[str] = None
    attendant_phone: str = Field(..., min_length=10, max_length=15)
    ward_or_room: Optional[str] = None
    short_note: Optional[str] = None
    admission_date: Optional[date] = None  # defaults to today
    expected_discharge_date: Optional[date] = None


class PatientCaseStatusIn(BaseModel):
    status: PatientCaseStatus


class DailyAssignmentOut(BaseModel):
    id: int
    date: date
    agent_id: int
    agent_name: str
    agent_phone: Optional[str] = None
    status: DailyAssignmentStatus
    note: Optional[str] = None

    class Config:
        from_attributes = True


class PatientCaseOut(BaseModel):
    id: int
    hospital_id: int
    hospital_name: Optional[str] = None
    patient_name: str
    patient_age: Optional[int] = None
    attendant_name: Optional[str] = None
    attendant_phone: str
    ward_or_room: Optional[str] = None
    short_note: Optional[str] = None
    admission_date: date
    expected_discharge_date: Optional[date] = None
    status: PatientCaseStatus
    daily_rate: float
    days_covered: int = 0          # count of assignment days (completed + assigned)
    billed_estimate: float = 0.0   # days_covered * daily_rate
    today_officer_name: Optional[str] = None  # who's covering this patient today, if assigned
    created_at: datetime
    discharged_at: Optional[datetime] = None
    assignments: List[DailyAssignmentOut] = []


# What ROSKYRO Admin uses to (re-)assign one dedicated officer, optionally
# across a whole date range at once — this is the "easy to assign" bit: one
# call covers the officer for the patient's full expected stay if needed.
class AssignOfficerIn(BaseModel):
    agent_id: int
    start_date: Optional[date] = None  # defaults to today
    end_date: Optional[date] = None    # defaults to start_date (single day)
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Hospital Console dashboard
# ---------------------------------------------------------------------------

class HospitalDashboardOut(BaseModel):
    hospital_name: str
    active_patients: int
    today_assigned: int      # active patients with a Relationship Officer confirmed for today
    today_unassigned: int    # active patients still waiting on today's assignment
    discharged_this_month: int
    estimated_billing_this_month: float
