from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.db.session import get_db
from app.core.deps import require_hospital_staff
from app.core.security import verify_password, create_access_token
from app.core.limiter import limiter
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.hospital import Hospital
from app.models.patient_case import PatientCase, PatientCaseStatus, DailyOfficerAssignment
from app.models.hospital_invoice import HospitalInvoice
from app.schemas.auth import LoginIn, TokenOut
from app.schemas.hospital import (
    PublicHospitalOut, PatientCaseCreateIn, PatientCaseStatusIn, PatientCaseOut,
    DailyAssignmentOut, HospitalDashboardOut, HospitalDischargeIn, CaseAlertOut,
)
from app.schemas.hospital_invoice import HospitalInvoiceOut
from app.models.patient_case import DailyAssignmentStatus
from app.services.patient_billing import (
    coverage_days_and_billing, apply_hospital_discharge_confirmation,
    undo_hospital_discharge_confirmation, officer_on_duty, build_case_alerts,
    requires_officer_confirmation, discharge_waiting_on, discharge_pending_since,
    DischargeValidationError,
)

# Public router: hospital picker shown to families during booking.
public_router = APIRouter(prefix="/hospitals", tags=["hospitals"])

# Console router: everything a logged-in Hospital Console user can do.
# Kept under its own prefix + its own login endpoint (mirrors /admin/auth/login)
# so hospital sessions are fully isolated from both customer and admin auth.
router = APIRouter(prefix="/hospital-console", tags=["hospital-console"])


@public_router.get("", response_model=List[PublicHospitalOut])
def list_active_hospitals(city_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Hospitals a family can pick from the Concierge Booking Engine."""
    query = db.query(Hospital).filter(Hospital.is_active == True)  # noqa: E712
    if city_id:
        query = query.filter(Hospital.city_id == city_id)
    hospitals = query.order_by(Hospital.name).all()
    return [
        PublicHospitalOut(
            id=h.id, name=h.name,
            city_name=h.city.name if h.city else None,
            address=h.address, logo_url=h.logo_url,
        )
        for h in hospitals
    ]


@router.post("/auth/login", response_model=TokenOut)
@limiter.limit(settings.ADMIN_LOGIN_RATE_LIMIT)
def hospital_login(request: Request, payload: LoginIn, db: Session = Depends(get_db)):
    """The only endpoint that can issue a Hospital Console session."""
    user = db.query(User).filter(User.phone == payload.phone).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    if user.role != UserRole.hospital_staff or not user.hospital_id or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid phone number or password")

    token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        expires_delta=timedelta(minutes=settings.ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenOut(access_token=token, role=user.role.value, user_id=user.id, full_name=user.full_name)


def _to_case_out(c: PatientCase) -> PatientCaseOut:
    """The Hospital Console's view of a case. Deliberately narrower than
    Admin's: no officer discharge link, no force-close audit trail."""
    on_duty = officer_on_duty(c)
    days_covered, billed_estimate = coverage_days_and_billing(c)
    return PatientCaseOut(
        id=c.id,
        hospital_id=c.hospital_id,
        hospital_name=c.hospital.name if c.hospital else None,
        patient_name=c.patient_name,
        patient_age=c.patient_age,
        attendant_name=c.attendant_name,
        attendant_phone=c.attendant_phone,
        ward_or_room=c.ward_or_room,
        short_note=c.short_note,
        admission_date=c.admission_date,
        expected_discharge_date=c.expected_discharge_date,
        status=c.status,
        daily_rate=c.daily_rate,
        days_covered=days_covered,
        billed_estimate=billed_estimate,
        # Falls back to the case's standing officer on any day with no daily
        # row, so the console stops saying "Awaiting today's officer" for a
        # patient who has had the same officer since admission.
        today_officer_name=on_duty.name,
        today_officer_is_fallback=on_duty.is_fallback,
        no_show_days=sum(1 for a in c.assignments if a.status == DailyAssignmentStatus.no_show),
        assigned_agent_id=c.assigned_agent_id,
        assigned_agent_name=c.assigned_agent.full_name if c.assigned_agent else None,
        hospital_discharge_at=c.hospital_discharge_at,
        officer_discharge_at=c.officer_discharge_at,
        hospital_discharge_by_name=c.hospital_discharge_by.full_name if c.hospital_discharge_by else None,
        officer_confirmation_required=requires_officer_confirmation(c),
        discharge_waiting_on=discharge_waiting_on(c),
        discharge_pending_since=discharge_pending_since(c),
        # officer_discharge_token / force-close audit deliberately omitted —
        # the Hospital Console never sees the officer's own link, and the
        # override trail is ROSKYRO-internal.
        created_at=c.created_at,
        discharged_at=c.discharged_at,
        assignments=[
            DailyAssignmentOut(
                id=a.id, date=a.date, agent_id=a.agent_id,
                agent_name=a.agent.full_name if a.agent else "\u2014",
                agent_phone=a.agent.phone if a.agent else None,
                status=a.status, note=a.note,
            )
            for a in c.assignments
        ],
        alerts=[CaseAlertOut(code=a.code, severity=a.severity, message=a.message)
                for a in build_case_alerts(c)],
    )


def _hospital_cases_query(db: Session, hospital_id: int):
    return (
        db.query(PatientCase)
        .options(
            joinedload(PatientCase.assignments).joinedload(DailyOfficerAssignment.agent),
            joinedload(PatientCase.hospital),
            joinedload(PatientCase.assigned_agent),
            joinedload(PatientCase.hospital_discharge_by),
        )
        .filter(PatientCase.hospital_id == hospital_id)
    )


@router.get("/dashboard", response_model=HospitalDashboardOut)
def dashboard(db: Session = Depends(get_db), staff: User = Depends(require_hospital_staff)):
    hospital = db.query(Hospital).get(staff.hospital_id)
    today = datetime.utcnow().date()
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # "Active" here includes pending_discharge too — coverage and billing
    # keep running for those cases exactly like active ones, right up until
    # the assigned officer also confirms discharge and the case fully closes.
    active_cases = _hospital_cases_query(db, staff.hospital_id).filter(
        PatientCase.status.in_([PatientCaseStatus.active, PatientCaseStatus.pending_discharge])
    ).all()
    active_patients = len(active_cases)
    # Counted through officer_on_duty() rather than "is there a daily row for
    # today", so a patient whose standing officer was assigned once at
    # admission still counts as covered long after the seeded From-To range
    # ran out. Previously this reported them as awaiting an officer forever.
    today_assigned = sum(1 for c in active_cases if officer_on_duty(c, today).covered)
    today_unassigned = active_patients - today_assigned

    pending = [c for c in active_cases if c.status == PatientCaseStatus.pending_discharge]
    pending_on_officer = sum(1 for c in pending if discharge_waiting_on(c) == "officer")
    pending_on_hospital = len(pending) - pending_on_officer

    discharged_this_month = (
        _hospital_cases_query(db, staff.hospital_id)
        .filter(PatientCase.status == PatientCaseStatus.discharged, PatientCase.discharged_at >= month_start)
        .count()
    )

    # Rough running estimate: every assignment logged this month, at that case's daily_rate.
    estimate = (
        db.query(func.count(DailyOfficerAssignment.id), PatientCase.daily_rate)
        .join(PatientCase, PatientCase.id == DailyOfficerAssignment.patient_case_id)
        .filter(PatientCase.hospital_id == staff.hospital_id, DailyOfficerAssignment.date >= month_start.date())
        .group_by(PatientCase.daily_rate)
        .all()
    )
    estimated_billing_this_month = sum(count * rate for count, rate in estimate)

    return HospitalDashboardOut(
        hospital_name=hospital.name if hospital else "—",
        active_patients=active_patients,
        today_assigned=today_assigned,
        today_unassigned=today_unassigned,
        discharged_this_month=discharged_this_month,
        estimated_billing_this_month=round(estimated_billing_this_month, 2),
        pending_discharge_total=len(pending),
        pending_on_hospital=pending_on_hospital,
        pending_on_officer=pending_on_officer,
    )


@router.post("/patients", response_model=PatientCaseOut)
def create_patient_case(
    payload: PatientCaseCreateIn,
    db: Session = Depends(get_db),
    staff: User = Depends(require_hospital_staff),
):
    """Hospital hands a patient/attendant over to ROSKYRO — short details
    only. ROSKYRO assigns a dedicated Relationship Officer from here."""
    hospital = db.query(Hospital).get(staff.hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    if hospital.per_patient_daily_rate is None:
        raise HTTPException(
            status_code=400,
            detail="Your hospital's per-patient daily billing rate hasn't been set up yet — ask ROSKYRO to configure it before opening cases.",
        )

    case = PatientCase(
        hospital_id=hospital.id,
        created_by_id=staff.id,
        patient_name=payload.patient_name,
        patient_age=payload.patient_age,
        attendant_name=payload.attendant_name,
        attendant_phone=payload.attendant_phone,
        ward_or_room=payload.ward_or_room,
        short_note=payload.short_note,
        admission_date=payload.admission_date or datetime.utcnow().date(),
        expected_discharge_date=payload.expected_discharge_date,
        daily_rate=hospital.per_patient_daily_rate,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return _to_case_out(case)


@router.get("/patients", response_model=List[PatientCaseOut])
def list_patient_cases(
    status: Optional[str] = None,  # active | discharged | cancelled | all
    db: Session = Depends(get_db),
    staff: User = Depends(require_hospital_staff),
):
    query = _hospital_cases_query(db, staff.hospital_id).order_by(PatientCase.created_at.desc())
    if status and status != "all":
        try:
            status_filter = PatientCaseStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter")
        if status_filter == PatientCaseStatus.active:
            # "Active" also covers pending_discharge — coverage/billing for
            # those cases still runs exactly like an active one, until the
            # assigned officer also confirms and the case fully closes.
            query = query.filter(PatientCase.status.in_([PatientCaseStatus.active, PatientCaseStatus.pending_discharge]))
        else:
            query = query.filter(PatientCase.status == status_filter)
    cases = query.limit(300).all()
    return [_to_case_out(c) for c in cases]


@router.get("/patients/{case_id}", response_model=PatientCaseOut)
def get_patient_case(case_id: int, db: Session = Depends(get_db), staff: User = Depends(require_hospital_staff)):
    case = _hospital_cases_query(db, staff.hospital_id).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")
    return _to_case_out(case)


@router.patch("/patients/{case_id}/status", response_model=PatientCaseOut)
def update_patient_case_status(
    case_id: int,
    payload: PatientCaseStatusIn,
    db: Session = Depends(get_db),
    staff: User = Depends(require_hospital_staff),
):
    """Hospital cancels a case (opened by mistake, before RO coverage
    started). Only the hospital that opened the case can do this. Discharge
    is NOT set through here anymore — see POST /patients/{case_id}/discharge,
    since closing a case now also needs the assigned officer's confirmation."""
    if payload.status == PatientCaseStatus.discharged:
        raise HTTPException(
            status_code=400,
            detail="Use POST /patients/{case_id}/discharge to confirm a discharge — "
                   "it also needs the assigned Relationship Officer to confirm their side.",
        )
    case = db.query(PatientCase).filter(PatientCase.id == case_id, PatientCase.hospital_id == staff.hospital_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")

    case.status = payload.status
    db.commit()
    db.refresh(case)
    return _to_case_out(case)


@router.post("/patients/{case_id}/discharge", response_model=PatientCaseOut)
def confirm_hospital_discharge(
    case_id: int,
    payload: HospitalDischargeIn,
    db: Session = Depends(get_db),
    staff: User = Depends(require_hospital_staff),
):
    """Hospital confirms the date & time the patient was actually
    discharged — this is the hospital's half of the dual discharge
    confirmation. The case only actually closes (status → discharged,
    billing stops) once the assigned Relationship Officer has also
    confirmed their side via their own link; until then it moves to
    'pending_discharge' and keeps accruing coverage/billing like an active
    case.

    Two behaviours worth knowing:
      - The date/time is validated (not before admission, not in the future,
        not wildly apart from the officer's own confirmation if that already
        landed) instead of being accepted silently.
      - If ROSKYRO never assigned a Relationship Officer to this case, there
        is nobody who can confirm the other side, so this confirmation alone
        closes the case rather than parking it in pending_discharge forever."""
    case = db.query(PatientCase).filter(PatientCase.id == case_id, PatientCase.hospital_id == staff.hospital_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")
    if case.status not in (PatientCaseStatus.active, PatientCaseStatus.pending_discharge):
        raise HTTPException(status_code=400, detail="This case isn't in a state that can be discharged.")

    try:
        apply_hospital_discharge_confirmation(case, payload.discharge_datetime, staff_id=staff.id)
    except DischargeValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    db.commit()
    db.refresh(case)
    return _to_case_out(case)


@router.delete("/patients/{case_id}/discharge", response_model=PatientCaseOut)
def undo_hospital_discharge(
    case_id: int,
    db: Session = Depends(get_db),
    staff: User = Depends(require_hospital_staff),
):
    """Take back a discharge confirmation clicked by mistake.

    Until now the only option was to edit the time, which meant a misclick
    left a permanent (and billing-stopping) confirmation on the record. This
    clears the hospital's side entirely and puts the case back to active — or
    back to pending_discharge if the officer has confirmed their side. Once
    the case has fully closed, undo is an Admin decision, not a one-click
    action here."""
    case = db.query(PatientCase).filter(PatientCase.id == case_id, PatientCase.hospital_id == staff.hospital_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")
    if not case.hospital_discharge_at:
        raise HTTPException(status_code=400, detail="There's no confirmation from your side to undo.")
    try:
        undo_hospital_discharge_confirmation(case)
    except DischargeValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    db.commit()
    db.refresh(case)
    return _to_case_out(case)


# ---------------------------------------------------------------------------
# Monthly billing — read-only for the Hospital Console. Only ROSKYRO Admin
# generates invoices and marks them paid (see routers/hospital_admin.py); a
# hospital just needs to see what's been invoiced and what's still pending.
# ---------------------------------------------------------------------------

@router.get("/invoices", response_model=List[HospitalInvoiceOut])
def list_my_invoices(db: Session = Depends(get_db), staff: User = Depends(require_hospital_staff)):
    from app.routers.hospital_admin import _to_invoice_out  # shared conversion, avoids duplicating it here

    invoices = (
        db.query(HospitalInvoice)
        .options(joinedload(HospitalInvoice.cases))
        .filter(HospitalInvoice.hospital_id == staff.hospital_id)
        .order_by(HospitalInvoice.generated_at.desc())
        .all()
    )
    return [_to_invoice_out(inv) for inv in invoices]
