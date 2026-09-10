import random
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.membership import (
    Membership, MembershipPlan, MembershipStatus, PLAN_MONTHLY_PRICE, PLAN_MAX_FAMILY_MEMBERS,
    FamilyMember, CareRequest, CareRequestCategory, CareRequestStatus,
    CareDocument, CareDocumentStatus, TransportRequest, TransportStatus,
    MembershipInvoice, InvoiceStatus,
)
from app.schemas.membership import (
    MembershipSignupIn, MembershipOut,
    FamilyMemberIn, FamilyMemberOut,
    CareRequestIn, CareRequestOut, CareRequestStatusIn,
    CareDocumentIn, CareDocumentOut,
    TransportRequestIn, TransportRequestOut,
    MembershipInvoiceOut, MemberDashboardOut,
)

router = APIRouter(prefix="/membership", tags=["membership"])


def _get_membership(db: Session, user: User) -> Membership:
    membership = db.query(Membership).filter(Membership.user_id == user.id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="No ROSKYRO Concierge membership found for this account.")
    return membership


def _generate_member_code() -> str:
    return f"RM-{random.randint(10000, 99999)}"


# ---------- Signup ----------

@router.post("/signup", response_model=MembershipOut)
def signup(payload: MembershipSignupIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if db.query(Membership).filter(Membership.user_id == user.id).first():
        raise HTTPException(status_code=400, detail="This account already has a ROSKYRO Concierge membership.")

    try:
        plan = MembershipPlan(payload.plan)
    except ValueError:
        raise HTTPException(status_code=400, detail="Unknown plan. Choose care, family or nri.")

    price = PLAN_MONTHLY_PRICE[plan]
    now = datetime.utcnow()

    membership = Membership(
        member_code=_generate_member_code(),
        user_id=user.id,
        plan=plan,
        status=MembershipStatus.pending,  # flips to active once the first invoice is marked paid by admin
        monthly_price_snapshot=price,
        started_at=now,
        next_billing_date=now + timedelta(days=30),
    )
    db.add(membership)
    db.flush()  # get membership.id before creating the invoice

    invoice = MembershipInvoice(
        membership_id=membership.id,
        period_start=now,
        period_end=now + timedelta(days=30),
        amount=price,
        status=InvoiceStatus.pending,
    )
    db.add(invoice)
    db.commit()
    db.refresh(membership)
    return membership


@router.get("/me", response_model=MemberDashboardOut)
def my_dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)

    family_members = (
        db.query(FamilyMember).filter(FamilyMember.membership_id == membership.id)
        .order_by(FamilyMember.created_at.asc()).all()
    )
    recent_requests = (
        db.query(CareRequest).filter(CareRequest.membership_id == membership.id)
        .order_by(CareRequest.created_at.desc()).limit(20).all()
    )
    recent_docs = (
        db.query(CareDocument).filter(CareDocument.membership_id == membership.id)
        .order_by(CareDocument.uploaded_at.desc()).limit(20).all()
    )
    recent_transport = (
        db.query(TransportRequest).filter(TransportRequest.membership_id == membership.id)
        .order_by(TransportRequest.created_at.desc()).limit(20).all()
    )
    latest_invoice = (
        db.query(MembershipInvoice).filter(MembershipInvoice.membership_id == membership.id)
        .order_by(MembershipInvoice.created_at.desc()).first()
    )

    return MemberDashboardOut(
        membership=membership,
        family_members=family_members,
        recent_care_requests=recent_requests,
        recent_documents=recent_docs,
        recent_transport_requests=recent_transport,
        latest_invoice=latest_invoice,
        max_family_members=PLAN_MAX_FAMILY_MEMBERS[membership.plan],
    )


@router.post("/cancel", response_model=MembershipOut)
def cancel_membership(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    membership.status = MembershipStatus.cancelled
    membership.cancelled_at = datetime.utcnow()
    db.commit()
    db.refresh(membership)
    return membership


# ---------- Family members ----------

@router.get("/family", response_model=List[FamilyMemberOut])
def list_family(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    return db.query(FamilyMember).filter(FamilyMember.membership_id == membership.id).order_by(FamilyMember.created_at.asc()).all()


@router.post("/family", response_model=FamilyMemberOut)
def add_family_member(payload: FamilyMemberIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    cap = PLAN_MAX_FAMILY_MEMBERS[membership.plan]
    existing = db.query(FamilyMember).filter(FamilyMember.membership_id == membership.id).count()
    if existing >= cap:
        raise HTTPException(status_code=400, detail=f"Your {membership.plan.value} plan covers up to {cap} member(s). Upgrade to add more.")

    member = FamilyMember(membership_id=membership.id, **payload.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/family/{member_id}")
def remove_family_member(member_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    member = db.query(FamilyMember).filter(FamilyMember.id == member_id, FamilyMember.membership_id == membership.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found.")
    db.delete(member)
    db.commit()
    return {"ok": True}


# ---------- Care requests / care history ----------

@router.get("/care-requests", response_model=List[CareRequestOut])
def list_care_requests(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    return (
        db.query(CareRequest).filter(CareRequest.membership_id == membership.id)
        .order_by(CareRequest.created_at.desc()).all()
    )


@router.post("/care-requests", response_model=CareRequestOut)
def create_care_request(payload: CareRequestIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    try:
        category = CareRequestCategory(payload.category)
    except ValueError:
        category = CareRequestCategory.other

    req = CareRequest(
        membership_id=membership.id,
        family_member_id=payload.family_member_id,
        category=category,
        title=payload.title,
        description=payload.description,
        status=CareRequestStatus.open,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.post("/care-requests/{request_id}/cancel", response_model=CareRequestOut)
def cancel_care_request(request_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    req = db.query(CareRequest).filter(CareRequest.id == request_id, CareRequest.membership_id == membership.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Care request not found.")
    req.status = CareRequestStatus.cancelled
    db.commit()
    db.refresh(req)
    return req


# ---------- Document vault ----------

@router.get("/documents", response_model=List[CareDocumentOut])
def list_documents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    return (
        db.query(CareDocument).filter(CareDocument.membership_id == membership.id)
        .order_by(CareDocument.uploaded_at.desc()).all()
    )


@router.post("/documents", response_model=CareDocumentOut)
def add_document(payload: CareDocumentIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Raises a document-vault ticket. Intentionally metadata-only — no file
    or file content is accepted/stored here. The member shares the actual
    document with their concierge directly on WhatsApp; this just tracks
    that a document is expected."""
    membership = _get_membership(db, user)
    doc = CareDocument(
        membership_id=membership.id,
        status=CareDocumentStatus.pending,
        **payload.model_dump(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    doc = db.query(CareDocument).filter(CareDocument.id == doc_id, CareDocument.membership_id == membership.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    db.delete(doc)
    db.commit()
    return {"ok": True}


# ---------- Transport requests ----------

@router.get("/transport-requests", response_model=List[TransportRequestOut])
def list_transport(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    return (
        db.query(TransportRequest).filter(TransportRequest.membership_id == membership.id)
        .order_by(TransportRequest.created_at.desc()).all()
    )


@router.post("/transport-requests", response_model=TransportRequestOut)
def create_transport_request(payload: TransportRequestIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    req = TransportRequest(
        membership_id=membership.id,
        status=TransportStatus.requested,
        **payload.model_dump(),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


# ---------- Billing ----------

@router.get("/billing", response_model=List[MembershipInvoiceOut])
def list_invoices(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    membership = _get_membership(db, user)
    return (
        db.query(MembershipInvoice).filter(MembershipInvoice.membership_id == membership.id)
        .order_by(MembershipInvoice.created_at.desc()).all()
    )
