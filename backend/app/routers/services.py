from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceOut, ServiceCreateIn, ServiceUpdateIn
from app.core.deps import require_admin

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=List[ServiceOut])
def list_services(db: Session = Depends(get_db)):
    return (
        db.query(Service)
        .filter(Service.is_active == True)  # noqa: E712
        .order_by(Service.display_order)
        .all()
    )


@router.post("", response_model=ServiceOut)
def create_service(payload: ServiceCreateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(Service).filter(Service.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="A service with this slug already exists")
    service = Service(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.patch("/{service_id}", response_model=ServiceOut)
def update_service(service_id: int, payload: ServiceUpdateIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    service = db.query(Service).get(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service
