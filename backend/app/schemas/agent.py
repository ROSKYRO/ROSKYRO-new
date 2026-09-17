from pydantic import BaseModel
from typing import Optional

from app.models.agent import AgentStatus, AgentRank


class AgentApplyIn(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    city_id: Optional[int] = None


class AgentOut(BaseModel):
    id: int
    full_name: str
    phone: str
    status: AgentStatus
    rank: AgentRank
    verification_progress: int
    is_fully_verified: bool
    hourly_rate: float
    monthly_base_pay: float
    rating_avg: float
    total_jobs: int
    is_available: bool

    class Config:
        from_attributes = True


class AgentVerificationUpdateIn(BaseModel):
    id_verified: Optional[bool] = None
    police_verified: Optional[bool] = None
    references_checked: Optional[bool] = None
    interview_passed: Optional[bool] = None
    training_completed: Optional[bool] = None
    id_card_issued: Optional[bool] = None
    status: Optional[AgentStatus] = None


class PartnerCreateIn(BaseModel):
    """Admin adding a partner (care-agent) directly, bypassing the public
    apply flow — e.g. onboarding someone who was recruited offline."""
    full_name: str
    phone: str
    email: Optional[str] = None
    city_id: Optional[int] = None
    hourly_rate: float = 100.0
    monthly_base_pay: float = 6000.0
    status: AgentStatus = AgentStatus.applied


class PartnerStatusIn(BaseModel):
    """Quick active/inactive toggle, separate from the full verification
    checklist. 'active' = accepting bookings, 'suspended' = inactive."""
    status: AgentStatus
