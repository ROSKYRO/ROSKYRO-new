from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.core.deps import require_hospital_staff
from app.core.security import verify_password, create_access_token
from app.core.limiter import limiter
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.hospital import Hospital
from app.models.booking import Booking, BookingStatus
from app.models.journey import JourneyUpdate, JourneyStage, JOURNEY_STAGE_ORDER
from app.models.review import Review
from app.schemas.auth import LoginIn, TokenOut
from app.schemas.hospital import (
    PublicHospitalOut, JourneyUpdateIn, JourneyUpdateOut, JourneyOut, HospitalDashboardOut,
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


def _to_journey_out(b: Booking) -> JourneyOut:
    return JourneyOut(
        id=b.id,
        booking_code=b.booking_code,
        customer_name=b.customer.full_name if b.customer else "—",
        customer_phone=b.customer.phone if b.customer else "—",
        service_name=b.service.name if b.service else "—",
        hospital_name=b.hospital.name if b.hospital else None,
        status=b.status.value,
        current_stage=b.current_stage,
        scheduled_start=b.scheduled_start,
        agent_name=b.agent.full_name if b.agent else None,
        updates=[
            JourneyUpdateOut(
                id=u.id, stage=u.stage, note=u.note,
                posted_by_name=u.posted_by.full_name if u.posted_by else None,
                created_at=u.created_at,
            )
            for u in b.journey_updates
        ],
    )


def _hospital_bookings_query(db: Session, hospital_id: int):
    return db.query(Booking).filter(Booking.hospital_id == hospital_id)


ACTIVE_STATUSES = [
    BookingStatus.requested, BookingStatus.assigned, BookingStatus.en_route,
    BookingStatus.awaiting_start_pin, BookingStatus.in_progress, BookingStatus.awaiting_end_pin,
]


@router.get("/dashboard", response_model=HospitalDashboardOut)
def dashboard(db: Session = Depends(get_db), staff: User = Depends(require_hospital_staff)):
    hospital = db.query(Hospital).get(staff.hospital_id)
    base = _hospital_bookings_query(db, staff.hospital_id)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    todays_patients = base.filter(Booking.scheduled_start >= today_start).count()
    active_journeys = base.filter(Booking.status.in_(ACTIVE_STATUSES)).count()
    admission_queue = base.filter(Booking.current_stage == JourneyStage.admission).count()
    discharge_queue = base.filter(Booking.current_stage == JourneyStage.discharge).count()

    family_updates_today = (
        db.query(func.count(JourneyUpdate.id))
        .join(Booking, Booking.id == JourneyUpdate.booking_id)
        .filter(Booking.hospital_id == staff.hospital_id, JourneyUpdate.created_at >= today_start)
        .scalar()
    )

    review_stats = (
        db.query(func.avg(Review.rating), func.count(Review.id))
        .join(Booking, Booking.id == Review.booking_id)
        .filter(Booking.hospital_id == staff.hospital_id)
        .first()
    )
    avg_rating, feedback_count = review_stats if review_stats else (None, 0)

    return HospitalDashboardOut(
        hospital_name=hospital.name if hospital else "—",
        todays_patients=todays_patients,
        active_journeys=active_journeys,
        admission_queue=admission_queue,
        discharge_queue=discharge_queue,
        family_updates_today=family_updates_today or 0,
        feedback_avg_rating=round(avg_rating, 2) if avg_rating else None,
        feedback_count=feedback_count or 0,
    )


@router.get("/journeys", response_model=List[JourneyOut])
def list_journeys(
    queue: Optional[str] = None,  # today | active | admission | discharge | all
    db: Session = Depends(get_db),
    staff: User = Depends(require_hospital_staff),
):
    """Powers Today's Patients / Active Journeys / Admission Queue / Discharge Queue tabs."""
    query = _hospital_bookings_query(db, staff.hospital_id).order_by(Booking.scheduled_start.desc())

    if queue == "today":
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Booking.scheduled_start >= today_start)
    elif queue == "active":
        query = query.filter(Booking.status.in_(ACTIVE_STATUSES))
    elif queue == "admission":
        query = query.filter(Booking.current_stage == JourneyStage.admission)
    elif queue == "discharge":
        query = query.filter(Booking.current_stage == JourneyStage.discharge)

    bookings = query.limit(300).all()
    return [_to_journey_out(b) for b in bookings]


@router.get("/journeys/{booking_id}", response_model=JourneyOut)
def get_journey(booking_id: int, db: Session = Depends(get_db), staff: User = Depends(require_hospital_staff)):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.hospital_id == staff.hospital_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Journey not found")
    return _to_journey_out(booking)


@router.post("/journeys/{booking_id}/stage", response_model=JourneyOut)
def post_stage_update(
    booking_id: int,
    payload: JourneyUpdateIn,
    db: Session = Depends(get_db),
    staff: User = Depends(require_hospital_staff),
):
    """Hospital Console posts a journey-stage update — this is the 'Family Update'
    the family sees live on their WhatsApp / Dashboard timeline."""
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.hospital_id == staff.hospital_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Journey not found")

    update = JourneyUpdate(booking_id=booking.id, stage=payload.stage, note=payload.note, posted_by_id=staff.id)
    db.add(update)
    booking.current_stage = payload.stage
    db.commit()
    db.refresh(booking)
    return _to_journey_out(booking)


@router.get("/feedback")
def hospital_feedback(db: Session = Depends(get_db), staff: User = Depends(require_hospital_staff)):
    """Patient Feedback tab — reviews left for journeys at this hospital."""
    reviews = (
        db.query(Review)
        .join(Booking, Booking.id == Review.booking_id)
        .filter(Booking.hospital_id == staff.hospital_id)
        .order_by(Review.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        {
            "id": r.id,
            "booking_code": r.booking.booking_code if r.booking else None,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
        }
        for r in reviews
    ]


@router.get("/reports")
def hospital_reports(db: Session = Depends(get_db), staff: User = Depends(require_hospital_staff)):
    """Reports tab — simple rollups a hospital admin actually needs at a glance."""
    base = _hospital_bookings_query(db, staff.hospital_id)
    total_journeys = base.count()
    completed = base.filter(Booking.status == BookingStatus.completed).count()
    cancelled = base.filter(Booking.status == BookingStatus.cancelled).count()
    sos_count = base.filter(Booking.sos_triggered == True).count()  # noqa: E712

    by_stage = {
        stage.value: base.filter(Booking.current_stage == stage).count()
        for stage in JOURNEY_STAGE_ORDER
    }

    return {
        "total_journeys": total_journeys,
        "completed": completed,
        "cancelled": cancelled,
        "sos_count": sos_count,
        "by_stage": by_stage,
    }
