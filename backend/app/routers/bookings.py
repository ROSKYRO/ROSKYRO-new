import random
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user, require_admin
from app.core.security import generate_pin
from app.models.user import User
from app.models.service import Service
from app.models.agent import Agent
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.booking import (
    BookingEstimateIn, BookingEstimateOut, BookingCreateIn, BookingOut,
    BookingWithPinsOut, SubmitStartPinIn, SubmitEndPinIn, AssignAgentIn, SosIn,
)
from app.services.pricing import estimate_booking, price_booking
from app.core.config import settings

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _get_service_or_404(db: Session, service_id: int) -> Service:
    service = db.query(Service).get(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.post("/estimate", response_model=BookingEstimateOut)
def estimate(payload: BookingEstimateIn, db: Session = Depends(get_db)):
    service = _get_service_or_404(db, payload.service_id)
    breakdown = estimate_booking(
        booked_hours=payload.booked_hours,
        hourly_rate=service.hourly_rate,
        distance_km=payload.distance_km,
        ends_at_different_location=payload.ends_at_different_location,
    )
    return BookingEstimateOut(
        booked_hours=breakdown.booked_hours,
        hourly_rate=breakdown.hourly_rate,
        service_subtotal=breakdown.service_subtotal,
        arrival_fee=breakdown.arrival_fee,
        return_fee=breakdown.return_fee,
        gst_amount=breakdown.gst_amount,
        estimated_total=breakdown.total_amount,
    )


@router.post("", response_model=BookingWithPinsOut)
def create_booking(payload: BookingCreateIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _get_service_or_404(db, payload.service_id)

    booking = Booking(
        booking_code=f"RK-{random.randint(10000, 99999)}",
        customer_id=user.id,
        service_id=payload.service_id,
        city_id=payload.city_id,
        address=payload.address,
        contact_on_arrival_name=payload.contact_on_arrival_name,
        contact_on_arrival_phone=payload.contact_on_arrival_phone,
        notes=payload.notes,
        scheduled_start=payload.scheduled_start,
        booked_hours=payload.booked_hours,
        distance_km=payload.distance_km,
        ends_at_different_location=payload.ends_at_different_location,
        status=BookingStatus.requested,
        start_pin=generate_pin(),
        end_pin=generate_pin(),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/mine", response_model=List[BookingOut])
def my_bookings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Booking)
        .filter(Booking.customer_id == user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    booking = db.query(Booking).get(booking_id)
    if not booking or booking.customer_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/{booking_id}/assign", response_model=BookingOut)
def assign_agent(booking_id: int, payload: AssignAgentIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    booking = db.query(Booking).get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    agent = db.query(Agent).get(payload.agent_id)
    if not agent or not agent.is_fully_verified:
        raise HTTPException(status_code=400, detail="Agent is not fully verified or does not exist")

    booking.agent_id = agent.id
    booking.status = BookingStatus.assigned
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/en-route", response_model=BookingOut)
def mark_en_route(booking_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    booking = _require_assigned(db, booking_id)
    booking.status = BookingStatus.en_route
    db.commit()
    db.refresh(booking)
    return booking


def _require_assigned(db: Session, booking_id: int) -> Booking:
    booking = db.query(Booking).get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/{booking_id}/arrived", response_model=BookingOut)
def mark_arrived(booking_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Agent has arrived at the door; now waiting on the customer's Start PIN."""
    booking = _require_assigned(db, booking_id)
    booking.status = BookingStatus.awaiting_start_pin
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/start", response_model=BookingOut)
def submit_start_pin(booking_id: int, payload: SubmitStartPinIn, db: Session = Depends(get_db)):
    """
    Customer (or agent's handset, entered by the customer) submits the Start PIN.
    This is the moment billing time begins - never before.
    """
    booking = _require_assigned(db, booking_id)
    if booking.status != BookingStatus.awaiting_start_pin:
        raise HTTPException(status_code=400, detail="Booking is not awaiting a Start PIN right now")
    if payload.start_pin != booking.start_pin:
        raise HTTPException(status_code=400, detail="Incorrect Start PIN")

    booking.status = BookingStatus.in_progress
    booking.actual_start_at = datetime.utcnow()
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/end", response_model=BookingOut)
def submit_end_pin(booking_id: int, payload: SubmitEndPinIn, db: Session = Depends(get_db)):
    """
    Customer submits the End PIN. This closes the clock and generates the bill
    using actual time worked, per the pricing engine rules.
    """
    booking = _require_assigned(db, booking_id)
    if booking.status != BookingStatus.in_progress:
        raise HTTPException(status_code=400, detail="Booking is not in progress")
    if payload.end_pin != booking.end_pin:
        raise HTTPException(status_code=400, detail="Incorrect End PIN")

    booking.actual_end_at = datetime.utcnow()
    actual_hours = max((booking.actual_end_at - booking.actual_start_at).total_seconds() / 3600.0, 0.01)

    service = db.query(Service).get(booking.service_id)
    breakdown = price_booking(
        booked_hours=booking.booked_hours,
        actual_hours=actual_hours,
        hourly_rate=service.hourly_rate,
        distance_km=booking.distance_km,
        ends_at_different_location=booking.ends_at_different_location,
    )

    booking.status = BookingStatus.completed
    booking.hourly_rate_snapshot = breakdown.hourly_rate
    booking.billable_hours = breakdown.billable_hours
    booking.service_subtotal = breakdown.service_subtotal
    booking.arrival_fee = breakdown.arrival_fee
    booking.return_fee = breakdown.return_fee
    booking.discount_amount = breakdown.discount_amount
    booking.gst_amount = breakdown.gst_amount
    booking.total_amount = breakdown.total_amount

    payment = Payment(booking_id=booking.id, amount=breakdown.total_amount, status=PaymentStatus.pending)
    db.add(payment)

    if booking.agent_id:
        agent = db.query(Agent).get(booking.agent_id)
        agent.total_jobs += 1

    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    booking = db.query(Booking).get(booking_id)
    if not booking or booking.customer_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status in (BookingStatus.in_progress, BookingStatus.completed):
        raise HTTPException(status_code=400, detail="A booking already in progress can only be ended early via the End PIN")
    booking.status = BookingStatus.cancelled
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/sos", response_model=BookingOut)
def trigger_sos(booking_id: int, payload: SosIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Available on every active booking; flags it for immediate leadership attention."""
    booking = db.query(Booking).get(booking_id)
    if not booking or booking.customer_id != user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.sos_triggered = True
    db.commit()
    db.refresh(booking)
    return booking
