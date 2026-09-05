import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Float, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.journey import JourneyStage


class BookingStatus(str, enum.Enum):
    requested = "requested"          # customer submitted, awaiting agent assignment
    assigned = "assigned"            # an Agent has been matched
    en_route = "en_route"            # agent is on the way
    awaiting_start_pin = "awaiting_start_pin"  # agent arrived, waiting for customer to share Start PIN
    in_progress = "in_progress"      # Start PIN entered, clock running
    awaiting_end_pin = "awaiting_end_pin"      # work done, waiting for End PIN to close billing
    completed = "completed"
    cancelled = "cancelled"


class Booking(Base):
    """
    One service visit. Mirrors the source flow:
    request -> match -> arrival -> Start PIN -> timed service -> End PIN -> pay after via UPI.
    """
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_code = Column(String, unique=True, index=True, nullable=False)  # human-friendly ID, e.g. RK-10234

    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)

    # Where the patient physically is right now (Journey Engine). Separate from
    # `status` above, which tracks billing/PIN state. Nullable so existing rows
    # and non-hospital bookings (e.g. Elder Companion Care) simply don't use it.
    current_stage = Column(Enum(JourneyStage), nullable=True)

    address = Column(Text, nullable=False)
    contact_on_arrival_name = Column(String, nullable=True)
    contact_on_arrival_phone = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    scheduled_start = Column(DateTime, nullable=False)
    booked_hours = Column(Float, nullable=False)

    distance_km = Column(Float, default=0.0)          # used to compute arrival fee
    ends_at_different_location = Column(Boolean, default=False)  # triggers return support fee

    status = Column(Enum(BookingStatus), default=BookingStatus.requested, nullable=False)

    start_pin = Column(String, nullable=True)
    end_pin = Column(String, nullable=True)
    actual_start_at = Column(DateTime, nullable=True)
    actual_end_at = Column(DateTime, nullable=True)

    # Pricing snapshot (filled once billed, so historical bookings aren't affected by rate changes)
    hourly_rate_snapshot = Column(Float, nullable=True)
    billable_hours = Column(Float, nullable=True)
    service_subtotal = Column(Float, nullable=True)
    arrival_fee = Column(Float, nullable=True)
    return_fee = Column(Float, nullable=True)
    discount_amount = Column(Float, default=0.0)
    gst_amount = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    is_first_hour_free_applied = Column(Boolean, default=False)

    sos_triggered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", back_populates="bookings", foreign_keys=[customer_id])
    agent = relationship("Agent", back_populates="bookings")
    service = relationship("Service")
    hospital = relationship("Hospital", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False)
    review = relationship("Review", back_populates="booking", uselist=False)
    journey_updates = relationship(
        "JourneyUpdate", back_populates="booking",
        order_by="JourneyUpdate.created_at", cascade="all, delete-orphan",
    )
