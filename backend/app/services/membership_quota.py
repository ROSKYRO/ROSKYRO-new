"""
ROSKYRO Concierge — free Relationship Officer-visit quota.

Every membership plan bundles a number of free ROSKYRO Relationship Officer visits per
billing month (Care: 2, Family: 5, NRI Care: 8 — see the membership info
page). This module is the single place that decides, for a given
membership, how many of those visits have been used in the *current*
billing period and how many remain.

Deliberately query-based (not a stored counter) so a missed reset never
silently under- or over-charges a member — "used" is always recomputed
from the actual Booking rows tied to this membership.
"""
from datetime import datetime, timedelta
from typing import Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.models.membership import (
    Membership, MembershipStatus, MembershipInvoice, PLAN_FREE_ASSIST_VISITS,
)


def current_billing_period(db: Session, membership: Membership) -> Tuple[datetime, datetime]:
    """The quota resets with the billing cycle, so it must line up with an
    actual invoice period — not a rolling 30 days from "now". Prefer the
    invoice that covers this moment; fall back to next_billing_date minus
    30 days for the rare gap where a renewal invoice hasn't been generated
    yet."""
    now = datetime.utcnow()
    invoice = (
        db.query(MembershipInvoice)
        .filter(
            MembershipInvoice.membership_id == membership.id,
            MembershipInvoice.period_start <= now,
            MembershipInvoice.period_end >= now,
        )
        .order_by(MembershipInvoice.created_at.desc())
        .first()
    )
    if invoice:
        return invoice.period_start, invoice.period_end

    period_end = membership.next_billing_date or (membership.started_at + timedelta(days=30))
    period_start = period_end - timedelta(days=30)
    return period_start, period_end


def relationship_officer_quota_status(db: Session, membership: Membership) -> dict:
    """Plan quota, visits used in the current billing period, and visits
    remaining. The pool is shared across every family member on the
    membership — usage is always counted by membership_id, never per
    family_member_id (per business decision)."""
    quota = PLAN_FREE_ASSIST_VISITS.get(membership.plan, 0)
    period_start, period_end = current_billing_period(db, membership)

    used = (
        db.query(func.count(Booking.id))
        .filter(
            Booking.membership_id == membership.id,
            Booking.is_membership_covered.is_(True),
            Booking.created_at >= period_start,
            Booking.created_at <= period_end,
            Booking.status != BookingStatus.cancelled,
        )
        .scalar()
        or 0
    )
    return {
        "quota": quota,
        "used": used,
        "remaining": max(quota - used, 0),
        "period_start": period_start,
        "period_end": period_end,
    }


def has_quota_remaining(db: Session, membership: Membership) -> bool:
    """False for any non-active membership (paused/expired/cancelled/pending)
    — quota only applies while the membership is actually active."""
    if membership.status != MembershipStatus.active:
        return False
    return relationship_officer_quota_status(db, membership)["remaining"] > 0
