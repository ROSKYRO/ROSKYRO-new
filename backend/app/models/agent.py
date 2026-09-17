import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class AgentStatus(str, enum.Enum):
    applied = "applied"                # resume/interest submitted
    screening = "screening"            # resume screening
    interview = "interview"            # personal interview stage
    background_check = "background_check"  # ID + reference + police verification
    training = "training"              # onboarding & training
    active = "active"                  # fully verified, can accept bookings
    suspended = "suspended"
    rejected = "rejected"


class AgentRank(str, enum.Enum):
    trainee = "trainee"
    partner = "partner"
    senior_partner = "senior_partner"
    team_lead = "team_lead"


class Agent(Base):
    """
    A verified field care-partner (equivalent to the source site's 'Bee').
    Carries the full 6-step verification trail as discrete boolean checkpoints
    so admins can see exactly where each applicant is stuck.
    """
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)

    status = Column(Enum(AgentStatus), default=AgentStatus.applied, nullable=False)
    rank = Column(Enum(AgentRank), default=AgentRank.trainee, nullable=False)

    # --- 6-step verification checklist ---
    id_verified = Column(Boolean, default=False)          # government ID confirmed
    police_verified = Column(Boolean, default=False)      # background/police check
    references_checked = Column(Boolean, default=False)   # 2 references called
    interview_passed = Column(Boolean, default=False)     # character/temperament interview
    training_completed = Column(Boolean, default=False)   # care/conduct/boundaries training
    id_card_issued = Column(Boolean, default=False)       # physical photo ID issued

    monthly_base_pay = Column(Float, default=6000.0)
    hourly_rate = Column(Float, default=100.0)
    # What ROSKYRO pays THIS officer per day of Hospital Concierge Program
    # coverage — deliberately separate from hourly_rate, which prices the
    # on-demand booking marketplace (per-hour work with a clock-in/clock-out
    # trail). Hospital coverage is billed to the hospital per calendar day
    # (see PatientCase.daily_rate / coverage_days_and_billing), with no hourly
    # clock for the officer's side, so a day-rate is the honest unit here —
    # NULL until ROSKYRO sets one, so payout estimates don't silently assume
    # a number nobody agreed to.
    hospital_daily_rate = Column(Float, nullable=True)
    rating_avg = Column(Float, default=5.0)
    total_jobs = Column(Integer, default=0)
    uniform_size = Column(String, nullable=True)

    is_available = Column(Boolean, default=True)

    # --- The officer's own no-login "my day" link ---
    # Mirrors PatientCase.officer_discharge_token (long random link stands in
    # for a login this build doesn't have), but scoped to the officer rather
    # than one case: it shows everything this officer currently covers across
    # every hospital, not just one patient's discharge. Rotating it (see
    # app/services/officer_roster.issue_portal_token) mints a fresh token and
    # kills the old one, same as the discharge link.
    portal_token = Column(String, unique=True, nullable=True, index=True)
    portal_token_expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="agent")
    city = relationship("City", back_populates="agents")

    @property
    def verification_progress(self) -> int:
        """How many of the 6 checks are complete (0-6)."""
        checks = [
            self.id_verified, self.police_verified, self.references_checked,
            self.interview_passed, self.training_completed, self.id_card_issued,
        ]
        return sum(1 for c in checks if c)

    @property
    def is_fully_verified(self) -> bool:
        return self.verification_progress == 6
