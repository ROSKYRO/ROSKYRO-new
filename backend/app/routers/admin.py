from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.core.deps import require_admin
from app.models.user import User, UserRole
from app.models.booking import Booking, BookingStatus
from app.models.agent import Agent, AgentStatus
from app.models.payment import Payment, PaymentStatus
from app.models.complaint import Complaint, ComplaintStatus
from app.schemas.admin import CustomerOut, AdminBookingOut, ComplaintOut, ComplaintUpdateIn

router = APIRouter(prefix="/admin", tags=["admin"])


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
    from datetime import datetime
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
