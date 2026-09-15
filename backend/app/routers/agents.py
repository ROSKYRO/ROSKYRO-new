from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.agent import Agent, AgentStatus
from app.schemas.agent import AgentApplyIn, AgentOut, AgentVerificationUpdateIn

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/apply", response_model=AgentOut)
def apply_as_agent(payload: AgentApplyIn, db: Session = Depends(get_db)):
    if db.query(Agent).filter(Agent.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="An application with this phone number already exists")
    agent = Agent(
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        city_id=payload.city_id,
        status=AgentStatus.applied,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("", response_model=List[AgentOut])
def list_agents(
    status: Optional[AgentStatus] = None,
    city_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(Agent)
    if status:
        q = q.filter(Agent.status == status)
    if city_id:
        q = q.filter(Agent.city_id == city_id)
    return q.order_by(Agent.created_at.desc()).all()


@router.get("/available", response_model=List[AgentOut])
def list_available_agents(city_id: Optional[int] = None, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Fully-verified, available agents an admin can assign to a booking."""
    q = db.query(Agent).filter(Agent.status == AgentStatus.active, Agent.is_available == True)  # noqa: E712
    if city_id:
        q = q.filter(Agent.city_id == city_id)
    return q.all()


@router.patch("/{agent_id}/verification", response_model=AgentOut)
def update_verification(agent_id: int, payload: AgentVerificationUpdateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    agent = db.query(Agent).get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)

    if agent.is_fully_verified and agent.status not in (AgentStatus.active, AgentStatus.suspended, AgentStatus.rejected):
        agent.status = AgentStatus.active

    db.commit()
    db.refresh(agent)
    return agent
