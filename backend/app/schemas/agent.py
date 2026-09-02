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
