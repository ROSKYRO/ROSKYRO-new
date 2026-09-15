"""
ROSKYRO Concierge — free Relationship Officer-visit quota.

Every membership plan bundles a number of free ROSKYRO Relationship Officer visits per
calendar month (Care: 2, Family: 5, NRI Care: 8 — see the membership info
page). This module is the single place that decides, for a given
membership, how many of those visits have been used in the *current*
monthly cycle and how many remain.

Note: membership billing itself is annual (see PLAN_ANNUAL_PRICE), but the
Relationship Officer visit quota resets every calendar month regardless —
it is NOT tied to the annual invoice period. current_ro_visit_period()
below computes that monthly window, anchored to the day of the month the
membership started on.

Deliberately query-based (not a stored counter) so a missed reset never
silently under- or over-charges a member — "used" is always recomputed
from the actual Booking rows tied to this membership.
"""
from datetime import datetime
from typing import Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.models.membership import (
    Membership, MembershipStatus, PLAN_FREE_ASSIST_VISITS,
)


def _safe_replace(dt: datetime, year: int, month: int, day: int) -> datetime:
    """dt.replace(), clamping day to the last valid day of the target month
    (e.g. an anchor day of 31 falling in a 30-day, or February, month)."""
    while day > 1:
        try:
            return dt.replace(year=year, month=month, day=day)
        except ValueError:
            day -= 1
    return dt.replace(year=year, month=month, day=1)


def current_ro_visit_period(membership: Membership) -> Tuple[datetime, datetime]:
    """The current monthly window for the Relationship Officer visit quota,
    anchored to the day-of-month the membership started on (so a mid-month
    signup still gets a full month before the first reset)."""
    now = datetime.utcnow()
    anchor_day = membership.started_at.day if membership.started_at else now.day

    period_start = _safe_replace(now, now.year, now.month, anchor_day)
    if period_start > now:
        # This month's anchor date hasn't happened yet -> the current window
        # started last month.
        prev_month = now.month - 1 or 12
        prev_year = now.year - 1 if now.month == 1 else now.year
        period_start = _safe_replace(now, prev_year, prev_month, anchor_day)

    next_month = period_start.month + 1
    next_year = period_start.year + (1 if next_month > 12 else 0)
    next_month = next_month if next_month <= 12 else 1
    period_end = _safe_replace(period_start, next_year, next_month, anchor_day)

    return period_start, period_end


def relationship_officer_quota_status(db: Session, membership: Membership) -> dict:
    """Plan quota, visits used in the current monthly cycle, and visits
    remaining. The pool is shared across every family member on the
    membership — usage is always counted by membership_id, never per
    family_member_id (per business decision)."""
    quota = PLAN_FREE_ASSIST_VISITS.get(membership.plan, 0)
    period_start, period_end = current_ro_visit_period(membership)

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
