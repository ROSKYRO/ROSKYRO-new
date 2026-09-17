import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, DateTime, Date, Enum, Float, ForeignKey, Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.session import Base


class PatientCaseStatus(str, enum.Enum):
    active = "active"          # in hospital, ROSKYRO covering with a daily Relationship Officer
    pending_discharge = "pending_discharge"  # one side (hospital or officer) confirmed discharge, waiting on the other
    discharged = "discharged"  # BOTH hospital and the assigned officer confirmed — case closed, billing stops
    cancelled = "cancelled"    # opened by mistake / hospital cancelled before RO coverage started


class DailyAssignmentStatus(str, enum.Enum):
    assigned = "assigned"    # Relationship Officer assigned by ROSKYRO for this date
    completed = "completed"  # the day's coverage happened
    no_show = "no_show"      # officer didn't make it — needs a re-assign


class PatientCase(Base):
    """
    The whole 'Patient Journey Engine' is deliberately replaced by this one
    simple record. The hospital does NOT track a multi-stage journey anymore —
    it just opens a case with a few short patient details and hands the
    patient/attendant fully over to ROSKYRO. From here, ROSKYRO's Relationship
    Officer takes care of everything the patient/attendant needs, one
    dedicated officer assigned per day (see DailyOfficerAssignment below).

    Billing: the hospital charges the patient its own per-day concierge fee
    (its business, not tracked here) and pays ROSKYRO daily_rate for every day
    an officer is assigned — daily_rate is snapshotted from the hospital's
    per_patient_daily_rate at the moment the case is opened, so a later rate
    change never rewrites an open case's billing mid-stay.
    """
    __tablename__ = "patient_cases"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # hospital staff who opened it

    # --- Short patient details only (exactly what the hospital needs to hand off) ---
    patient_name = Column(String, nullable=False)
    patient_age = Column(Integer, nullable=True)
    attendant_name = Column(String, nullable=True)
    attendant_phone = Column(String, nullable=False)
    ward_or_room = Column(String, nullable=True)
    short_note = Column(Text, nullable=True)  # e.g. "cardiac, post-op, needs help with mobility"

    admission_date = Column(Date, nullable=False, default=lambda: datetime.utcnow().date())
    expected_discharge_date = Column(Date, nullable=True)

    status = Column(Enum(PatientCaseStatus), default=PatientCaseStatus.active, nullable=False)
    daily_rate = Column(Float, nullable=False)  # snapshot of hospital.per_patient_daily_rate at intake

    # --- The one Relationship Officer assigned to this case at admission ---
    # ROSKYRO Admin picks this officer once, from the dropdown, when opening
    # coverage (the From–To range on /assign just seeds that first stretch of
    # DailyOfficerAssignment rows for the ops board / history view below).
    # This is the officer who stays on the hook for the case and who — along
    # with the hospital — must confirm the actual discharge date & time.
    # Coverage, and billing, keep running day by day for as long as the case
    # stays active/pending_discharge, with no dependency on an assignment
    # "end date" — only a real discharge (both sides confirmed) stops it.
    assigned_agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)

    # --- Dual discharge confirmation ---
    # Both the hospital and the assigned Relationship Officer must separately
    # confirm the discharge date & time before the case is actually closed.
    # `discharged_at` (below) is only ever set once BOTH of these are —
    # it's the source of truth for when billing/coverage actually stopped.
    # NOTE: when NO officer was ever assigned to this case (assigned_agent_id
    # is NULL, so no officer link was ever issued and nobody exists to confirm
    # the officer side), the hospital's confirmation alone closes the case —
    # otherwise it would sit in pending_discharge forever, still billing, with
    # no possible way out. See services/patient_billing.py.
    hospital_discharge_at = Column(DateTime, nullable=True)   # hospital's confirmed discharge date/time
    officer_discharge_at = Column(DateTime, nullable=True)    # officer's confirmed discharge date/time
    # Which Hospital Console user actually clicked confirm — same accountability
    # pattern as DailyOfficerAssignment.assigned_by_id ("who made this call").
    hospital_discharge_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # Long random no-login link (mirrors Booking.officer_token) so the
    # assigned officer — who has no Console/User login in this build — can
    # open a one-purpose page and confirm the discharge date/time themselves.
    officer_discharge_token = Column(String, unique=True, nullable=True, index=True)
    # The link is not valid forever: it stops working after this moment, and
    # Admin can regenerate it (which mints a new token and instantly kills the
    # old one) if it ever ends up in the wrong hands or the officer changes.
    # NULL on legacy rows issued before expiry existed — treated as still
    # valid, but flagged on the ops board so they can be rotated.
    officer_discharge_token_expires_at = Column(DateTime, nullable=True)

    # --- Admin override (the escape hatch when one side never responds) ---
    # If the officer loses their phone, quits, or simply never confirms, an
    # admin can force the case closed. We record who did it and why, so a
    # force-closed case is never mistaken for a clean dual confirmation.
    discharge_force_closed_at = Column(DateTime, nullable=True)
    discharge_force_closed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    discharge_force_close_reason = Column(Text, nullable=True)

    # --- Monthly hospital billing ---
    # NULL until this (discharged) case has been swept into a HospitalInvoice
    # — see services/hospital_billing.py. A case still active/pending_discharge
    # always has this NULL; it only ever gets stamped once, at the moment an
    # invoice run picks it up, so it can never be billed twice.
    invoice_id = Column(Integer, ForeignKey("hospital_invoices.id"), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    discharged_at = Column(DateTime, nullable=True)  # set only once both required sides above have confirmed

    hospital = relationship("Hospital", back_populates="patients")
    invoice = relationship("HospitalInvoice", back_populates="cases")
    created_by = relationship("User", foreign_keys=[created_by_id])
    hospital_discharge_by = relationship("User", foreign_keys=[hospital_discharge_by_id])
    discharge_force_closed_by = relationship("User", foreign_keys=[discharge_force_closed_by_id])
    assigned_agent = relationship("Agent", foreign_keys=[assigned_agent_id])
    assignments = relationship(
        "DailyOfficerAssignment", back_populates="patient_case",
        cascade="all, delete-orphan", order_by="DailyOfficerAssignment.date",
    )


class DailyOfficerAssignment(Base):
    """One dedicated Relationship Officer, for one patient, for one calendar
    day. ROSKYRO assigns these (from the Admin console); the hospital just
    sees who's covering their patient today. One row per (patient_case, date)
    — re-assigning a day updates the existing row rather than stacking a new
    one, so 'who's on this patient today' is always a single, unambiguous
    answer for both sides."""
    __tablename__ = "daily_officer_assignments"
    __table_args__ = (UniqueConstraint("patient_case_id", "date", name="uq_patient_day"),)

    id = Column(Integer, primary_key=True, index=True)
    patient_case_id = Column(Integer, ForeignKey("patient_cases.id"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)

    status = Column(Enum(DailyAssignmentStatus), default=DailyAssignmentStatus.assigned, nullable=False)
    note = Column(Text, nullable=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # ROSKYRO admin who made the call

    created_at = Column(DateTime, default=datetime.utcnow)

    patient_case = relationship("PatientCase", back_populates="assignments")
    agent = relationship("Agent")
    assigned_by = relationship("User")
