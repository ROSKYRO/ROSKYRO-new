from pydantic import BaseModel
from typing import Optional


class ServiceOut(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    hourly_rate: float
    is_active: bool

    class Config:
        from_attributes = True


class ServiceCreateIn(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    hourly_rate: float
    display_order: int = 0


class ServiceUpdateIn(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None
