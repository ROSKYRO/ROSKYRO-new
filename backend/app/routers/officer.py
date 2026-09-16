import base64
import binascii
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.booking import Booking, BookingStatus
from app.schemas.officer import (
    OfficerBookingOut, OfficerPhotoIn, OfficerArrivalOut, OfficerCompletionOut,
)

router = APIRouter(prefix="/officer", tags=["officer"])

# Roughly 6MB of raw bytes — generous for a phone-camera photo the frontend
# has already compressed client-side, but stops someone from posting an
# arbitrarily large payload at this unauthenticated-by-password endpoint.
_MAX_PHOTO_BYTES = 6 * 1024 * 1024


def _get_booking_by_token(db: Session, token: str) -> Booking:
    """The token itself IS the authentication here (see Booking.officer_token) —
    there's no separate Partner login in this build yet, so a long random,
    single-purpose link stands in for one. Never reveal *why* a token is
    invalid (expired vs. never existed vs. wrong booking) — just 404."""
    booking = db.query(Booking).filter(Booking.officer_token == token).first()
    if not booking:
        raise HTTPException(status_code=404, detail="This link is invalid or has expired.")
    return booking


def _decode_photo(photo_base64: str) -> str:
    """Validates the incoming photo is actually decodable base64 image data
    and within the size cap, then returns the clean base64 string (without a
    data: URL prefix) for storage."""
    raw = photo_base64
    if "," in raw and raw.strip().lower().startswith("data:"):
        raw = raw.split(",", 1)[1]
    try:
        decoded = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Could not read that photo — please retake it.")
    if len(decoded) > _MAX_PHOTO_BYTES:
        raise HTTPException(status_code=400, detail="That photo is too large — please retake it.")
    if len(decoded) < 100:
        raise HTTPException(status_code=400, detail="That doesn't look like a valid photo — please retake it.")
    return raw


@router.get("/{token}", response_model=OfficerBookingOut)
def get_officer_booking(token: str, db: Session = Depends(get_db)):
    booking = _get_booking_by_token(db, token)
    return OfficerBookingOut(
        booking_code=booking.booking_code,
        status=booking.status,
        customer_name=booking.customer.full_name if booking.customer else "Customer",
        address=booking.address,
        scheduled_start=booking.scheduled_start,
        service_name=booking.service.name if booking.service else "—",
        has_arrival_photo=bool(booking.arrival_photo_base64),
        has_completion_photo=bool(booking.completion_photo_base64),
    )


@router.post("/{token}/arrival", response_model=OfficerArrivalOut)
def submit_arrival_photo(token: str, payload: OfficerPhotoIn, db: Session = Depends(get_db)):
    """Officer confirms they've reached the customer's address, with a
    timestamped photo (and GPS, if granted) as proof. Moves the booking to
    'awaiting_start_pin' — the same state the admin's manual /arrived endpoint
    used to set, now driven by the officer themselves instead of a phone call
    to dispatch."""
    booking = _get_booking_by_token(db, token)
    if booking.status not in (BookingStatus.assigned, BookingStatus.en_route):
        raise HTTPException(
            status_code=400,
            detail="This visit isn't at the 'on the way' stage right now, so arrival can't be confirmed.",
        )
    booking.arrival_photo_base64 = _decode_photo(payload.photo_base64)
    booking.arrival_photo_at = datetime.utcnow()
    booking.arrival_lat = payload.lat
    booking.arrival_lng = payload.lng
    booking.status = BookingStatus.awaiting_start_pin
    db.commit()
    return OfficerArrivalOut(
        status=booking.status,
        message="Arrival confirmed. Ask the customer for the Start PIN to begin the service clock.",
    )


@router.post("/{token}/completion", response_model=OfficerCompletionOut)
def submit_completion_photo(token: str, payload: OfficerPhotoIn, db: Session = Depends(get_db)):
    """Officer confirms the visit is finished, with a timestamped photo (and
    GPS, if granted) as proof. Reveals the End PIN right here, to the officer,
    only now — this is the one and only place the End PIN is ever disclosed,
    so the customer can never end (and stop billing on) a visit early on
    their own, and the officer has photo evidence of exactly when the work
    was actually done."""
    booking = _get_booking_by_token(db, token)
    if booking.status != BookingStatus.in_progress:
        raise HTTPException(
            status_code=400,
            detail="This visit isn't in progress right now, so completion can't be confirmed.",
        )
    booking.completion_photo_base64 = _decode_photo(payload.photo_base64)
    booking.completion_photo_at = datetime.utcnow()
    booking.completion_lat = payload.lat
    booking.completion_lng = payload.lng
    db.commit()
    return OfficerCompletionOut(
        status=booking.status,
        message="Completion photo saved. Tell the customer this End PIN to close billing:",
        end_pin=booking.end_pin,
    )
