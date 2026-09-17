from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.hospital_invoice import HospitalInvoiceStatus


class GenerateInvoiceIn(BaseModel):
    """Admin generates an invoice for a hospital. Both dates are just a
    descriptive label for the run (defaults to the current calendar month) —
    they do NOT filter which cases get swept in; see
    services/hospital_billing.py for why."""
    period_start: Optional[date] = None
    period_end: Optional[date] = None


class InvoiceCaseOut(BaseModel):
    """One patient case included in an invoice — enough for the hospital to
    recognise and cross-check it, no attendant contact details."""
    case_id: int
    patient_name: str
    admission_date: date
    discharged_at: Optional[datetime] = None
    days_covered: int
    amount: float


class HospitalInvoiceOut(BaseModel):
    id: int
    hospital_id: int
    hospital_name: Optional[str] = None
    period_start: date
    period_end: date
    case_count: int
    total_amount: float
    status: HospitalInvoiceStatus
    generated_at: datetime
    paid_at: Optional[datetime] = None
    payment_reference: Optional[str] = None
    payment_note: Optional[str] = None
    cases: List[InvoiceCaseOut] = []


class MarkInvoicePaidIn(BaseModel):
    payment_reference: Optional[str] = Field(None, max_length=100)
    payment_note: Optional[str] = Field(None, max_length=500)


class PendingBillingOut(BaseModel):
    """Preview of what a hospital's NEXT invoice would look like right now,
    before actually generating one."""
    case_count: int
    total_amount: float
