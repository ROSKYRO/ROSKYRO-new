from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class City(Base):
    """A city ROSKYRO operates in (or a waitlisted city, is_live=False)."""
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    state = Column(String, nullable=True)
    is_live = Column(Boolean, default=False)
    interest_count = Column(Integer, default=0)  # bumped when someone requests this city

    agents = relationship("Agent", back_populates="city")
