import random
import string
from datetime import datetime, timedelta
from typing import List, Optional, Union

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
from app.models.membership import (
    Membership, MembershipStatus, MembershipPlan, PLAN_MONTHLY_PRICE,
    FamilyMember, MembershipInvoice, InvoiceStatus,
)
from app.models.priority_access import (
    PartnerApplication, ApplicationStatus, Partner, PartnerStatus,
    PriorityAccessAvailability, AppointmentRequest,
)
from app.schemas.admin import (
    CustomerOut, AdminBookingOut, ComplaintOut, ComplaintUpdateIn,
    TeamMemberOut, TeamMemberCreateIn, TeamMemberUpdateIn,
    AdminMembershipOut, AdminMembershipStatusIn, AdminInvoiceOut,
    AdminPartnerApplicationOut, AdminApplicationReviewIn,
    AdminPartnerOut, AdminPartnerUpdateIn,
    AdminAppointmentRequestOut, AdminAppointmentRequestUpdateIn,
    AdminPartnerQuickAddIn, AdminAppointmentQuickAddIn,
    AdminMembershipQuickAddIn, AdminMembershipQuickAddOut,
)
from app.schemas.auth import LoginIn, TokenOut
from app.schemas.service import ServiceOut, ServiceCreateIn, ServiceUpdateIn
from app.schemas.city import CityAdminOut, CityCreateIn, CityUpdateIn
from app.schemas.agent import AgentOut, PartnerCreateIn, PartnerStatusIn

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


# ---------- ROSKYRO Concierge membership management ----------

def _membership_to_admin_out(db: Session, m: Membership) -> AdminMembershipOut:
    family_count = db.query(func.count(FamilyMember.id)).filter(FamilyMember.membership_id == m.id).scalar()
    return AdminMembershipOut(
        id=m.id,
        member_code=m.member_code,
        plan=m.plan.value,
        status=m.status.value,
        monthly_price_snapshot=m.monthly_price_snapshot,
        started_at=m.started_at,
        next_billing_date=m.next_billing_date,
        customer_name=m.user.full_name,
        customer_phone=m.user.phone,
        family_member_count=family_count or 0,
    )


@router.get("/memberships", response_model=List[AdminMembershipOut])
def admin_list_memberships(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(Membership)
    if status_filter:
        q = q.filter(Membership.status == MembershipStatus(status_filter))
    memberships = q.order_by(Membership.created_at.desc()).all()
    return [_membership_to_admin_out(db, m) for m in memberships]


@router.patch("/memberships/{membership_id}/status", response_model=AdminMembershipOut)
def admin_update_membership_status(
    membership_id: int,
    payload: AdminMembershipStatusIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    membership.status = MembershipStatus(payload.status)
    if membership.status == MembershipStatus.cancelled:
        membership.cancelled_at = datetime.utcnow()
    db.commit()
    db.refresh(membership)
    return _membership_to_admin_out(db, membership)


@router.get("/memberships/invoices", response_model=List[AdminInvoiceOut])
def admin_list_invoices(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(MembershipInvoice)
    if status_filter:
        q = q.filter(MembershipInvoice.status == InvoiceStatus(status_filter))
    return q.order_by(MembershipInvoice.created_at.desc()).all()


@router.post("/memberships/invoices/{invoice_id}/mark-paid", response_model=AdminInvoiceOut)
def admin_mark_invoice_paid(invoice_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Manual payment confirmation — same pattern as Assist bookings (UPI
    screenshot confirmed on WhatsApp, then marked paid here). Activates the
    membership on its first invoice and pushes the next billing date out
    by one cycle."""
    invoice = db.query(MembershipInvoice).filter(MembershipInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.status = InvoiceStatus.paid
    invoice.paid_at = datetime.utcnow()

    membership = db.query(Membership).filter(Membership.id == invoice.membership_id).first()
    if membership:
        if membership.status == MembershipStatus.pending:
            membership.status = MembershipStatus.active
        membership.next_billing_date = invoice.period_end

    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/memberships/{membership_id}/invoices/renew", response_model=AdminInvoiceOut)
def admin_create_renewal_invoice(membership_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Manually generate the next billing-cycle invoice for a membership.
    (A scheduled job calling this automatically each cycle is the natural
    next step once this is running in production.)"""
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")

    period_start = membership.next_billing_date or datetime.utcnow()
    period_end = period_start + timedelta(days=30)

    invoice = MembershipInvoice(
        membership_id=membership.id,
        period_start=period_start,
        period_end=period_end,
        amount=membership.monthly_price_snapshot,
        status=InvoiceStatus.pending,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


# ---------- Priority Access Network ----------

@router.get("/priority-access/applications", response_model=List[AdminPartnerApplicationOut])
def admin_list_applications(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(PartnerApplication)
    if status_filter:
        q = q.filter(PartnerApplication.status == ApplicationStatus(status_filter))
    return q.order_by(PartnerApplication.submitted_at.desc()).all()


@router.post("/priority-access/applications/{application_id}/review", response_model=Union[AdminPartnerOut, AdminPartnerApplicationOut])
def admin_review_application(
    application_id: int,
    payload: AdminApplicationReviewIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    application = db.query(PartnerApplication).filter(PartnerApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.status != ApplicationStatus.pending:
        raise HTTPException(status_code=400, detail="This application has already been reviewed.")

    application.review_notes = payload.review_notes
    application.reviewed_by_id = admin.id
    application.reviewed_at = datetime.utcnow()

    if not payload.approve:
        application.status = ApplicationStatus.rejected
        db.commit()
        db.refresh(application)
        return application

    application.status = ApplicationStatus.approved

    partner = Partner(
        source_application_id=application.id,
        partner_type=application.partner_type,
        name=application.name,
        city=application.city,
        area=application.area,
        address=application.address,
        contact_number=application.contact_number,
        whatsapp=application.whatsapp,
        email=application.email,
        website=application.website,
        maps_link=application.maps_link,
        specialty=application.specialty,
        sub_specialty=application.sub_specialty,
        qualification=application.qualification,
        affiliation=application.affiliation,
        consultation_fee=application.consultation_fee,
        priority_fee=application.priority_fee,
        priority_slots=application.priority_slots,
        available_days=application.available_days,
        available_timings=application.available_timings,
        departments=application.departments,
        specialists=application.specialists,
        opd_timings=application.opd_timings,
        emergency_available=application.emergency_available,
        concierge_desk_contact=application.concierge_desk_contact,
        partner_status=PartnerStatus.active,
        priority_access_status=PriorityAccessAvailability.available,
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.get("/priority-access/partners", response_model=List[AdminPartnerOut])
def admin_list_partners(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Partner).order_by(Partner.name.asc()).all()


@router.patch("/priority-access/partners/{partner_id}", response_model=AdminPartnerOut)
def admin_update_partner(
    partner_id: int,
    payload: AdminPartnerUpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    data = payload.model_dump(exclude_unset=True)
    if "partner_status" in data:
        partner.partner_status = PartnerStatus(data.pop("partner_status"))
    if "priority_access_status" in data:
        partner.priority_access_status = PriorityAccessAvailability(data.pop("priority_access_status"))
    for field, value in data.items():
        setattr(partner, field, value)

    db.commit()
    db.refresh(partner)
    return partner


@router.get("/priority-access/appointment-requests", response_model=List[AdminAppointmentRequestOut])
def admin_list_appointment_requests(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(AppointmentRequest)
    if status_filter:
        from app.models.priority_access import AppointmentRequestStatus
        q = q.filter(AppointmentRequest.status == AppointmentRequestStatus(status_filter))
    return q.order_by(AppointmentRequest.created_at.desc()).all()


@router.patch("/priority-access/appointment-requests/{request_id}", response_model=AdminAppointmentRequestOut)
def admin_update_appointment_request(
    request_id: int,
    payload: AdminAppointmentRequestUpdateIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from app.models.priority_access import AppointmentRequestStatus
    req = db.query(AppointmentRequest).filter(AppointmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Appointment request not found")

    req.status = AppointmentRequestStatus(payload.status)
    if payload.concierge_notes is not None:
        req.concierge_notes = payload.concierge_notes
    req.assigned_admin_id = admin.id
    if req.status in (AppointmentRequestStatus.confirmed, AppointmentRequestStatus.cancelled):
        req.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(req)
    return req


# ---------- Quick Add: manual entry for WhatsApp/phone-origin activity ----------
# ROSKYRO's real-world flow today runs through WhatsApp, not the site's own
# forms. These endpoints let an admin log that same activity straight into
# the system in a few seconds — no application/signup wait — so the admin
# dashboard reflects reality instead of sitting empty.

@router.post("/priority-access/partners/quick-add", response_model=AdminPartnerOut)
def admin_quick_add_partner(
    payload: AdminPartnerQuickAddIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Add a doctor/hospital straight to the live directory — for when they
    were verified over a WhatsApp/phone conversation instead of through the
    public application form."""
    partner = Partner(
        partner_status=PartnerStatus.active,
        priority_access_status=PriorityAccessAvailability.available,
        **payload.model_dump(),
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.post("/priority-access/appointment-requests/quick-add", response_model=AdminAppointmentRequestOut)
def admin_quick_add_appointment_request(
    payload: AdminAppointmentQuickAddIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Log a patient's appointment request that came in over WhatsApp/call,
    so it's tracked in the system and shows up in history — even though the
    patient never used the site form. Linked to an existing account by phone
    number if one exists; otherwise it's just tracked against the partner."""
    partner = db.query(Partner).filter(Partner.id == payload.partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    existing_user = db.query(User).filter(User.phone == payload.patient_phone).first()

    req = AppointmentRequest(
        partner_id=partner.id,
        user_id=existing_user.id if existing_user else None,
        patient_name=payload.patient_name,
        patient_phone=payload.patient_phone,
        preferred_time=payload.preferred_time,
        notes=payload.notes,
        status=payload.status,
        concierge_notes=payload.concierge_notes,
        assigned_admin_id=admin.id,
        resolved_at=datetime.utcnow() if payload.status in ("confirmed", "cancelled") else None,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.post("/memberships/quick-add", response_model=AdminMembershipQuickAddOut)
def admin_quick_add_membership(
    payload: AdminMembershipQuickAddIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Sign up a member who called in / messaged on WhatsApp instead of
    using the site's self-serve flow. Reuses their account if the phone
    number already exists; otherwise creates one with a temporary password
    to share with them (so they can still log in and see their dashboard
    later). Payment is assumed already confirmed over WhatsApp/UPI unless
    mark_as_paid is set to false."""
    user = db.query(User).filter(User.phone == payload.phone).first()
    account_created = False
    temp_password = None

    if not user:
        temp_password = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
        user = User(
            full_name=payload.full_name,
            phone=payload.phone,
            hashed_password=hash_password(temp_password),
            role=UserRole.customer,
        )
        db.add(user)
        db.flush()
        account_created = True

    if db.query(Membership).filter(Membership.user_id == user.id).first():
        raise HTTPException(status_code=400, detail="This phone number already has a ROSKYRO Concierge membership.")

    plan = MembershipPlan(payload.plan)
    price = PLAN_MONTHLY_PRICE[plan]
    now = datetime.utcnow()

    membership = Membership(
        member_code=f"RM-{random.randint(10000, 99999)}",
        user_id=user.id,
        plan=plan,
        status=MembershipStatus.active if payload.mark_as_paid else MembershipStatus.pending,
        monthly_price_snapshot=price,
        started_at=now,
        next_billing_date=now + timedelta(days=30),
    )
    db.add(membership)
    db.flush()

    invoice = MembershipInvoice(
        membership_id=membership.id,
        period_start=now,
        period_end=now + timedelta(days=30),
        amount=price,
        status=InvoiceStatus.paid if payload.mark_as_paid else InvoiceStatus.pending,
        paid_at=now if payload.mark_as_paid else None,
    )
    db.add(invoice)
    db.commit()
    db.refresh(membership)

    return AdminMembershipQuickAddOut(
        membership=_membership_to_admin_out(db, membership),
        account_created=account_created,
        temp_password=temp_password,
    )
