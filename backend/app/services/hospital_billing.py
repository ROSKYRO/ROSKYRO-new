"""
Monthly hospital billing for the Hospital Concierge Program — turns
discharged, not-yet-invoiced PatientCase rows into a HospitalInvoice.

The rule, as specified: an invoice only ever includes cases that have
ACTUALLY discharged (status == discharged) by the moment it's generated. A
case still active or pending_discharge is left out completely — its bill
keeps running day by day — and whenever it eventually discharges, it is
swept into whichever invoice is generated after that point (this period's,
if it discharges before the next run, otherwise a later one). Nothing is
ever split across two invoices or double-counted: the moment a case is
included, `PatientCase.invoice_id` is stamped, and every future "what's
still uninvoiced" query excludes it for good.
"""
from datetime import datetime, date as date_cls
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.hospital import Hospital
from app.models.hospital_invoice import HospitalInvoice, HospitalInvoiceStatus
from app.models.patient_case import PatientCase, PatientCaseStatus
from app.services.patient_billing import coverage_days_and_billing


class InvoiceError(ValueError):
    """Routers turn this into a 400 with the message as-is."""


def uninvoiced_discharged_cases(db: Session, hospital_id: int) -> List[PatientCase]:
    """Every discharged case for this hospital that hasn't been swept into an
    invoice yet — deliberately NOT filtered by discharge date falling inside
    any particular period. A case that stayed open for months and only just
    discharged still belongs in the very next invoice run, not silently
    skipped for being 'from an earlier period'."""
    return (
        db.query(PatientCase)
        .filter(
            PatientCase.hospital_id == hospital_id,
            PatientCase.status == PatientCaseStatus.discharged,
            PatientCase.invoice_id.is_(None),
        )
        .order_by(PatientCase.discharged_at)
        .all()
    )


def generate_invoice(
    db: Session,
    hospital: Hospital,
    period_start: date_cls,
    period_end: date_cls,
    generated_by_id: Optional[int],
) -> HospitalInvoice:
    """Create a new invoice out of every currently discharged-and-uninvoiced
    case for this hospital. Raises InvoiceError (→ 400) if there's nothing to
    bill right now — an empty invoice would just be confusing clutter."""
    cases = uninvoiced_discharged_cases(db, hospital.id)
    if not cases:
        raise InvoiceError(
            "No newly discharged, not-yet-invoiced patients for this hospital right now — nothing to invoice. "
            "Cases still active or pending discharge stay off every invoice until they actually discharge."
        )

    total = 0.0
    for case in cases:
        _, amount = coverage_days_and_billing(case)
        total += amount
    total = round(total, 2)

    invoice = HospitalInvoice(
        hospital_id=hospital.id,
        period_start=period_start,
        period_end=period_end,
        case_count=len(cases),
        total_amount=total,
        status=HospitalInvoiceStatus.unpaid,
        generated_by_id=generated_by_id,
    )
    db.add(invoice)
    db.flush()  # get invoice.id before stamping cases

    for case in cases:
        case.invoice_id = invoice.id

    db.commit()
    db.refresh(invoice)
    return invoice


def mark_invoice_paid(
    invoice: HospitalInvoice, admin_id: int, reference: Optional[str], note: Optional[str],
) -> None:
    if invoice.status == HospitalInvoiceStatus.paid:
        raise InvoiceError("This invoice is already marked paid.")
    invoice.status = HospitalInvoiceStatus.paid
    invoice.paid_at = datetime.utcnow()
    invoice.paid_by_id = admin_id
    invoice.payment_reference = reference
    invoice.payment_note = note
