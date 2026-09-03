from pydantic import BaseModel
from typing import Optional


class CityAdminOut(BaseModel):
    id: int
    name: str
    state: Optional[str] = None
    is_live: bool
    interest_count: int
    agent_count: int = 0

    class Config:
        from_attributes = True


class CityCreateIn(BaseModel):
    name: str
    state: Optional[str] = None
    is_live: bool = False


class CityUpdateIn(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    is_live: Optional[bool] = None
