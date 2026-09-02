from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.complaint import Complaint, ComplaintCategory
from app.models.city import City
from app.schemas.misc import ComplaintIn, CityInterestIn, CityOut

router = APIRouter(tags=["misc"])


@router.post("/complaints")
def submit_complaint(payload: ComplaintIn, db: Session = Depends(get_db)):
    complaint = Complaint(
        name=payload.name,
        phone=payload.phone,
        booking_code=payload.booking_code,
        category=payload.category,
        message=payload.message,
        is_priority=(payload.category == ComplaintCategory.safety),
    )
    db.add(complaint)
    db.commit()
    return {"detail": "Received — our team will reach out shortly.", "priority": complaint.is_priority}


@router.get("/cities", response_model=List[CityOut])
def list_cities(db: Session = Depends(get_db)):
    return db.query(City).all()


@router.post("/cities/interest")
def register_city_interest(payload: CityInterestIn, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.name.ilike(payload.city_name)).first()
    if not city:
        city = City(name=payload.city_name, is_live=False)
        db.add(city)
        db.flush()
    city.interest_count += 1
    db.commit()
    return {"detail": f"Thanks — we'll factor {city.name} into where we launch next."}
