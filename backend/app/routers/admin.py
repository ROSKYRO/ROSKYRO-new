from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.core.deps import require_admin
from app.core.security import verify_password, create_access_token, hash_password
from app.core.limiter import limiter
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.booking import Booking, BookingStatus
from app.models.agent import Agent, AgentStatus
from app.models.payment import Payment, PaymentStatus
from app.models.complaint import Complaint, ComplaintStatus
from app.models.service import Service
from app.models.city import City
from app.models.hospital import Hospital
from app.schemas.admin import (
    CustomerOut, AdminBookingOut, ComplaintOut, ComplaintUpdateIn,
    TeamMemberOut, TeamMemberCreateIn, TeamMemberUpdateIn,
)
from app.schemas.auth import LoginIn, TokenOut
from app.schemas.service import ServiceOut, ServiceCreateIn, ServiceUpdateIn
from app.schemas.city import CityAdminOut, CityCreateIn, CityUpdateIn
from app.schemas.agent import AgentOut, PartnerCreateIn, PartnerStatusIn
from app.schemas.hospital import (
    HospitalOut, HospitalCreateIn, HospitalUpdateIn, HospitalStaffCreateIn, HospitalStaffOut,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/auth/login", response_model=TokenOut)
@limiter.limit(settings.ADMIN_LOGIN_RATE_LIMIT)
def admin_login(request: Request, payload: LoginIn, db: Session = Depends(get_db)):
    """The ONLY endpoint that can issue admin/support sessions. Deliberately
    separate from /auth/login (customer login) so the two are independently
    rate-limited, independently hardened, and never share a code path. Also
    issues a much shorter-lived token than customer sessions.
    """
    user = db.query(User).filter(User.phone == payload.phone).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    if user.role not in (UserRole.admin, UserRole.support):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid phone number or password")

    token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        expires_delta=timedelta(minutes=settings.ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenOut(access_token=token, role=user.role.value, user_id=user.id, full_name=user.full_name)


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    total_bookings = db.query(func.count(Booking.id)).scalar()
    active_bookings = db.query(func.count(Booking.id)).filter(
        Booking.status.in_([
            BookingStatus.requested, BookingStatus.assigned, BookingStatus.en_route,
            BookingStatus.awaiting_start_pin, BookingStatus.in_progress, BookingStatus.awaiting_end_pin,
        ])
    ).scalar()
    completed_bookings = db.query(func.count(Booking.id)).filter(Booking.status == BookingStatus.completed).scalar()
    sos_open = db.query(func.count(Booking.id)).filter(Booking.sos_triggered == True).scalar()  # noqa: E712

    gross_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(Payment.status == PaymentStatus.paid).scalar()
    pending_payments = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(Payment.status == PaymentStatus.pending).scalar()

    total_agents = db.query(func.count(Agent.id)).scalar()
    active_agents = db.query(func.count(Agent.id)).filter(Agent.status == AgentStatus.active).scalar()
    agents_in_pipeline = db.query(func.count(Agent.id)).filter(
        Agent.status.in_([AgentStatus.applied, AgentStatus.screening, AgentStatus.interview, AgentStatus.background_check, AgentStatus.training])
    ).scalar()

    open_complaints = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.open).scalar()
    priority_complaints = db.query(func.count(Complaint.id)).filter(Complaint.is_priority == True, Complaint.status == ComplaintStatus.open).scalar()  # noqa: E712

    return {
        "bookings": {
            "total": total_bookings,
            "active": active_bookings,
            "completed": completed_bookings,
            "sos_open": sos_open,
        },
        "revenue": {
            "collected": gross_revenue,
            "pending_collection": pending_payments,
        },
        "agents": {
            "total": total_agents,
            "active": active_agents,
            "in_pipeline": agents_in_pipeline,
        },
        "complaints": {
            "open": open_complaints,
            "priority_open": priority_complaints,
        },
    }


@router.post("/payments/{booking_id}/confirm")
def confirm_payment(booking_id: int, upi_reference: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    payment = db.query(Payment).filter(Payment.booking_id == booking_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="No payment record for this booking")
    payment.status = PaymentStatus.paid
    payment.upi_reference = upi_reference
    payment.paid_at = datetime.utcnow()
    db.commit()
    return {"detail": "Payment marked as received"}


@router.get("/customers", response_model=List[CustomerOut])
def list_customers(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Every signed-up customer, most recent first, with their lifetime booking count."""
    customers = (
        db.query(User)
        .filter(User.role == UserRole.customer)
        .order_by(User.created_at.desc())
        .all()
    )
    return [
        CustomerOut(
            id=c.id,
            full_name=c.full_name,
            phone=c.phone,
            email=c.email,
            preferred_language=c.preferred_language,
            is_active=c.is_active,
            created_at=c.created_at,
            total_bookings=len(c.bookings),
        )
        for c in customers
    ]


@router.get("/bookings", response_model=List[AdminBookingOut])
def list_all_bookings(
    status: Optional[BookingStatus] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Every booking across every customer, with the customer/Partner/service names
    already joined in — the frontend doesn't need to make extra lookups."""
    query = db.query(Booking).order_by(Booking.created_at.desc())
    if status:
        query = query.filter(Booking.status == status)
    bookings = query.limit(500).all()
    return [
        AdminBookingOut(
            id=b.id,
            booking_code=b.booking_code,
            customer_name=b.customer.full_name if b.customer else "—",
            customer_phone=b.customer.phone if b.customer else "—",
            agent_name=b.agent.full_name if b.agent else None,
            service_name=b.service.name if b.service else "—",
            hospital_name=b.hospital.name if b.hospital else None,
            status=b.status,
            scheduled_start=b.scheduled_start,
            booked_hours=b.booked_hours,
            total_amount=b.total_amount,
            sos_triggered=b.sos_triggered,
            created_at=b.created_at,
        )
        for b in bookings
    ]


@router.get("/complaints", response_model=List[ComplaintOut])
def list_complaints(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """All complaints/feedback, priority (safety) + open ones surfaced first."""
    return (
        db.query(Complaint)
        .order_by(Complaint.is_priority.desc(), Complaint.created_at.desc())
        .all()
    )


@router.patch("/complaints/{complaint_id}", response_model=ComplaintOut)
def update_complaint(
    complaint_id: int,
    payload: ComplaintUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Mark a complaint in-review/resolved and optionally attach the admin's reply/notes."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.status = payload.status
    if payload.resolution_note is not None:
        complaint.resolution_note = payload.resolution_note
    if payload.status == ComplaintStatus.resolved:
        complaint.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(complaint)
    return complaint


# ============================================================================
# SERVICES — add, edit/toggle active, delete
# ============================================================================

@router.get("/services", response_model=List[ServiceOut])
def admin_list_services(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """All services, including inactive ones (the public /services endpoint
    only returns active ones)."""
    return db.query(Service).order_by(Service.display_order).all()


@router.post("/services", response_model=ServiceOut)
def admin_create_service(payload: ServiceCreateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(Service).filter(Service.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="A service with this slug already exists")
    service = Service(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.patch("/services/{service_id}", response_model=ServiceOut)
def admin_update_service(service_id: int, payload: ServiceUpdateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Edit fields, or flip is_active to activate/deactivate — deactivated
    services stop showing on the public site and can't be booked, but stay
    intact for reporting/history."""
    service = db.query(Service).get(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/services/{service_id}")
def admin_delete_service(service_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    service = db.query(Service).get(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    has_bookings = db.query(Booking.id).filter(Booking.service_id == service_id).first() is not None
    if has_bookings:
        raise HTTPException(
            status_code=400,
            detail="This service has existing bookings and can't be deleted. Deactivate it instead so it stops accepting new bookings.",
        )
    db.delete(service)
    db.commit()
    return {"detail": "Service deleted"}


# ============================================================================
# CITIES — add, mark live/inactive, delete
# ============================================================================

@router.get("/cities", response_model=List[CityAdminOut])
def admin_list_cities(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    cities = db.query(City).order_by(City.is_live.desc(), City.name).all()
    return [
        CityAdminOut(
            id=c.id, name=c.name, state=c.state, is_live=c.is_live,
            interest_count=c.interest_count, agent_count=len(c.agents),
        )
        for c in cities
    ]


@router.post("/cities", response_model=CityAdminOut)
def admin_create_city(payload: CityCreateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(City).filter(City.name.ilike(payload.name)).first():
        raise HTTPException(status_code=400, detail="A city with this name already exists")
    city = City(name=payload.name, state=payload.state, is_live=payload.is_live)
    db.add(city)
    db.commit()
    db.refresh(city)
    return CityAdminOut(id=city.id, name=city.name, state=city.state, is_live=city.is_live, interest_count=city.interest_count, agent_count=0)


@router.patch("/cities/{city_id}", response_model=CityAdminOut)
def admin_update_city(city_id: int, payload: CityUpdateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Edit name/state, or flip is_live to mark a city as live (bookable) or
    inactive (waitlist-only)."""
    city = db.query(City).get(city_id)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(city, field, value)
    db.commit()
    db.refresh(city)
    return CityAdminOut(id=city.id, name=city.name, state=city.state, is_live=city.is_live, interest_count=city.interest_count, agent_count=len(city.agents))


@router.delete("/cities/{city_id}")
def admin_delete_city(city_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    city = db.query(City).get(city_id)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    has_bookings = db.query(Booking.id).filter(Booking.city_id == city_id).first() is not None
    if has_bookings or city.agents:
        raise HTTPException(
            status_code=400,
            detail="This city has bookings or partners assigned and can't be deleted. Mark it inactive instead, or reassign its partners first.",
        )
    db.delete(city)
    db.commit()
    return {"detail": "City deleted"}


# ============================================================================
# PARTNERS (field agents) — add, activate/deactivate, delete
# ============================================================================

@router.post("/partners", response_model=AgentOut)
def admin_create_partner(payload: PartnerCreateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Onboard a partner directly (skipping the public apply queue) — e.g.
    someone recruited offline who's already vetted."""
    if db.query(Agent).filter(Agent.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="A partner with this phone number already exists")
    agent = Agent(
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        city_id=payload.city_id,
        hourly_rate=payload.hourly_rate,
        monthly_base_pay=payload.monthly_base_pay,
        status=payload.status,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.patch("/partners/{agent_id}/status", response_model=AgentOut)
def admin_set_partner_status(agent_id: int, payload: PartnerStatusIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Quick active/inactive toggle for a partner — set status to 'active'
    to let them accept bookings again, or 'suspended' to take them offline
    without deleting their record or history."""
    agent = db.query(Agent).get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Partner not found")
    agent.status = payload.status
    if payload.status == AgentStatus.suspended:
        agent.is_available = False
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/partners/{agent_id}")
def admin_delete_partner(agent_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    agent = db.query(Agent).get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Partner not found")
    has_bookings = db.query(Booking.id).filter(Booking.agent_id == agent_id).first() is not None
    if has_bookings:
        raise HTTPException(
            status_code=400,
            detail="This partner has booking history and can't be deleted. Suspend them instead to take them offline.",
        )
    db.delete(agent)
    db.commit()
    return {"detail": "Partner removed"}


# ============================================================================
# HOSPITALS (partners) — onboard, edit, and issue Hospital Console logins.
# This is the "Enterprise Hospital" side of FINAL REVENUE ARCHITECTURE.
# ============================================================================

def _hospital_out(h: Hospital) -> HospitalOut:
    return HospitalOut(
        id=h.id, name=h.name, city_id=h.city_id,
        city_name=h.city.name if h.city else None,
        address=h.address, contact_name=h.contact_name, contact_phone=h.contact_phone,
        contact_email=h.contact_email, contract_status=h.contract_status,
        monthly_contract_amount=h.monthly_contract_amount, is_active=h.is_active,
        logo_url=h.logo_url, created_at=h.created_at,
    )


@router.get("/hospitals", response_model=List[HospitalOut])
def admin_list_hospitals(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    hospitals = db.query(Hospital).order_by(Hospital.created_at.desc()).all()
    return [_hospital_out(h) for h in hospitals]


@router.post("/hospitals", response_model=HospitalOut)
def admin_create_hospital(payload: HospitalCreateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    hospital = Hospital(**payload.model_dump())
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return _hospital_out(hospital)


@router.patch("/hospitals/{hospital_id}", response_model=HospitalOut)
def admin_update_hospital(hospital_id: int, payload: HospitalUpdateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    hospital = db.query(Hospital).get(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(hospital, field, value)
    db.commit()
    db.refresh(hospital)
    return _hospital_out(hospital)


@router.delete("/hospitals/{hospital_id}")
def admin_delete_hospital(hospital_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    hospital = db.query(Hospital).get(hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    has_bookings = db.query(Booking.id).filter(Booking.hospital_id == hospital_id).first() is not None
    if has_bookings:
        raise HTTPException(
            status_code=400,
            detail="This hospital has journey history and can't be deleted. Mark it inactive instead.",
        )
    db.query(User).filter(User.hospital_id == hospital_id).update({User.hospital_id: None})
    db.delete(hospital)
    db.commit()
    return {"detail": "Hospital removed"}


@router.get("/hospitals/{hospital_id}/staff", response_model=List[HospitalStaffOut])
def admin_list_hospital_staff(hospital_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    staff = db.query(User).filter(User.hospital_id == hospital_id, User.role == UserRole.hospital_staff).all()
    hospital = db.query(Hospital).get(hospital_id)
    return [
        HospitalStaffOut(
            id=s.id, full_name=s.full_name, phone=s.phone, email=s.email,
            hospital_id=s.hospital_id, hospital_name=hospital.name if hospital else None,
            is_active=s.is_active, created_at=s.created_at,
        )
        for s in staff
    ]


@router.post("/hospitals/staff", response_model=HospitalStaffOut)
def admin_create_hospital_staff(payload: HospitalStaffCreateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Issue a Hospital Console login for a partner hospital."""
    hospital = db.query(Hospital).get(payload.hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="An account with this phone number already exists")

    staff = User(
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.hospital_staff,
        hospital_id=payload.hospital_id,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return HospitalStaffOut(
        id=staff.id, full_name=staff.full_name, phone=staff.phone, email=staff.email,
        hospital_id=staff.hospital_id, hospital_name=hospital.name,
        is_active=staff.is_active, created_at=staff.created_at,
    )


@router.delete("/hospitals/staff/{staff_id}")
def admin_delete_hospital_staff(staff_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    staff = db.query(User).filter(User.id == staff_id, User.role == UserRole.hospital_staff).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Hospital staff login not found")
    db.delete(staff)
    db.commit()
    return {"detail": "Hospital Console login removed"}


# ============================================================================
# TEAM (internal admin/support accounts) — add, activate/deactivate, delete
# ============================================================================

@router.get("/team", response_model=List[TeamMemberOut])
def admin_list_team(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    members = (
        db.query(User)
        .filter(User.role.in_([UserRole.admin, UserRole.support]))
        .order_by(User.created_at.desc())
        .all()
    )
    return [TeamMemberOut(id=m.id, full_name=m.full_name, phone=m.phone, email=m.email, role=m.role.value, is_active=m.is_active, created_at=m.created_at) for m in members]


@router.post("/team", response_model=TeamMemberOut)
def admin_create_team_member(payload: TeamMemberCreateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="An account with this phone number already exists")
    member = User(
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole(payload.role),
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return TeamMemberOut(id=member.id, full_name=member.full_name, phone=member.phone, email=member.email, role=member.role.value, is_active=member.is_active, created_at=member.created_at)


@router.patch("/team/{member_id}", response_model=TeamMemberOut)
def admin_update_team_member(
    member_id: int,
    payload: TeamMemberUpdateIn,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    """Edit a team member, change role, or flip is_active to disable their
    login without deleting the account."""
    member = db.query(User).filter(User.id == member_id, User.role.in_([UserRole.admin, UserRole.support])).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    data = payload.model_dump(exclude_unset=True)

    if data.get("is_active") is False and member.id == current.id:
        raise HTTPException(status_code=400, detail="You can't deactivate your own account")

    if "role" in data and data["role"] is not None:
        member.role = UserRole(data.pop("role"))
    if "password" in data and data["password"]:
        member.hashed_password = hash_password(data.pop("password"))
    for field in ("full_name", "email", "is_active"):
        if field in data and data[field] is not None:
            setattr(member, field, data[field])

    db.commit()
    db.refresh(member)
    return TeamMemberOut(id=member.id, full_name=member.full_name, phone=member.phone, email=member.email, role=member.role.value, is_active=member.is_active, created_at=member.created_at)


@router.delete("/team/{member_id}")
def admin_delete_team_member(member_id: int, db: Session = Depends(get_db), current: User = Depends(require_admin)):
    member = db.query(User).filter(User.id == member_id, User.role.in_([UserRole.admin, UserRole.support])).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    if member.id == current.id:
        raise HTTPException(status_code=400, detail="You can't delete your own account")
    remaining_admins = db.query(func.count(User.id)).filter(User.role == UserRole.admin, User.id != member.id).scalar()
    if member.role == UserRole.admin and remaining_admins == 0:
        raise HTTPException(status_code=400, detail="Can't delete the last remaining admin account")
    db.delete(member)
    db.commit()
    return {"detail": "Team member removed"}
