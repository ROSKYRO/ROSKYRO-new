import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class JourneyStage(str, enum.Enum):
    """
    The hospital-floor journey a patient moves through, per the FINAL ROSKYRO
    ARCHITECTURE (Concierge Booking -> Journey Engine -> Assignment Engine ->
    ROSKYRO Assist -> Patient Journey). This runs alongside — not instead of —
    the existing Booking.status billing/PIN state machine: Booking.status
    tracks *billing*, JourneyStage tracks *where the patient physically is*.
    Hospital Console staff and ROSKYRO Assist post updates here; families see
    them live as "Family Updates" (WhatsApp / Dashboard).
    """
    assist_assigned = "assist_assigned"
    on_the_way = "on_the_way"
    arrived = "arrived"            # Meet & Greet / Hospital Entry / Navigation / Wheelchair
    registration = "registration"
    consultation = "consultation"  # OPD / Doctor
    diagnostics = "diagnostics"
    admission = "admission"
    discharge = "discharge"        # Documents / Pharmacy / Billing / Transport
    home = "home"                  # Home Return
    follow_up = "follow_up"        # Follow-up Care: Diagnostics / Physio / Transport / Support


# Canonical order, used by the frontend timeline and to validate forward progress.
JOURNEY_STAGE_ORDER = [
    JourneyStage.assist_assigned,
    JourneyStage.on_the_way,
    JourneyStage.arrived,
    JourneyStage.registration,
    JourneyStage.consultation,
    JourneyStage.diagnostics,
    JourneyStage.admission,
    JourneyStage.discharge,
    JourneyStage.home,
    JourneyStage.follow_up,
]


class JourneyUpdate(Base):
    """One timestamped entry in a booking's journey timeline (a 'Family Update')."""
    __tablename__ = "journey_updates"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    stage = Column(Enum(JourneyStage), nullable=False)
    note = Column(Text, nullable=True)
    posted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # hospital staff / admin / assist
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="journey_updates")
    posted_by = relationship("User")
