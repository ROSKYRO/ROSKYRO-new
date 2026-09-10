from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


# ---------- Signup ----------

class MembershipSignupIn(BaseModel):
    plan: str = Field(..., description="care | family | nri")


class MembershipOut(BaseModel):
    id: int
    member_code: str
    plan: str
    status: str
    monthly_price_snapshot: float
    started_at: datetime
    next_billing_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- Family members ----------

class FamilyMemberIn(BaseModel):
    full_name: str
    relation: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    # Intentionally no free-text "notes" field — see model comment. Any
    # health/medical detail goes to the concierge over WhatsApp, not here.


class FamilyMemberOut(FamilyMemberIn):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Care requests (also doubles as Care History) ----------

class CareRequestIn(BaseModel):
    family_member_id: Optional[int] = None
    category: str = "other"
    title: str
    description: Optional[str] = None


class CareRequestOut(BaseModel):
    id: int
    family_member_id: Optional[int] = None
    category: str
    title: str
    description: Optional[str] = None
    status: str
    concierge_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CareRequestStatusIn(BaseModel):
    status: str
    concierge_notes: Optional[str] = None


# ---------- Document vault ----------
# Metadata-only by design — no file_url/notes/description here. See
# CareDocument model docstring: the actual document is shared with the
# concierge over WhatsApp, never uploaded to or described in our DB.

class CareDocumentIn(BaseModel):
    family_member_id: Optional[int] = None
    title: str
    doc_type: str = "other"


class CareDocumentOut(CareDocumentIn):
    id: int
    status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ---------- Transport requests ----------

class TransportRequestIn(BaseModel):
    family_member_id: Optional[int] = None
    pickup_address: str
    drop_address: str
    requested_time: datetime
    is_same_city: bool = True
    notes: Optional[str] = None


class TransportRequestOut(TransportRequestIn):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Billing ----------

class MembershipInvoiceOut(BaseModel):
    id: int
    period_start: datetime
    period_end: datetime
    amount: float
    status: str
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Combined dashboard payload ----------

class MemberDashboardOut(BaseModel):
    membership: MembershipOut
    family_members: List[FamilyMemberOut]
    recent_care_requests: List[CareRequestOut]
    recent_documents: List[CareDocumentOut]
    recent_transport_requests: List[TransportRequestOut]
    latest_invoice: Optional[MembershipInvoiceOut] = None
    max_family_members: int
