from datetime import datetime, timedelta, date as date_cls
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.core.deps import require_admin
from app.core.security import hash_password, generate_officer_token
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.hospital import Hospital
from app.models.agent import Agent
from app.models.patient_case import PatientCase, PatientCaseStatus, DailyOfficerAssignment, DailyAssignmentStatus
from app.models.hospital_invoice import HospitalInvoice
from app.schemas.hospital import (
    HospitalOut, HospitalCreateIn, HospitalUpdateIn, HospitalStaffCreateIn, HospitalStaffOut,
    PatientCaseOut, DailyAssignmentOut, AssignOfficerIn, ForceCloseDischargeIn,
    AssignmentStatusIn, OfficerLinkOut, CaseAlertOut, OfficerRosterOut, OfficerRosterCaseOut,
    OfficerPortalLinkOut,
)
from app.schemas.hospital_invoice import (
    GenerateInvoiceIn, HospitalInvoiceOut, InvoiceCaseOut, MarkInvoicePaidIn, PendingBillingOut,
)
from app.services.patient_billing import (
    coverage_days_and_billing, officer_on_duty, build_case_alerts,
    force_close_discharge, issue_officer_discharge_token, officer_discharge_link_is_live,
    recompute_discharge_status, discharge_waiting_on, discharge_pending_since,
    requires_officer_confirmation, DischargeValidationError,
)
from app.services.hospital_billing import (
    uninvoiced_discharged_cases, generate_invoice, mark_invoice_paid, InvoiceError,
)
from app.services.officer_roster import (
    check_officer_eligible, check_capacity, build_officer_roster,
    issue_portal_token, portal_token_is_live, OfficerAssignmentError,
)

router = APIRouter(prefix="/admin/hospital-program", tags=["admin-hospital-program"])


# ---------------------------------------------------------------------------
# Partner hospitals
# ---------------------------------------------------------------------------

@router.get("/hospitals", response_model=List[HospitalOut])
def list_hospitals(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    hospitals = db.query(Hospital).order_by(Hospital.name).all()
    return [
        HospitalOut(
            id=h.id, name=h.name, city_id=h.city_id, city_name=h.city.name if h.city else None,
            address=h.address, contact_name=h.contact_name, contact_phone=h.contact_phone,
            contact_email=h.contact_email, contract_status=h.contract_status,
            monthly_contract_amount=h.monthly_contract_amount, per_patient_daily_rate=h.per_patient_daily_rate,
            is_active=h.is_active, logo_url=h.logo_url, created_at=h.created_at,
        )
        for h in hospitals
    ]


@router.post("/hospitals", response_model=HospitalOut)
def create_hospital(payload: HospitalCreateIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    hospital = Hospital(**payload.model_dump())
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return HospitalOut(
        id=hospital.id, name=hospital.name, city_id=hospital.city_id,
        city_name=hospital.city.name if hospital.city else None,
        address=hospital.address, contact_name=hospital.contact_name, contact_phone=hospital.contact_phone,
        contact_email=hospital.contact_email, contract_status=hospital.contract_status,
        monthly_contract_amount=hospital.monthly_contract_amount, per_patient_daily_rate=hospital.per_patient_daily_rate,
        is_active=hospital.is_active, logo_url=hospital.logo_url, created_at=hospital.created_at,
    )


@router.patch("/hospitals/{hospital_id}", response_model=HospitalOut)
def update_hospital(hospital_id: int, payload: HospitalUpdateIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    hospital = db.query(Hospital).get(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(hospital, field, value)
    db.commit()
    db.refresh(hospital)
    return HospitalOut(
        id=hospital.id, name=hospital.name, city_id=hospital.city_id,
        city_name=hospital.city.name if hospital.city else None,
        address=hospital.address, contact_name=hospital.contact_name, contact_phone=hospital.contact_phone,
        contact_email=hospital.contact_email, contract_status=hospital.contract_status,
        monthly_contract_amount=hospital.monthly_contract_amount, per_patient_daily_rate=hospital.per_patient_daily_rate,
        is_active=hospital.is_active, logo_url=hospital.logo_url, created_at=hospital.created_at,
    )


@router.post("/hospitals/{hospital_id}/staff", response_model=HospitalStaffOut)
def create_hospital_staff(hospital_id: int, payload: HospitalStaffCreateIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Issue a Hospital Console login. This is the only way one gets created
    — hospital staff can never self-register."""
    hospital = db.query(Hospital).get(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="A user with this phone number already exists")

    staff = User(
        full_name=payload.full_name, phone=payload.phone, email=payload.email,
        hashed_password=hash_password(payload.password), role=UserRole.hospital_staff,
        hospital_id=hospital_id,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return HospitalStaffOut(
        id=staff.id, full_name=staff.full_name, phone=staff.phone, email=staff.email,
        hospital_id=staff.hospital_id, hospital_name=hospital.name, is_active=staff.is_active,
        created_at=staff.created_at,
    )


@router.get("/hospitals/{hospital_id}/staff", response_model=List[HospitalStaffOut])
def list_hospital_staff(hospital_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    staff_members = db.query(User).filter(User.hospital_id == hospital_id, User.role == UserRole.hospital_staff).all()
    hospital = db.query(Hospital).get(hospital_id)
    return [
        HospitalStaffOut(
            id=s.id, full_name=s.full_name, phone=s.phone, email=s.email,
            hospital_id=s.hospital_id, hospital_name=hospital.name if hospital else None,
            is_active=s.is_active, created_at=s.created_at,
        )
        for s in staff_members
    ]


# ---------------------------------------------------------------------------
# Patient cases & daily Relationship Officer assignment — the core ops board.
# ---------------------------------------------------------------------------

def _cases_query(db: Session):
    return db.query(PatientCase).options(
        joinedload(PatientCase.assignments).joinedload(DailyOfficerAssignment.agent),
        joinedload(PatientCase.hospital),
        # Needed by _to_case_out: the standing officer (today's-officer
        # fallback) and the two "who did this" audit relationships.
        joinedload(PatientCase.assigned_agent),
        joinedload(PatientCase.hospital_discharge_by),
        joinedload(PatientCase.discharge_force_closed_by),
    )


def _to_case_out(c: PatientCase) -> PatientCaseOut:
    """Admin's view of a case. Unlike the Hospital Console's version, this one
    also carries the officer's discharge link (and whether it still works),
    the force-close audit trail, and admin-flavoured alerts."""
    on_duty = officer_on_duty(c)
    days_covered, billed_estimate = coverage_days_and_billing(c)
    return PatientCaseOut(
        id=c.id, hospital_id=c.hospital_id, hospital_name=c.hospital.name if c.hospital else None,
        patient_name=c.patient_name, patient_age=c.patient_age, attendant_name=c.attendant_name,
        attendant_phone=c.attendant_phone, ward_or_room=c.ward_or_room, short_note=c.short_note,
        admission_date=c.admission_date, expected_discharge_date=c.expected_discharge_date,
        status=c.status, daily_rate=c.daily_rate, days_covered=days_covered,
        billed_estimate=billed_estimate,
        # Falls back to the case's standing officer when no daily row exists
        # for today — assigning 17→18 Sep no longer makes the patient look
        # uncovered on 25 Sep.
        today_officer_name=on_duty.name,
        today_officer_is_fallback=on_duty.is_fallback,
        no_show_days=sum(1 for a in c.assignments if a.status == DailyAssignmentStatus.no_show),
        assigned_agent_id=c.assigned_agent_id,
        assigned_agent_name=c.assigned_agent.full_name if c.assigned_agent else None,
        hospital_discharge_at=c.hospital_discharge_at, officer_discharge_at=c.officer_discharge_at,
        hospital_discharge_by_name=c.hospital_discharge_by.full_name if c.hospital_discharge_by else None,
        officer_confirmation_required=requires_officer_confirmation(c),
        discharge_waiting_on=discharge_waiting_on(c),
        discharge_pending_since=discharge_pending_since(c),
        discharge_force_closed_at=c.discharge_force_closed_at,
        discharge_force_closed_by_name=(
            c.discharge_force_closed_by.full_name if c.discharge_force_closed_by else None
        ),
        discharge_force_close_reason=c.discharge_force_close_reason,
        officer_discharge_token=c.officer_discharge_token,
        officer_discharge_token_expires_at=c.officer_discharge_token_expires_at,
        officer_discharge_link_live=officer_discharge_link_is_live(c),
        created_at=c.created_at, discharged_at=c.discharged_at,
        assignments=[
            DailyAssignmentOut(
                id=a.id, date=a.date, agent_id=a.agent_id,
                agent_name=a.agent.full_name if a.agent else "\u2014", agent_phone=a.agent.phone if a.agent else None,
                status=a.status, note=a.note,
            )
            for a in c.assignments
        ],
        alerts=[CaseAlertOut(code=a.code, severity=a.severity, message=a.message)
                for a in build_case_alerts(c, for_admin=True)],
    )


@router.get("/patients", response_model=List[PatientCaseOut])
def list_all_patient_cases(
    status: Optional[str] = None,       # active | discharged | cancelled | all (default: active)
    hospital_id: Optional[int] = None,
    unassigned_today: bool = False,     # quick "who still needs an officer today" filter
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """ROSKYRO's single ops board across every partner hospital."""
    query = _cases_query(db)
    if hospital_id:
        query = query.filter(PatientCase.hospital_id == hospital_id)
    if status and status != "all":
        try:
            status_filter = PatientCaseStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter")
        if status_filter == PatientCaseStatus.active:
            # "Active" also covers pending_discharge — still on the ops
            # board (still being billed) until the assigned officer's
            # discharge confirmation lands too and the case fully closes.
            query = query.filter(PatientCase.status.in_([PatientCaseStatus.active, PatientCaseStatus.pending_discharge]))
        else:
            query = query.filter(PatientCase.status == status_filter)
    else:
        query = query.filter(PatientCase.status.in_([PatientCaseStatus.active, PatientCaseStatus.pending_discharge]))

    cases = query.order_by(PatientCase.admission_date.desc()).limit(500).all()
    out = [_to_case_out(c) for c in cases]
    if unassigned_today:
        out = [c for c in out if c.today_officer_name is None]
    return out


@router.get("/patients/{case_id}", response_model=PatientCaseOut)
def get_patient_case(case_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    case = _cases_query(db).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")
    return _to_case_out(case)


@router.post("/patients/{case_id}/assign", response_model=PatientCaseOut)
def assign_officer(
    case_id: int,
    payload: AssignOfficerIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Assign (or re-assign) one dedicated Relationship Officer to this
    patient. The From-To range here only seeds DailyOfficerAssignment rows
    for the ops board / history view - it is NOT what determines when
    coverage or billing stops, and it is no longer what determines whether
    the patient counts as covered today either (see officer_on_duty()).
    The officer picked here becomes the case's one assigned Relationship
    Officer (PatientCase.assigned_agent_id): they stay on the hook, and time
    keeps being counted, day by day, until the patient is actually discharged.

    Re-assignment is allowed on a pending_discharge case too, not just an
    active one - an officer can go unavailable in the middle of a discharge,
    and that used to leave the case with no way forward. When the officer
    actually changes: their no-login link is rotated (so the outgoing officer
    immediately loses access) and, unless the caller says otherwise, any
    discharge confirmation the outgoing officer had given is cleared, because
    the incoming officer has to confirm what they themselves saw."""
    case = _cases_query(db).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")
    if case.status not in (PatientCaseStatus.active, PatientCaseStatus.pending_discharge):
        raise HTTPException(
            status_code=400,
            detail="Can only assign officers to an active or pending-discharge patient case",
        )

    agent = db.query(Agent).get(payload.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Relationship Officer not found")

    # Hard requirement, never overridable: an officer mid-verification, or
    # explicitly suspended, must never end up on a real patient. Previously
    # this function only checked the Agent row existed at all.
    try:
        check_officer_eligible(agent)
    except OfficerAssignmentError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    officer_changed = case.assigned_agent_id != payload.agent_id

    start = payload.start_date or datetime.utcnow().date()
    end = payload.end_date or start
    if end < start:
        raise HTTPException(status_code=400, detail="end_date can't be before start_date")
    if (end - start).days > 60:
        raise HTTPException(status_code=400, detail="Assign at most a 60-day range at a time")

    # Soft blocks — consciously overridable with force=True, but never silent.
    if not payload.force:
        if not agent.is_available:
            raise HTTPException(
                status_code=409,
                detail=f"{agent.full_name} is marked unavailable. Resend with force=true to assign them anyway.",
            )
        conflicts = check_capacity(db, agent, start, end, exclude_case_id=case_id)
        if conflicts:
            worst = conflicts[0]
            names = ", ".join(worst.other_patient_names)
            raise HTTPException(
                status_code=409,
                detail=(
                    f"{agent.full_name} would be covering more than "
                    f"{settings.MAX_DAILY_PATIENTS_PER_OFFICER} patients on {worst.day.isoformat()} "
                    f"(already on {names}). Resend with force=true to assign anyway, or pick another officer."
                ),
            )

    case.assigned_agent_id = payload.agent_id

    # Rotate on a real officer change (kills the old officer's link), mint on
    # first assignment, otherwise just refresh the existing link's expiry.
    issue_officer_discharge_token(case, rotate=officer_changed)

    if officer_changed and payload.reset_officer_confirmation and case.officer_discharge_at:
        case.officer_discharge_at = None

    existing = {
        a.date: a
        for a in db.query(DailyOfficerAssignment).filter(
            DailyOfficerAssignment.patient_case_id == case_id,
            DailyOfficerAssignment.date >= start,
            DailyOfficerAssignment.date <= end,
        ).all()
    }

    day = start
    while day <= end:
        if day in existing:
            existing[day].agent_id = payload.agent_id
            existing[day].status = DailyAssignmentStatus.assigned
            existing[day].note = payload.note
            existing[day].assigned_by_id = admin.id
        else:
            db.add(DailyOfficerAssignment(
                patient_case_id=case_id, agent_id=payload.agent_id, date=day,
                note=payload.note, assigned_by_id=admin.id,
            ))
        day += timedelta(days=1)

    # Clearing the outgoing officer's confirmation can move the case back out
    # of pending_discharge, so always recompute rather than assume.
    recompute_discharge_status(case)

    db.commit()
    case = _cases_query(db).filter(PatientCase.id == case_id).first()
    return _to_case_out(case)


@router.post("/patients/{case_id}/force-close-discharge", response_model=PatientCaseOut)
def force_close_case_discharge(
    case_id: int,
    payload: ForceCloseDischargeIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Admin override for a discharge stuck half-confirmed.

    This is the escape hatch for the real-world case the dual confirmation
    has no answer for: the officer lost their phone, left the job, or simply
    never responds, while the hospital has already confirmed - so the case
    sits in pending_discharge forever and keeps billing. Fills in whatever
    confirmation is missing, closes the case, kills the officer's link, and
    permanently records who overrode it and why (reason is mandatory)."""
    case = _cases_query(db).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")
    try:
        force_close_discharge(case, payload.discharge_datetime, admin.id, payload.reason)
    except DischargeValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    db.commit()
    case = _cases_query(db).filter(PatientCase.id == case_id).first()
    return _to_case_out(case)


@router.post("/patients/{case_id}/discharge-link", response_model=OfficerLinkOut)
def regenerate_officer_discharge_link(
    case_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Mint a fresh no-login discharge link for the assigned officer. The
    previous link stops working the instant this returns - which is the point:
    it's how a link that went to the wrong person, or expired, gets fixed."""
    case = db.query(PatientCase).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")
    if not case.assigned_agent_id:
        raise HTTPException(
            status_code=400,
            detail="Assign a Relationship Officer to this case first - there's nobody to send a link to.",
        )
    if case.status in (PatientCaseStatus.discharged, PatientCaseStatus.cancelled):
        raise HTTPException(status_code=400, detail="This case is closed - its discharge link has no further use.")

    token = issue_officer_discharge_token(case, rotate=True)
    db.commit()
    return OfficerLinkOut(
        officer_discharge_token=token,
        expires_at=case.officer_discharge_token_expires_at,
    )


@router.patch("/assignments/{assignment_id}", response_model=PatientCaseOut)
def update_daily_assignment_status(
    assignment_id: int,
    payload: AssignmentStatusIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Mark how a given day's coverage actually went - completed, or no_show.

    These two statuses existed on the model from the start but nothing in the
    app ever set them, so they were dead weight. A day marked no_show stops
    counting as covered (officer_on_duty() skips it), so the ops board asks
    for a re-assign for that date instead of quietly showing it as fine.

    Note on billing: coverage_days_and_billing() still counts calendar days
    admission-to-discharge, so a no_show day is still billed today. Whether a
    no-show should be credited back to the hospital is a commercial decision,
    not a code one - no_show_days is surfaced on every case so that call can
    be made with the number in hand."""
    row = db.query(DailyOfficerAssignment).filter(DailyOfficerAssignment.id == assignment_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Assignment not found")
    row.status = payload.status
    if payload.note is not None:
        row.note = payload.note
    db.commit()
    case = _cases_query(db).filter(PatientCase.id == row.patient_case_id).first()
    return _to_case_out(case)


@router.get("/discharge-alerts", response_model=List[PatientCaseOut])
def list_cases_needing_attention(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Every open case with at least one warning/critical alert - stuck
    discharges, uncovered patients, overdue expected-discharge dates, dead
    officer links. This is the closest thing to a reminder feed that needs no
    SMS/email provider: Admin opens the board and sees exactly what's rotting.
    Sorted worst-first."""
    cases = _cases_query(db).filter(
        PatientCase.status.in_([PatientCaseStatus.active, PatientCaseStatus.pending_discharge])
    ).order_by(PatientCase.admission_date).limit(500).all()

    rank = {"critical": 0, "warning": 1, "info": 2}
    out = []
    for c in cases:
        case_out = _to_case_out(c)
        if any(a.severity in ("critical", "warning") for a in case_out.alerts):
            out.append(case_out)
    out.sort(key=lambda c: min(rank.get(a.severity, 3) for a in c.alerts))
    return out


# ---------------------------------------------------------------------------
# Officer-wise roster — "what is this officer doing right now", answered
# directly instead of by scanning every case on the patient-first ops board.
# ---------------------------------------------------------------------------

def _officer_roster_out(db: Session, agent: Agent) -> OfficerRosterOut:
    from app.models.patient_case import PatientCaseStatus as _PCS  # local, avoid clutter above
    roster = build_officer_roster(db, agent)
    return OfficerRosterOut(
        agent_id=agent.id, full_name=agent.full_name, phone=agent.phone,
        status=agent.status.value, is_fully_verified=agent.is_fully_verified,
        is_available=agent.is_available, hospital_daily_rate=agent.hospital_daily_rate,
        today_cases=[
            OfficerRosterCaseOut(
                case_id=s.case_id, patient_name=s.patient_name, hospital_name=s.hospital_name,
                status=_PCS(s.status), is_fallback=s.is_fallback,
            )
            for s in roster.today_cases
        ],
        today_patient_count=roster.today_patient_count,
        active_case_count=roster.active_case_count,
        over_capacity_today=roster.over_capacity_today,
        no_show_days_30d=roster.no_show_days_30d,
        days_covered_this_month=roster.days_covered_this_month,
        payout_estimate_this_month=roster.payout_estimate_this_month,
        portal_token=agent.portal_token,
        portal_token_expires_at=agent.portal_token_expires_at,
        portal_link_live=portal_token_is_live(agent),
    )


@router.get("/officers", response_model=List[OfficerRosterOut])
def list_officer_roster(
    only_on_hospital_program: bool = True,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Every Relationship Officer, officer-first: who's covering how many
    patients today, at which hospitals, whether they're over the daily cap,
    how many days they've covered this month and the running payout estimate
    for that. Set only_on_hospital_program=false to include officers who've
    never been assigned a hospital patient at all (e.g. to onboard someone
    new to the program)."""
    agents = db.query(Agent).order_by(Agent.full_name).all()
    rosters = [_officer_roster_out(db, a) for a in agents]
    if only_on_hospital_program:
        rosters = [r for r in rosters if r.active_case_count > 0 or r.days_covered_this_month > 0]
    return rosters


@router.get("/officers/{agent_id}", response_model=OfficerRosterOut)
def get_officer_roster(agent_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    agent = db.query(Agent).get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Officer not found")
    return _officer_roster_out(db, agent)


@router.post("/officers/{agent_id}/portal-link", response_model=OfficerPortalLinkOut)
def regenerate_officer_portal_link(agent_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Mint (or rotate) the officer's own no-login 'my day' link — everything
    they're covering right now, across every hospital, in one place. Rotating
    kills the previous link immediately, same as the per-case discharge link."""
    agent = db.query(Agent).get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Officer not found")
    token = issue_portal_token(agent, rotate=True)
    db.commit()
    return OfficerPortalLinkOut(portal_token=token, expires_at=agent.portal_token_expires_at)


# ---------------------------------------------------------------------------
# Monthly hospital billing — turns discharged, not-yet-invoiced patient cases
# into a HospitalInvoice. See services/hospital_billing.py for the rule:
# only cases that have ACTUALLY discharged are ever swept in; a case still
# active or pending_discharge keeps billing quietly and lands on whichever
# invoice gets generated after it eventually discharges.
# ---------------------------------------------------------------------------

def _to_invoice_out(inv: HospitalInvoice) -> HospitalInvoiceOut:
    cases_out = []
    for c in inv.cases:
        days, amount = coverage_days_and_billing(c)
        cases_out.append(InvoiceCaseOut(
            case_id=c.id, patient_name=c.patient_name, admission_date=c.admission_date,
            discharged_at=c.discharged_at, days_covered=days, amount=amount,
        ))
    return HospitalInvoiceOut(
        id=inv.id, hospital_id=inv.hospital_id, hospital_name=inv.hospital.name if inv.hospital else None,
        period_start=inv.period_start, period_end=inv.period_end, case_count=inv.case_count,
        total_amount=inv.total_amount, status=inv.status, generated_at=inv.generated_at,
        paid_at=inv.paid_at, payment_reference=inv.payment_reference, payment_note=inv.payment_note,
        cases=cases_out,
    )


@router.get("/hospitals/{hospital_id}/pending-billing", response_model=PendingBillingOut)
def preview_pending_billing(hospital_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """What the NEXT invoice for this hospital would look like right now —
    every discharged, not-yet-invoiced case and what it totals — without
    actually generating anything."""
    hospital = db.query(Hospital).get(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    cases = uninvoiced_discharged_cases(db, hospital_id)
    total = round(sum(coverage_days_and_billing(c)[1] for c in cases), 2)
    return PendingBillingOut(case_count=len(cases), total_amount=total)


@router.post("/hospitals/{hospital_id}/invoices", response_model=HospitalInvoiceOut)
def create_invoice(
    hospital_id: int, payload: GenerateInvoiceIn, db: Session = Depends(get_db), admin: User = Depends(require_admin),
):
    """Generate this hospital's next invoice — every discharged case that
    hasn't been billed yet, whatever month it was actually admitted or
    discharged in. A case still active/pending_discharge is never included;
    it'll show up on a later invoice once it actually discharges."""
    hospital = db.query(Hospital).get(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    today = datetime.utcnow().date()
    period_start = payload.period_start or today.replace(day=1)
    if payload.period_end:
        period_end = payload.period_end
    else:
        import calendar
        last_day = calendar.monthrange(today.year, today.month)[1]
        period_end = date_cls(today.year, today.month, last_day)

    try:
        invoice = generate_invoice(db, hospital, period_start, period_end, admin.id)
    except InvoiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    invoice = (
        db.query(HospitalInvoice)
        .options(joinedload(HospitalInvoice.cases), joinedload(HospitalInvoice.hospital))
        .filter(HospitalInvoice.id == invoice.id)
        .first()
    )
    return _to_invoice_out(invoice)


@router.get("/invoices", response_model=List[HospitalInvoiceOut])
def list_all_invoices(
    hospital_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Every hospital invoice ROSKYRO has ever generated — the billing tab's
    single source of truth."""
    query = db.query(HospitalInvoice).options(
        joinedload(HospitalInvoice.cases), joinedload(HospitalInvoice.hospital),
    )
    if hospital_id:
        query = query.filter(HospitalInvoice.hospital_id == hospital_id)
    if status:
        query = query.filter(HospitalInvoice.status == status)
    invoices = query.order_by(HospitalInvoice.generated_at.desc()).limit(300).all()
    return [_to_invoice_out(inv) for inv in invoices]


@router.post("/invoices/{invoice_id}/mark-paid", response_model=HospitalInvoiceOut)
def mark_paid(
    invoice_id: int, payload: MarkInvoicePaidIn, db: Session = Depends(get_db), admin: User = Depends(require_admin),
):
    """Admin confirms a hospital's payment has actually come in (e.g. a bank
    transfer verified on WhatsApp) — no payment gateway wired up yet, same
    manual-confirm pattern as Membership invoices."""
    invoice = (
        db.query(HospitalInvoice)
        .options(joinedload(HospitalInvoice.cases), joinedload(HospitalInvoice.hospital))
        .filter(HospitalInvoice.id == invoice_id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    try:
        mark_invoice_paid(invoice, admin.id, payload.payment_reference, payload.payment_note)
    except InvoiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    db.commit()
    db.refresh(invoice)
    return _to_invoice_out(invoice)
