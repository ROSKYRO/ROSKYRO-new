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
    rating_avg = Column(Float, default=5.0)
    total_jobs = Column(Integer, default=0)
    uniform_size = Column(String, nullable=True)

    is_available = Column(Boolean, default=True)
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
