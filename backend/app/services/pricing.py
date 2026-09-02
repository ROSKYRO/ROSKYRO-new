"""
ROSKYRO pricing engine.

Replicates the source business's billing model as a set of pure, testable
functions:
  - Bill for ACTUAL time worked (Start PIN -> End PIN), not booked time.
  - A free cushion of N minutes is allowed past booked time before extra
    hours are charged.
  - A minimum billable floor protects the agent's reserved time: 50% of
    booked hours normally, 75% for bookings of 4+ hours.
  - A one-time Arrival Fee is charged based on the agent's travel distance
    (tiered, GST-exempt).
  - A flat Return Support Fee applies only if the service ends at a
    different location than it started (GST-exempt).
  - GST is applied only to the service charge, not to arrival/return fees.
  - A configurable "first N bookings free first hour" launch promo.
"""
from dataclasses import dataclass
from typing import Optional

from app.core.config import settings


@dataclass
class PriceBreakdown:
    booked_hours: float
    billable_hours: float
    hourly_rate: float
    service_subtotal: float
    arrival_fee: float
    return_fee: float
    discount_amount: float
    gst_amount: float
    total_amount: float
    first_hour_free_applied: bool


def compute_arrival_fee(distance_km: float) -> float:
    for max_km, fee in settings.ARRIVAL_FEE_TIERS:
        if distance_km <= max_km:
            return float(fee)
    return float(settings.ARRIVAL_FEE_TIERS[-1][1])


def compute_billable_hours(booked_hours: float, actual_hours: float) -> float:
    """Actual time worked, with a free cushion, floored at the minimum guarantee."""
    cushion_hours = settings.FREE_CUSHION_MINUTES / 60.0

    if actual_hours <= booked_hours + cushion_hours:
        billed = min(actual_hours, booked_hours)
    else:
        billed = actual_hours  # ran over past the cushion -> charge real overtime

    min_fraction = (
        settings.MIN_BILLABLE_FRACTION_LONG
        if booked_hours >= settings.LONG_BOOKING_HOURS_THRESHOLD
        else settings.MIN_BILLABLE_FRACTION_SHORT
    )
    floor_hours = booked_hours * min_fraction
    return max(billed, floor_hours)


def price_booking(
    booked_hours: float,
    actual_hours: float,
    hourly_rate: float,
    distance_km: float,
    ends_at_different_location: bool,
    apply_first_hour_free: bool = False,
) -> PriceBreakdown:
    billable_hours = compute_billable_hours(booked_hours, actual_hours)
    service_subtotal = round(billable_hours * hourly_rate, 2)

    discount_amount = 0.0
    first_hour_free_applied = False
    if apply_first_hour_free and billable_hours > 0:
        # Waive one hour's worth of the service charge (not fees/GST).
        discount_amount = round(min(hourly_rate, service_subtotal), 2)
        first_hour_free_applied = True

    taxable_amount = max(service_subtotal - discount_amount, 0.0)
    gst_amount = round(taxable_amount * settings.GST_PERCENT / 100.0, 2)

    arrival_fee = compute_arrival_fee(distance_km)
    return_fee = settings.RETURN_SUPPORT_FEE if ends_at_different_location else 0.0

    total_amount = round(taxable_amount + gst_amount + arrival_fee + return_fee, 2)

    return PriceBreakdown(
        booked_hours=booked_hours,
        billable_hours=billable_hours,
        hourly_rate=hourly_rate,
        service_subtotal=service_subtotal,
        arrival_fee=arrival_fee,
        return_fee=return_fee,
        discount_amount=discount_amount,
        gst_amount=gst_amount,
        total_amount=total_amount,
        first_hour_free_applied=first_hour_free_applied,
    )


def estimate_booking(
    booked_hours: float,
    hourly_rate: float,
    distance_km: float = 0.0,
    ends_at_different_location: bool = False,
) -> PriceBreakdown:
    """Pre-booking estimate shown to the customer, assuming full booked time used."""
    return price_booking(
        booked_hours=booked_hours,
        actual_hours=booked_hours,
        hourly_rate=hourly_rate,
        distance_km=distance_km,
        ends_at_different_location=ends_at_different_location,
    )
