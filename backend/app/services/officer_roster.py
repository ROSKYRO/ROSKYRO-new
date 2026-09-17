"""
Everything about a Relationship Officer's *own* workload across the Hospital
Concierge Program — as opposed to app/services/patient_billing.py, which is
about a single PatientCase. This is the module that answers "what is RO Ravi
doing right now", which nothing in the app could answer before: the ops
board was patient-first (scan every case to find one officer's load), never
officer-first.

Three jobs live here:
  1. Roll up, for one officer, every case they're currently covering and
     whether they're covering it *today* specifically (officer_on_duty from
     patient_billing.py already resolves the daily-row-vs-standing-officer
     question per case; this module just does it across every case at once).
  2. Guard against double-booking: before an assignment is saved, count how
     many *other* patients that officer would be covering on each affected
     day, and refuse (unless explicitly overridden) once that crosses
     MAX_DAILY_PATIENTS_PER_OFFICER.
  3. Check an officer is actually eligible to be put on a patient at all
     (active status + fully verified) — this is a hard requirement with no
     override, unlike the capacity/availability checks above.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta, date as date_cls
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.security import generate_officer_token
from app.models.agent import Agent, AgentStatus
from app.models.patient_case import (
    PatientCase, PatientCaseStatus, DailyOfficerAssignment, DailyAssignmentStatus,
)
from app.services.patient_billing import officer_on_duty, coverage_days_and_billing


class OfficerAssignmentError(ValueError):
    """Raised when an officer can't be put on a case as requested. Routers
    turn this into a 400 (hard, no-override reasons — status/verification)
    or a 409 (soft, overridable reasons — capacity/availability); see
    `overridable` below."""

    def __init__(self, message: str, *, overridable: bool = False):
        super().__init__(message)
        self.overridable = overridable


# ---------------------------------------------------------------------------
# Eligibility — hard requirements, never overridable
# ---------------------------------------------------------------------------

def check_officer_eligible(agent: Agent) -> None:
    """An officer must be active and fully verified before ANY patient can be
    put on them. Previously assign_officer only checked that the Agent row
    existed — meaning someone mid-police-verification, or explicitly
    suspended, could be assigned to a real patient. There is deliberately no
    override for this one: fix the officer's status/verification first."""
    if agent.status != AgentStatus.active:
        raise OfficerAssignmentError(
            f"{agent.full_name} isn't active yet (currently '{agent.status.value}'). "
            f"Complete their verification and set them active before assigning a patient.",
            overridable=False,
        )
    if not agent.is_fully_verified:
        raise OfficerAssignmentError(
            f"{agent.full_name}'s verification is incomplete "
            f"({agent.verification_progress}/6 checks) — finish it before assigning a patient.",
            overridable=False,
        )


# ---------------------------------------------------------------------------
# Who an officer is covering
# ---------------------------------------------------------------------------

def _open_cases_query(db: Session):
    return db.query(PatientCase).options(
        joinedload(PatientCase.assignments).joinedload(DailyOfficerAssignment.agent),
        joinedload(PatientCase.hospital),
        joinedload(PatientCase.assigned_agent),
    ).filter(PatientCase.status.in_([PatientCaseStatus.active, PatientCaseStatus.pending_discharge]))


def cases_agent_covers_on(db: Session, agent_id: int, day: date_cls, exclude_case_id: Optional[int] = None):
    """Every open PatientCase this officer is actually covering on `day` —
    resolved through officer_on_duty() so a day where someone else was
    explicitly rostered in (or this officer was marked no_show) is correctly
    excluded, and a day covered only by the standing assignment (no daily
    row) is correctly included."""
    candidates = _open_cases_query(db).filter(
        or_(
            PatientCase.assigned_agent_id == agent_id,
            PatientCase.assignments.any(
                (DailyOfficerAssignment.agent_id == agent_id) & (DailyOfficerAssignment.date == day)
            ),
        )
    ).all()
    return [
        c for c in candidates
        if c.id != exclude_case_id and officer_on_duty(c, day).agent_id == agent_id
    ]


@dataclass
class OfficerCaseSummary:
    case_id: int
    patient_name: str
    hospital_name: Optional[str]
    status: str
    covering_today: bool
    is_fallback: bool  # standing assignment, not an explicit row for today


@dataclass
class OfficerRoster:
    agent: Agent
    today_cases: list = field(default_factory=list)      # list[OfficerCaseSummary]
    active_case_count: int = 0
    today_patient_count: int = 0
    over_capacity_today: bool = False
    no_show_days_30d: int = 0
    days_covered_this_month: int = 0
    payout_estimate_this_month: float = 0.0


def build_officer_roster(db: Session, agent: Agent, today: Optional[date_cls] = None) -> OfficerRoster:
    """The single query the admin board never had: everything about what
    THIS officer is doing right now, in one place."""
    today = today or datetime.utcnow().date()
    month_start = today.replace(day=1)
    thirty_days_ago = today - timedelta(days=30)

    open_cases = _open_cases_query(db).filter(
        or_(PatientCase.assigned_agent_id == agent.id,
            PatientCase.assignments.any(DailyOfficerAssignment.agent_id == agent.id))
    ).all()

    today_summaries = []
    for c in open_cases:
        on_duty = officer_on_duty(c, today)
        if on_duty.agent_id == agent.id:
            today_summaries.append(OfficerCaseSummary(
                case_id=c.id, patient_name=c.patient_name,
                hospital_name=c.hospital.name if c.hospital else None,
                status=c.status.value, covering_today=True, is_fallback=on_duty.is_fallback,
            ))

    active_case_count = sum(
        1 for c in open_cases if c.assigned_agent_id == agent.id
    )

    no_show_30d = db.query(DailyOfficerAssignment).filter(
        DailyOfficerAssignment.agent_id == agent.id,
        DailyOfficerAssignment.status == DailyAssignmentStatus.no_show,
        DailyOfficerAssignment.date >= thirty_days_ago,
    ).count()

    days_this_month = db.query(DailyOfficerAssignment).filter(
        DailyOfficerAssignment.agent_id == agent.id,
        DailyOfficerAssignment.status != DailyAssignmentStatus.no_show,
        DailyOfficerAssignment.date >= month_start,
        DailyOfficerAssignment.date <= today,
    ).count()
    payout = round(days_this_month * agent.hospital_daily_rate, 2) if agent.hospital_daily_rate else 0.0

    return OfficerRoster(
        agent=agent,
        today_cases=today_summaries,
        active_case_count=active_case_count,
        today_patient_count=len(today_summaries),
        over_capacity_today=len(today_summaries) > settings.MAX_DAILY_PATIENTS_PER_OFFICER,
        no_show_days_30d=no_show_30d,
        days_covered_this_month=days_this_month,
        payout_estimate_this_month=payout,
    )


# ---------------------------------------------------------------------------
# Double-booking guard
# ---------------------------------------------------------------------------

@dataclass
class CapacityConflict:
    day: date_cls
    other_patient_names: list  # names of OTHER patients this officer already covers that day


def check_capacity(
    db: Session, agent: Agent, start: date_cls, end: date_cls, exclude_case_id: int
) -> list[CapacityConflict]:
    """For each day in [start, end], how many patients OTHER than the one
    being assigned would this officer already be covering — and would adding
    this one push them over MAX_DAILY_PATIENTS_PER_OFFICER? Returns only the
    days that would breach the cap, each with who else that officer is
    already on that day, so the admin sees exactly what they'd be creating."""
    conflicts = []
    day = start
    while day <= end:
        others = cases_agent_covers_on(db, agent.id, day, exclude_case_id=exclude_case_id)
        if len(others) + 1 > settings.MAX_DAILY_PATIENTS_PER_OFFICER:
            conflicts.append(CapacityConflict(day=day, other_patient_names=[c.patient_name for c in others]))
        day += timedelta(days=1)
    return conflicts


# ---------------------------------------------------------------------------
# The officer's own "my day" portal link
# ---------------------------------------------------------------------------

def issue_portal_token(agent: Agent, rotate: bool = False) -> str:
    if rotate or not agent.portal_token:
        agent.portal_token = generate_officer_token()
    agent.portal_token_expires_at = datetime.utcnow() + timedelta(days=settings.OFFICER_PORTAL_TOKEN_TTL_DAYS)
    return agent.portal_token


def portal_token_is_live(agent: Agent) -> bool:
    if not agent.portal_token:
        return False
    if agent.portal_token_expires_at is None:
        return True
    return datetime.utcnow() <= agent.portal_token_expires_at
