from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.membership import Membership, MembershipStatus
from app.models.priority_access import (
    PartnerApplication, ApplicationStatus,
    Partner, PartnerStatus, PriorityAccessAvailability,
    AppointmentRequest, AppointmentRequestStatus,
)
from app.schemas.priority_access import (
    PartnerApplicationIn, PartnerApplicationOut,
    PartnerSummaryOut, PartnerDetailOut,
    AppointmentRequestIn, AppointmentRequestOut,
)

router = APIRouter(prefix="/priority-access", tags=["priority-access"])


# ---------- Become a Partner (public application) ----------

@router.post("/apply", response_model=PartnerApplicationOut)
def apply(payload: PartnerApplicationIn, db: Session = Depends(get_db)):
    if payload.partner_type not in ("doctor", "hospital"):
        raise HTTPException(status_code=400, detail="partner_type must be 'doctor' or 'hospital'.")

    application = PartnerApplication(status=ApplicationStatus.pending, **payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


# ---------- Public directory / search ----------

@router.get("/partners", response_model=List[PartnerSummaryOut])
def search_partners(
    city: Optional[str] = None,
    specialty: Optional[str] = None,
    partner_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Partner).filter(Partner.partner_status != PartnerStatus.inactive)

    if city:
        q = q.filter(Partner.city.ilike(f"%{city}%"))
    if partner_type:
        q = q.filter(Partner.partner_type == partner_type)
    if specialty:
        like = f"%{specialty}%"
        q = q.filter(or_(Partner.specialty.ilike(like), Partner.departments.ilike(like)))

    return q.order_by(Partner.name.asc()).all()


@router.get("/partners/{partner_id}", response_model=PartnerDetailOut)
def get_partner(partner_id: int, db: Session = Depends(get_db)):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner or partner.partner_status == PartnerStatus.inactive:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner


# ---------- Request Priority Appointment (ROSKYRO Concierge members only) ----------

@router.post("/appointment-requests", response_model=AppointmentRequestOut)
def request_appointment(payload: AppointmentRequestIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Priority Appointment booking is a ROSKYRO Concierge membership benefit —
    # gate it here (not just in the frontend) so the rule holds regardless of
    # which client calls this endpoint.
    membership = db.query(Membership).filter(Membership.user_id == user.id).first()
    if not membership or membership.status != MembershipStatus.active:
        raise HTTPException(
            status_code=403,
            detail="Priority Appointment booking is available exclusively to active ROSKYRO Concierge members. Please subscribe to a membership plan to continue.",
        )

    partner = db.query(Partner).filter(Partner.id == payload.partner_id).first()
    if not partner or partner.partner_status == PartnerStatus.inactive:
        raise HTTPException(status_code=404, detail="Partner not found")
    if partner.priority_access_status == PriorityAccessAvailability.not_available:
        raise HTTPException(status_code=400, detail="This partner isn't accepting priority appointment requests right now.")

    req = AppointmentRequest(
        user_id=user.id,
        status=AppointmentRequestStatus.requested,
        **payload.model_dump(),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/appointment-requests/mine", response_model=List[AppointmentRequestOut])
def my_appointment_requests(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(AppointmentRequest).filter(AppointmentRequest.user_id == user.id)
        .order_by(AppointmentRequest.created_at.desc()).all()
    )
