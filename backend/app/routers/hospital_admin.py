from datetime import datetime, timedelta, date as date_cls
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.hospital import Hospital
from app.models.agent import Agent
from app.models.patient_case import PatientCase, PatientCaseStatus, DailyOfficerAssignment, DailyAssignmentStatus
from app.schemas.hospital import (
    HospitalOut, HospitalCreateIn, HospitalUpdateIn, HospitalStaffCreateIn, HospitalStaffOut,
    PatientCaseOut, DailyAssignmentOut, AssignOfficerIn,
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
    )


def _to_case_out(c: PatientCase) -> PatientCaseOut:
    today = datetime.utcnow().date()
    today_assignment = next((a for a in c.assignments if a.date == today), None)
    days_covered = len(c.assignments)
    return PatientCaseOut(
        id=c.id, hospital_id=c.hospital_id, hospital_name=c.hospital.name if c.hospital else None,
        patient_name=c.patient_name, patient_age=c.patient_age, attendant_name=c.attendant_name,
        attendant_phone=c.attendant_phone, ward_or_room=c.ward_or_room, short_note=c.short_note,
        admission_date=c.admission_date, expected_discharge_date=c.expected_discharge_date,
        status=c.status, daily_rate=c.daily_rate, days_covered=days_covered,
        billed_estimate=round(days_covered * c.daily_rate, 2),
        today_officer_name=today_assignment.agent.full_name if today_assignment and today_assignment.agent else None,
        created_at=c.created_at, discharged_at=c.discharged_at,
        assignments=[
            DailyAssignmentOut(
                id=a.id, date=a.date, agent_id=a.agent_id,
                agent_name=a.agent.full_name if a.agent else "—", agent_phone=a.agent.phone if a.agent else None,
                status=a.status, note=a.note,
            )
            for a in c.assignments
        ],
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
            query = query.filter(PatientCase.status == PatientCaseStatus(status))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter")
    else:
        query = query.filter(PatientCase.status == PatientCaseStatus.active)

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
    patient for a day, or a whole date range at once — e.g. cover their
    full expected stay in a single call. Re-running this for a date that
    already has an assignment just swaps the officer for that day, so
    fixing a mistake or handling a no-show is a single click, not a new row."""
    case = db.query(PatientCase).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")
    if case.status != PatientCaseStatus.active:
        raise HTTPException(status_code=400, detail="Can only assign officers to an active patient case")

    agent = db.query(Agent).get(payload.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Relationship Officer not found")

    start = payload.start_date or datetime.utcnow().date()
    end = payload.end_date or start
    if end < start:
        raise HTTPException(status_code=400, detail="end_date can't be before start_date")
    if (end - start).days > 60:
        raise HTTPException(status_code=400, detail="Assign at most a 60-day range at a time")

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

    db.commit()
    case = _cases_query(db).filter(PatientCase.id == case_id).first()
    return _to_case_out(case)
