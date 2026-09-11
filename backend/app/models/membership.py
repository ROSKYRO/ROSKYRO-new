import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Float, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class MembershipPlan(str, enum.Enum):
    care = "care"        # Individual, Rs 1,999/month
    family = "family"    # Up to 4 members, Rs 4,999/month
    nri = "nri"          # NRI Care, Rs 7,999/month


class MembershipStatus(str, enum.Enum):
    pending = "pending"    # signed up, first invoice not yet marked paid
    active = "active"
    paused = "paused"
    cancelled = "cancelled"
    expired = "expired"    # billing lapsed and grace period passed


PLAN_MONTHLY_PRICE = {
    MembershipPlan.care: 1999.0,
    MembershipPlan.family: 4999.0,
    MembershipPlan.nri: 7999.0,
}

PLAN_MAX_FAMILY_MEMBERS = {
    MembershipPlan.care: 1,
    MembershipPlan.family: 4,
    MembershipPlan.nri: 4,
}

PLAN_FREE_ASSIST_VISITS = {
    MembershipPlan.care: 2,
    MembershipPlan.family: 5,
    MembershipPlan.nri: 8,
}


class Membership(Base):
    """A recurring ROSKYRO Concierge membership — separate from one-off
    ROSKYRO Relationship Officer bookings. One User has at most one Membership."""
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    member_code = Column(String, unique=True, index=True, nullable=False)  # e.g. RM-10234

    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    plan = Column(Enum(MembershipPlan), nullable=False)
    status = Column(Enum(MembershipStatus), default=MembershipStatus.pending, nullable=False)

    monthly_price_snapshot = Column(Float, nullable=False)  # locked in at signup, unaffected by future price changes
    started_at = Column(DateTime, default=datetime.utcnow)
    next_billing_date = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    notes = Column(Text, nullable=True)  # internal concierge notes
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    family_members = relationship("FamilyMember", back_populates="membership", cascade="all, delete-orphan")
    care_requests = relationship("CareRequest", back_populates="membership", cascade="all, delete-orphan")
    documents = relationship("CareDocument", back_populates="membership", cascade="all, delete-orphan")
    transport_requests = relationship("TransportRequest", back_populates="membership", cascade="all, delete-orphan")
    invoices = relationship("MembershipInvoice", back_populates="membership", cascade="all, delete-orphan")


class FamilyMember(Base):
    """A dependent covered under a Family/NRI membership (or the member's
    own profile entry, for symmetry with care requests/documents)."""
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False)

    full_name = Column(String, nullable=False)
    relation = Column(String, nullable=True)   # e.g. "Self", "Mother", "Father", "Spouse", "Child"
    age = Column(Integer, nullable=True)
    phone = Column(String, nullable=True)
    # No free-text "notes" field here on purpose — this used to allow members to
    # paste allergies/conditions, which we do not want landing in the DB. Any
    # health/medical detail a member needs to share goes to the concierge over
    # WhatsApp, not into a stored field. Do not re-add a free-text health field
    # here without also wiring the retention/auto-delete job (see CareDocument).

    created_at = Column(DateTime, default=datetime.utcnow)

    membership = relationship("Membership", back_populates="family_members")


class CareRequestCategory(str, enum.Enum):
    appointment = "appointment"
    hospital = "hospital"
    diagnostic = "diagnostic"
    specialist = "specialist"
    follow_up = "follow_up"
    other = "other"


class CareRequestStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    cancelled = "cancelled"


class CareRequest(Base):
    """One coordination ticket raised by a member — this doubles as the
    member's Care History once resolved (nothing is deleted on close)."""
    __tablename__ = "care_requests"

    id = Column(Integer, primary_key=True, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)  # null = the member themselves

    category = Column(Enum(CareRequestCategory), default=CareRequestCategory.other, nullable=False)
    title = Column(String, nullable=False)
    # Free text, member-entered. Frontend placeholder steers members toward
    # "reason for the visit" (e.g. "follow-up visit") rather than diagnosis or
    # report detail — but this field is not validated/sanitized server-side,
    # so treat it as potentially containing health info in practice.
    description = Column(Text, nullable=True)
    status = Column(Enum(CareRequestStatus), default=CareRequestStatus.open, nullable=False)

    # Internal/admin-visible updates shared back to the member. Staff SOP:
    # keep these to coordination status (fee, slot, confirmation) — do not
    # copy diagnosis/report detail in here.
    concierge_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    membership = relationship("Membership", back_populates="care_requests")
    family_member = relationship("FamilyMember")


class CareDocumentStatus(str, enum.Enum):
    pending = "pending"                    # ticket raised, member still needs to send the file on WhatsApp
    shared_with_concierge = "shared_with_concierge"  # concierge has received/confirmed the file over WhatsApp
    resolved = "resolved"


class CareDocument(Base):
    """Document vault entry — deliberately metadata-only.

    Policy: prescriptions/reports/discharge summaries are health data. We do
    NOT store the file, a link to it, or any free-text description of its
    contents in this table (or anywhere else in the DB) — only a title,
    doc_type, and a coordination status. The actual document is shared
    directly between the member and the concierge over WhatsApp; this row is
    just a tracker so both sides know a document is expected/received.

    Do not add file_url/notes/description columns back here without also
    building the retention/auto-delete job — see membership dev notes.
    """
    __tablename__ = "care_documents"

    id = Column(Integer, primary_key=True, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)

    title = Column(String, nullable=False)
    doc_type = Column(String, default="other")  # prescription / report / discharge_summary / insurance / other
    status = Column(Enum(CareDocumentStatus), default=CareDocumentStatus.pending, nullable=False)

    uploaded_at = Column(DateTime, default=datetime.utcnow)

    membership = relationship("Membership", back_populates="documents")
    family_member = relationship("FamilyMember")


class TransportStatus(str, enum.Enum):
    requested = "requested"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class TransportRequest(Base):
    """A pickup/drop coordination request tied to a membership.

    Policy (per business rule): same-city trips are coordinated as part of
    the membership at no extra charge. Outstation trips are still fully
    coordinated by the concierge, but the member arranges/pays for their own
    travel — ROSKYRO does not bill anything beyond the membership price for
    this. `is_same_city` drives which of those two notes is shown to the
    member; it never triggers a separate ROSKYRO charge.
    """
    __tablename__ = "transport_requests"

    id = Column(Integer, primary_key=True, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)

    pickup_address = Column(Text, nullable=False)
    drop_address = Column(Text, nullable=False)
    requested_time = Column(DateTime, nullable=False)
    is_same_city = Column(Boolean, default=True)

    status = Column(Enum(TransportStatus), default=TransportStatus.requested, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    membership = relationship("Membership", back_populates="transport_requests")
    family_member = relationship("FamilyMember")


class InvoiceStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    waived = "waived"


class MembershipInvoice(Base):
    """One billing cycle (usually monthly) for a membership. MVP scope: no
    payment gateway is wired up yet — invoices are marked paid manually by
    an admin (e.g. after a UPI payment confirmed on WhatsApp), same pattern
    ROSKYRO already uses for Relationship Officer bookings."""
    __tablename__ = "membership_invoices"

    id = Column(Integer, primary_key=True, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False)

    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.pending, nullable=False)

    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    membership = relationship("Membership", back_populates="invoices")
