from sqlalchemy import Column, Integer, String, Float, Boolean, Text

from app.db.session import Base


class Service(Base):
    """A bookable service line (e.g. Hospital Concierge, Elderly Care Concierge, 24x7 Urgent Support)."""
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    icon = Column(String, nullable=True)          # emoji or icon key for the frontend
    short_description = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    hourly_rate = Column(Float, nullable=False)    # exclusive of GST
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
