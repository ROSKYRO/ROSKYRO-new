from pydantic import BaseModel
from typing import Optional

from app.models.complaint import ComplaintCategory


class ComplaintIn(BaseModel):
    name: str
    phone: str
    booking_code: Optional[str] = None
    category: ComplaintCategory
    message: str


class CityInterestIn(BaseModel):
    city_name: str
    phone: Optional[str] = None


class CityOut(BaseModel):
    id: int
    name: str
    state: Optional[str]
    is_live: bool

    class Config:
        from_attributes = True
