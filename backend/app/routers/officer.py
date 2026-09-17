import base64
import binascii
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.booking import Booking, BookingStatus
from app.models.agent import Agent
from app.models.patient_case import PatientCase, PatientCaseStatus
from app.schemas.officer import (
    OfficerBookingOut, OfficerPhotoIn, OfficerArrivalOut, OfficerCompletionOut,
    OfficerPatientCaseOut, OfficerDischargeIn, OfficerDischargeOut,
    OfficerPortalOut, OfficerPortalCaseOut,
)
from app.services.patient_billing import (
    apply_officer_discharge_confirmation, undo_officer_discharge_confirmation,
    officer_discharge_link_is_live, discharge_waiting_on, DischargeValidationError,
    officer_on_duty,
)
from app.services.officer_roster import portal_token_is_live

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


# ---------------------------------------------------------------------------
# Hospital patient-case discharge — the assigned Relationship Officer's side
# of the dual discharge confirmation. Same no-login, token-is-the-auth
# pattern as the booking capture endpoints above: the officer has no
# Console/User login in this build, so a long random, single-purpose link
# (PatientCase.officer_discharge_token, handed out from the ROSKYRO Admin
# ops board) stands in for one.
# ---------------------------------------------------------------------------

def _get_case_by_discharge_token(db: Session, token: str) -> PatientCase:
    """Same rule as the booking links above: the token IS the authentication,
    and we never reveal *why* it failed. Unlike before, these links now have
    an expiry (PatientCase.officer_discharge_token_expires_at) — an expired
    one is treated exactly like one that never existed, so a link that ends up
    in the wrong hands stops being a way for a stranger to close someone's
    discharge. Admin can mint a fresh one at any time, which also instantly
    kills the previous link."""
    case = db.query(PatientCase).filter(PatientCase.officer_discharge_token == token).first()
    if not case or not officer_discharge_link_is_live(case):
        raise HTTPException(status_code=404, detail="This link is invalid or has expired.")
    return case


@router.get("/discharge/{token}", response_model=OfficerPatientCaseOut)
def get_officer_discharge_case(token: str, db: Session = Depends(get_db)):
    case = _get_case_by_discharge_token(db, token)
    return OfficerPatientCaseOut(
        patient_name=case.patient_name,
        hospital_name=case.hospital.name if case.hospital else None,
        admission_date=case.admission_date,
        status=case.status,
        hospital_discharge_at=case.hospital_discharge_at,
        officer_discharge_at=case.officer_discharge_at,
        waiting_on=discharge_waiting_on(case),
        link_expires_at=case.officer_discharge_token_expires_at,
    )


@router.post("/discharge/{token}", response_model=OfficerDischargeOut)
def confirm_officer_discharge(token: str, payload: OfficerDischargeIn, db: Session = Depends(get_db)):
    """The assigned officer confirms the date & time the patient was
    actually discharged. This only closes the case (stops billing) once the
    hospital has also confirmed their side — until then it just moves to
    'pending_discharge' and waits on the other confirmation."""
    case = _get_case_by_discharge_token(db, token)
    if case.status == PatientCaseStatus.discharged:
        raise HTTPException(status_code=400, detail="This case is already fully discharged.")
    if case.status == PatientCaseStatus.cancelled:
        raise HTTPException(status_code=400, detail="This case was cancelled — there's nothing to discharge.")

    try:
        apply_officer_discharge_confirmation(case, payload.discharge_datetime)
    except DischargeValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    db.commit()

    if case.status == PatientCaseStatus.discharged:
        message = "Discharge confirmed. The hospital had already confirmed theirs, so this case is now fully closed."
    else:
        message = "Your discharge confirmation is saved. Waiting on the hospital to confirm their side too before this case closes."
    return OfficerDischargeOut(status=case.status, message=message)


@router.delete("/discharge/{token}", response_model=OfficerDischargeOut)
def undo_officer_discharge(token: str, db: Session = Depends(get_db)):
    """The officer takes back a confirmation given by mistake — the mirror of
    the hospital's undo. Only possible while the case hasn't fully closed;
    after that it's an Admin decision."""
    case = _get_case_by_discharge_token(db, token)
    if not case.officer_discharge_at:
        raise HTTPException(status_code=400, detail="You haven't confirmed a discharge for this patient yet.")
    try:
        undo_officer_discharge_confirmation(case)
    except DischargeValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    db.commit()
    return OfficerDischargeOut(
        status=case.status,
        message="Your discharge confirmation has been withdrawn. Confirm again once you have the right date & time.",
    )


# ---------------------------------------------------------------------------
# The officer's own no-login "my day" portal — everything this officer is
# covering right now, across every hospital, in one place. Unlike the
# per-case discharge link above, this one link is standing (not tied to one
# patient) and issued from the Officers roster on the Admin ops board.
# ---------------------------------------------------------------------------

@router.get("/portal/{token}", response_model=OfficerPortalOut)
def get_officer_portal(token: str, db: Session = Depends(get_db)):
    """Same no-login, token-is-the-auth pattern as every other officer link
    in this file — never reveal *why* a token failed, just 404."""
    agent = db.query(Agent).filter(Agent.portal_token == token).first()
    if not agent or not portal_token_is_live(agent):
        raise HTTPException(status_code=404, detail="This link is invalid or has expired.")

    today = datetime.utcnow().date()
    from sqlalchemy import or_
    from sqlalchemy.orm import joinedload
    from app.models.patient_case import DailyOfficerAssignment

    open_cases = db.query(PatientCase).options(
        joinedload(PatientCase.hospital),
        joinedload(PatientCase.assignments).joinedload(DailyOfficerAssignment.agent),
    ).filter(
        PatientCase.status.in_([PatientCaseStatus.active, PatientCaseStatus.pending_discharge]),
        or_(
            PatientCase.assigned_agent_id == agent.id,
            PatientCase.assignments.any(DailyOfficerAssignment.agent_id == agent.id),
        ),
    ).order_by(PatientCase.admission_date).all()

    cases_out = []
    today_count = 0
    for c in open_cases:
        on_duty = officer_on_duty(c, today)
        covering_today = on_duty.agent_id == agent.id
        if covering_today:
            today_count += 1
        cases_out.append(OfficerPortalCaseOut(
            patient_name=c.patient_name,
            hospital_name=c.hospital.name if c.hospital else None,
            ward_or_room=c.ward_or_room,
            admission_date=c.admission_date,
            status=c.status,
            covering_today=covering_today,
            hospital_discharge_at=c.hospital_discharge_at,
            officer_discharge_at=c.officer_discharge_at,
            # Only surfaced when THIS officer is the case's currently assigned
            # one — a case they used to be on (before a re-assign) shouldn't
            # hand them a working discharge link for it any more.
            discharge_link_token=c.officer_discharge_token if c.assigned_agent_id == agent.id else None,
        ))

    return OfficerPortalOut(full_name=agent.full_name, today_patient_count=today_count, cases=cases_out)
