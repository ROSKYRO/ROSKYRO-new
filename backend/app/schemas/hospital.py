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
    """Admin creates a Hospital Console login for a given hospital.

    NOTE: the hospital is identified by the {hospital_id} path parameter on
    POST /admin/hospital-program/hospitals/{hospital_id}/staff — it is
    deliberately NOT repeated in the body. Having it here as a required field
    meant the Admin console's "Issue login" form (which only ever sends name,
    phone and password) was rejected with a 422, so no hospital login could
    be created from the UI at all. Two sources of truth for the same id would
    also let a caller POST to hospital A while naming hospital B in the body.
    """
    full_name: str
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    password: str = Field(..., min_length=6)


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
    """Hospital cancels a case. NOTE: discharge is no longer set through this
    endpoint — see HospitalDischargeIn below, since it now needs the
    assigned officer's confirmation too before the case actually closes."""
    status: PatientCaseStatus


class HospitalDischargeIn(BaseModel):
    """Hospital's side of the dual discharge confirmation. discharge_datetime
    defaults to right now if omitted. It is validated against the admission
    date and the clock (and against the officer's confirmation, if that has
    already landed) — see services/patient_billing.validate_discharge_datetime."""
    discharge_datetime: Optional[datetime] = None


class ForceCloseDischargeIn(BaseModel):
    """ROSKYRO Admin's override for a case stuck half-confirmed because one
    side never responded. The reason is mandatory and is kept on the case
    permanently, so a force-closed discharge is always distinguishable from a
    clean dual confirmation."""
    reason: str = Field(..., min_length=3, max_length=500)
    discharge_datetime: Optional[datetime] = None  # defaults to now


class AssignmentStatusIn(BaseModel):
    """Admin marks how a given day's coverage actually went. A day marked
    no_show stops counting as covered, so the ops board asks for a re-assign."""
    status: DailyAssignmentStatus
    note: Optional[str] = None


class OfficerLinkOut(BaseModel):
    """Returned after (re)generating the assigned officer's no-login discharge
    link. Regenerating mints a new token, which instantly kills the old one."""
    officer_discharge_token: str
    expires_at: datetime


class CaseAlertOut(BaseModel):
    """One thing somebody should be chasing on this case right now — the
    in-app stand-in for a push notification."""
    code: str
    severity: str  # info | warning | critical
    message: str


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
    days_covered: int = 0          # calendar days admission→(today or confirmed discharge)
    billed_estimate: float = 0.0   # days_covered * daily_rate — keeps running until actual discharge
    today_officer_name: Optional[str] = None  # who's covering this patient today
    # True when today's officer comes from the case's standing assignment
    # rather than an explicit daily row — the normal state once the seeded
    # From–To range runs out. Still covered; just not separately rostered.
    today_officer_is_fallback: bool = False
    no_show_days: int = 0  # daily rows explicitly marked no_show

    # The one Relationship Officer assigned to this case at admission, and
    # where the discharge confirmation currently stands.
    assigned_agent_id: Optional[int] = None
    assigned_agent_name: Optional[str] = None
    hospital_discharge_at: Optional[datetime] = None
    officer_discharge_at: Optional[datetime] = None
    hospital_discharge_by_name: Optional[str] = None  # which staff member clicked confirm
    # False when no officer was ever assigned — the hospital's confirmation
    # alone closes such a case, because nobody exists to confirm the other side.
    officer_confirmation_required: bool = True
    discharge_waiting_on: Optional[str] = None       # "hospital" | "officer" | None
    discharge_pending_since: Optional[datetime] = None
    # Set only when Admin force-closed a stuck case — never on a clean
    # dual confirmation.
    discharge_force_closed_at: Optional[datetime] = None
    discharge_force_closed_by_name: Optional[str] = None
    discharge_force_close_reason: Optional[str] = None
    # Only populated for ROSKYRO Admin (never sent to the Hospital Console) —
    # the no-login link Admin shares with the assigned officer so they can
    # confirm the discharge date/time themselves, and when it stops working.
    officer_discharge_token: Optional[str] = None
    officer_discharge_token_expires_at: Optional[datetime] = None
    officer_discharge_link_live: bool = False

    created_at: datetime
    discharged_at: Optional[datetime] = None
    assignments: List[DailyAssignmentOut] = []
    alerts: List[CaseAlertOut] = []


# What ROSKYRO Admin uses to (re-)assign one dedicated officer, optionally
# across a whole date range at once — this is the "easy to assign" bit: one
# call covers the officer for the patient's full expected stay if needed.
class AssignOfficerIn(BaseModel):
    agent_id: int
    start_date: Optional[date] = None  # defaults to today
    end_date: Optional[date] = None    # defaults to start_date (single day)
    note: Optional[str] = None
    # Swapping the officer on a case that is already pending_discharge is
    # allowed (the old officer went unavailable mid-discharge). When the
    # officer actually changes, their link is rotated so the outgoing officer
    # loses access, and any discharge confirmation the outgoing officer had
    # already given is cleared by default — the new officer has to confirm
    # what they themselves saw. Set this to False only to deliberately keep
    # the earlier confirmation on the record.
    reset_officer_confirmation: bool = True
    # Consciously override a SOFT block — the officer is marked unavailable,
    # or this assignment would push them over MAX_DAILY_PATIENTS_PER_OFFICER
    # on one or more days. Does NOT override a HARD block (officer not
    # active / not fully verified) — there is no override for that; fix the
    # officer's status first.
    force: bool = False


# ---------------------------------------------------------------------------
# Hospital Console dashboard
# ---------------------------------------------------------------------------

class HospitalDashboardOut(BaseModel):
    hospital_name: str
    active_patients: int
    today_assigned: int      # active patients with a Relationship Officer covering today
    today_unassigned: int    # active patients genuinely without any officer today
    discharged_this_month: int
    estimated_billing_this_month: float
    # Half-confirmed discharges, so the hospital can see at a glance that
    # something is sitting there still being billed.
    pending_discharge_total: int = 0
    pending_on_hospital: int = 0   # waiting on this hospital to confirm
    pending_on_officer: int = 0    # waiting on the Relationship Officer


# ---------------------------------------------------------------------------
# Officer-wise roster — "what is RO Ravi doing right now", answered directly
# instead of by scanning every patient case on the ops board.
# ---------------------------------------------------------------------------

class OfficerRosterCaseOut(BaseModel):
    case_id: int
    patient_name: str
    hospital_name: Optional[str] = None
    status: PatientCaseStatus
    is_fallback: bool  # covering via the standing assignment, no explicit row for today


class OfficerRosterOut(BaseModel):
    agent_id: int
    full_name: str
    phone: str
    status: str
    is_fully_verified: bool
    is_available: bool
    hospital_daily_rate: Optional[float] = None

    today_cases: List[OfficerRosterCaseOut] = []
    today_patient_count: int = 0
    active_case_count: int = 0
    over_capacity_today: bool = False
    no_show_days_30d: int = 0
    days_covered_this_month: int = 0
    payout_estimate_this_month: float = 0.0

    portal_token: Optional[str] = None
    portal_token_expires_at: Optional[datetime] = None
    portal_link_live: bool = False


class OfficerPortalLinkOut(BaseModel):
    portal_token: str
    expires_at: datetime
