import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Date, Enum, Float, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class HospitalInvoiceStatus(str, enum.Enum):
    unpaid = "unpaid"
    paid = "paid"


class HospitalInvoice(Base):
    """
    One billing cycle (normally a calendar month) of what a partner hospital
    owes ROSKYRO for the Hospital Concierge Program.

    Deliberately only ever sweeps up patient cases that have ACTUALLY
    discharged by the moment this invoice is generated (see
    services/hospital_billing.py). A case still active or pending_discharge
    is left out completely — its bill keeps running, and whenever it
    eventually discharges it lands on whichever invoice is generated after
    that point (this period's, or a later one) — never split, never
    double-counted. The moment a case is swept into an invoice,
    `PatientCase.invoice_id` is stamped so it can never be picked up again.

    MVP scope: no payment gateway wired up yet — same pattern ROSKYRO already
    uses for Membership invoices and Relationship Officer bookings, an admin
    marks this paid manually (e.g. after a bank transfer / cheque is
    confirmed) and records a reference for the audit trail.
    """
    __tablename__ = "hospital_invoices"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)

    # Descriptive period label only (e.g. the calendar month this run covers)
    # — NOT used to filter which cases land in the invoice. See
    # services/hospital_billing.uninvoiced_discharged_cases for why: a case
    # that discharges late still belongs in the next run, whatever period
    # label that run is given.
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)

    case_count = Column(Integer, nullable=False, default=0)
    total_amount = Column(Float, nullable=False, default=0.0)

    status = Column(Enum(HospitalInvoiceStatus), default=HospitalInvoiceStatus.unpaid, nullable=False)

    generated_at = Column(DateTime, default=datetime.utcnow)
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    paid_at = Column(DateTime, nullable=True)
    paid_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    payment_reference = Column(String, nullable=True)  # UTR / cheque no. / UPI ref — whatever the hospital paid with
    payment_note = Column(Text, nullable=True)

    hospital = relationship("Hospital", back_populates="invoices")
    generated_by = relationship("User", foreign_keys=[generated_by_id])
    paid_by = relationship("User", foreign_keys=[paid_by_id])
    cases = relationship("PatientCase", back_populates="invoice")
