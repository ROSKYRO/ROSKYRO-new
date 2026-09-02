import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey, Boolean

from app.db.session import Base


class ComplaintCategory(str, enum.Enum):
    safety = "safety"
    service_issue = "service_issue"
    feedback = "feedback"
    compliment = "compliment"


class ComplaintStatus(str, enum.Enum):
    open = "open"
    in_review = "in_review"
    resolved = "resolved"


class Complaint(Base):
    """Feedback/safety intake form. Safety category is flagged for priority handling."""
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    booking_code = Column(String, nullable=True)
    category = Column(Enum(ComplaintCategory), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.open)
    is_priority = Column(Boolean, default=False)  # auto-true for 'safety'
    resolution_note = Column(Text, nullable=True)  # admin's reply / how it was resolved
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
