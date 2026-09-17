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
from app.schemas.auth import LoginIn, TokenOut
from app.schemas.hospital import (
    PublicHospitalOut, PatientCaseCreateIn, PatientCaseStatusIn, PatientCaseOut,
    DailyAssignmentOut, HospitalDashboardOut,
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
    today = datetime.utcnow().date()
    today_assignment = next((a for a in c.assignments if a.date == today), None)
    days_covered = len(c.assignments)
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
        billed_estimate=round(days_covered * c.daily_rate, 2),
        today_officer_name=today_assignment.agent.full_name if today_assignment and today_assignment.agent else None,
        created_at=c.created_at,
        discharged_at=c.discharged_at,
        assignments=[
            DailyAssignmentOut(
                id=a.id, date=a.date, agent_id=a.agent_id,
                agent_name=a.agent.full_name if a.agent else "—",
                agent_phone=a.agent.phone if a.agent else None,
                status=a.status, note=a.note,
            )
            for a in c.assignments
        ],
    )


def _hospital_cases_query(db: Session, hospital_id: int):
    return (
        db.query(PatientCase)
        .options(joinedload(PatientCase.assignments).joinedload(DailyOfficerAssignment.agent), joinedload(PatientCase.hospital))
        .filter(PatientCase.hospital_id == hospital_id)
    )


@router.get("/dashboard", response_model=HospitalDashboardOut)
def dashboard(db: Session = Depends(get_db), staff: User = Depends(require_hospital_staff)):
    hospital = db.query(Hospital).get(staff.hospital_id)
    today = datetime.utcnow().date()
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    active_cases = _hospital_cases_query(db, staff.hospital_id).filter(PatientCase.status == PatientCaseStatus.active).all()
    active_patients = len(active_cases)
    today_assigned = sum(1 for c in active_cases if any(a.date == today for a in c.assignments))
    today_unassigned = active_patients - today_assigned

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
            query = query.filter(PatientCase.status == PatientCaseStatus(status))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter")
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
    """Hospital marks a case discharged (billing stops) or cancels it. Only
    the hospital that opened the case can change its status."""
    case = db.query(PatientCase).filter(PatientCase.id == case_id, PatientCase.hospital_id == staff.hospital_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")

    case.status = payload.status
    if payload.status == PatientCaseStatus.discharged:
        case.discharged_at = datetime.utcnow()
    db.commit()
    db.refresh(case)
    return _to_case_out(case)
