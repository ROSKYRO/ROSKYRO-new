"""
Coverage-day / billing math, the discharge confirmation rules, and the ops
alerts for a PatientCase — shared by app/routers/hospital_admin.py (ROSKYRO
Admin), app/routers/hospitals.py (Hospital Console) and app/routers/officer.py
(the assigned Relationship Officer's no-login discharge link), so the three
surfaces can never quietly disagree on "how many days has this cost so far",
"who is covering this patient today", or "is this case actually discharged".

Design, per the ops rule this implements:
  - The Relationship Officer is assigned once (ROSKYRO Admin picks them from
    the dropdown, at admission). Coverage is NOT capped by whatever date
    range Admin happened to type into the "To" field when assigning — that
    range only seeds DailyOfficerAssignment rows for the history view.
    `officer_on_duty()` below therefore falls back to the case's assigned
    officer on any day that has no daily row, instead of reporting the
    patient as uncovered.
  - Time (and therefore billing) keeps running, day by day, for as long as
    the case is active/pending_discharge — right up until the patient is
    actually discharged.
  - "Actually discharged" normally requires BOTH the hospital AND the
    assigned officer to separately confirm a discharge date & time. The one
    exception: a case that never had an officer assigned has nobody who
    *can* confirm the officer side, so the hospital's confirmation alone
    closes it (otherwise it deadlocks in pending_discharge, billing forever).
  - When one side simply never responds, ROSKYRO Admin can force the case
    closed — recorded separately (who/when/why) so it is never mistaken for
    a clean dual confirmation.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone, date as date_cls
from typing import Optional

from app.core.config import settings
from app.core.security import generate_officer_token
from app.models.patient_case import PatientCase, PatientCaseStatus


class DischargeValidationError(ValueError):
    """Raised when a confirmed discharge date/time can't be accepted. Routers
    translate this into a 400 with the message as-is — the messages here are
    written to be shown to hospital staff and officers directly."""


# ---------------------------------------------------------------------------
# Timezone hygiene
# ---------------------------------------------------------------------------

def to_naive_utc(value: Optional[datetime]) -> Optional[datetime]:
    """Every datetime stored on a PatientCase is naive UTC (the rest of the
    app uses `datetime.utcnow()`), but the browser posts ISO strings ending in
    'Z', which FastAPI parses into *timezone-aware* datetimes. Mixing the two
    blows up on the very first comparison — e.g. `max(hospital_discharge_at,
    officer_discharge_at)` raises TypeError when one side sent an explicit
    time and the other defaulted to utcnow(). Normalize on the way in, once."""
    if value is None:
        return None
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


# ---------------------------------------------------------------------------
# Coverage / billing
# ---------------------------------------------------------------------------

def coverage_days_and_billing(case: PatientCase) -> tuple[int, float]:
    """How many calendar days this case has been (or was) covered, and the
    running/final billed estimate — counted from admission_date through
    today (still open) or through the confirmed discharge date (closed),
    inclusive on both ends, minimum of 1 day."""
    if case.status == PatientCaseStatus.discharged and case.discharged_at:
        end = case.discharged_at.date()
    else:
        end = datetime.utcnow().date()
    days = max((end - case.admission_date).days + 1, 1)
    return days, round(days * case.daily_rate, 2)


# ---------------------------------------------------------------------------
# Who is on this patient today
# ---------------------------------------------------------------------------

@dataclass
class OnDutyOfficer:
    agent_id: Optional[int]
    name: Optional[str]
    # True when this came from the case's standing assignment rather than an
    # explicit DailyOfficerAssignment row for that date. Not a problem — it is
    # the normal state once the seeded From–To range runs out — but the UI
    # labels it so Admin can tell "covered by the standing assignment" apart
    # from "explicitly rostered for today".
    is_fallback: bool = False
    # Today's row was explicitly marked no_show — the patient is uncovered
    # *and* somebody has already noticed, which is a different alert from
    # "nobody was ever assigned".
    no_show: bool = False

    @property
    def covered(self) -> bool:
        return self.agent_id is not None


def officer_on_duty(case: PatientCase, day: Optional[date_cls] = None) -> OnDutyOfficer:
    """Who is covering this patient on `day` (default: today).

    Resolution order:
      1. An explicit DailyOfficerAssignment row for that date (unless it was
         marked no_show — that day genuinely needs a re-assign).
      2. The case's standing assigned Relationship Officer.

    Step 2 is the fix for the "To date ran out" false alarm: Admin assigning
    17→18 Sep only seeds two daily rows, but per the ops rule that officer
    stays on the case until discharge — so on 25 Sep the patient is still
    covered, and neither the ops board nor the Hospital Console should be
    shouting "needs today's officer"."""
    from app.models.patient_case import DailyAssignmentStatus  # local: avoids import cycle

    day = day or datetime.utcnow().date()
    row = next((a for a in case.assignments if a.date == day), None)
    if row and row.status == DailyAssignmentStatus.no_show:
        # An explicit no_show is a deliberate statement that this day was NOT
        # covered. It must not fall through to the standing officer below —
        # that's the very person who didn't turn up, and the whole point of
        # marking it is to make the ops board ask for a re-assign.
        return OnDutyOfficer(agent_id=None, name=None, is_fallback=False, no_show=True)
    if row and row.agent:
        return OnDutyOfficer(agent_id=row.agent_id, name=row.agent.full_name, is_fallback=False)
    if case.assigned_agent_id and case.assigned_agent:
        return OnDutyOfficer(
            agent_id=case.assigned_agent_id,
            name=case.assigned_agent.full_name,
            is_fallback=True,
        )
    return OnDutyOfficer(agent_id=None, name=None, is_fallback=False)


# ---------------------------------------------------------------------------
# The officer's no-login discharge link
# ---------------------------------------------------------------------------

def issue_officer_discharge_token(case: PatientCase, rotate: bool = False) -> str:
    """Mint (or rotate) the officer's discharge link and set its expiry.

    `rotate=True` mints a brand-new token, which instantly invalidates the old
    one — used when the link may have leaked, or when the case's officer
    changes and the previous officer must lose access."""
    if rotate or not case.officer_discharge_token:
        case.officer_discharge_token = generate_officer_token()
    case.officer_discharge_token_expires_at = (
        datetime.utcnow() + timedelta(days=settings.OFFICER_DISCHARGE_LINK_TTL_DAYS)
    )
    return case.officer_discharge_token


def officer_discharge_link_is_live(case: PatientCase) -> bool:
    """A NULL expiry means the link predates expiry support — still honoured,
    so nothing breaks for links already handed out in production, but
    `build_case_alerts()` flags it so Admin can rotate it."""
    if not case.officer_discharge_token:
        return False
    if case.officer_discharge_token_expires_at is None:
        return True
    return datetime.utcnow() <= case.officer_discharge_token_expires_at


# ---------------------------------------------------------------------------
# Discharge confirmation
# ---------------------------------------------------------------------------

def requires_officer_confirmation(case: PatientCase) -> bool:
    """A case only needs the officer's half of the confirmation if there IS an
    assigned officer. No officer was ever assigned → nobody can ever confirm
    that side → the hospital's confirmation alone has to be enough."""
    return case.assigned_agent_id is not None


def validate_discharge_datetime(
    case: PatientCase,
    when: Optional[datetime],
    *,
    other_side_at: Optional[datetime] = None,
    enforce_gap: bool = True,
) -> datetime:
    """Normalize and sanity-check a confirmed discharge date/time.

    Rejects: before admission, in the future (beyond clock-skew tolerance),
    and — when the other side has already confirmed — a gap between the two
    confirmations so large that the two sides clearly disagree about what
    happened. `enforce_gap=False` is for the Admin force-close override,
    which is precisely the tool for resolving that disagreement."""
    when = to_naive_utc(when) or datetime.utcnow()
    now = datetime.utcnow()

    admission_start = datetime.combine(case.admission_date, datetime.min.time())
    if when < admission_start:
        raise DischargeValidationError(
            f"The discharge time can't be before the patient was admitted "
            f"({case.admission_date.isoformat()}). Please check the date."
        )

    tolerance = timedelta(minutes=settings.DISCHARGE_FUTURE_TOLERANCE_MINUTES)
    if when > now + tolerance:
        raise DischargeValidationError(
            "The discharge time can't be in the future — confirm it once the "
            "patient has actually been discharged."
        )

    if enforce_gap and other_side_at is not None:
        other = to_naive_utc(other_side_at)
        gap_hours = abs((when - other).total_seconds()) / 3600.0
        if gap_hours > settings.DISCHARGE_MAX_CONFIRMATION_GAP_HOURS:
            raise DischargeValidationError(
                f"This is more than {settings.DISCHARGE_MAX_CONFIRMATION_GAP_HOURS} "
                f"hours away from the discharge time the other side already "
                f"confirmed ({other.strftime('%d %b %Y, %H:%M')} UTC). Please "
                f"re-check the date, or ask ROSKYRO to resolve it."
            )
    return when


def apply_hospital_discharge_confirmation(
    case: PatientCase,
    when: Optional[datetime],
    staff_id: Optional[int] = None,
) -> None:
    """Hospital confirms the discharge date/time. Finalizes the case if the
    officer side is already confirmed — or if there is no assigned officer at
    all, in which case this confirmation is all there is to wait for."""
    case.hospital_discharge_at = validate_discharge_datetime(
        case, when, other_side_at=case.officer_discharge_at
    )
    case.hospital_discharge_by_id = staff_id
    recompute_discharge_status(case)


def apply_officer_discharge_confirmation(case: PatientCase, when: Optional[datetime]) -> None:
    """The assigned Relationship Officer confirms the discharge date/time,
    via their no-login token link. Finalizes the case only if the hospital
    had already confirmed theirs."""
    case.officer_discharge_at = validate_discharge_datetime(
        case, when, other_side_at=case.hospital_discharge_at
    )
    recompute_discharge_status(case)


def undo_hospital_discharge_confirmation(case: PatientCase) -> None:
    """Hospital takes back a confirmation clicked by mistake. Only possible
    while the case hasn't fully closed — once it's closed, reopening is an
    Admin decision, not a one-click undo inside the hospital's console."""
    if case.status == PatientCaseStatus.discharged:
        raise DischargeValidationError(
            "This case is already fully closed — ask ROSKYRO to reopen it."
        )
    case.hospital_discharge_at = None
    case.hospital_discharge_by_id = None
    recompute_discharge_status(case)


def undo_officer_discharge_confirmation(case: PatientCase) -> None:
    """Same, for the officer's side of the confirmation."""
    if case.status == PatientCaseStatus.discharged:
        raise DischargeValidationError(
            "This case is already fully closed — ask ROSKYRO to reopen it."
        )
    case.officer_discharge_at = None
    recompute_discharge_status(case)


def force_close_discharge(
    case: PatientCase,
    when: Optional[datetime],
    admin_id: Optional[int],
    reason: str,
) -> None:
    """ROSKYRO Admin's override for a case stuck half-confirmed because one
    side stopped responding (officer lost their phone, left the job, hospital
    staff never clicked through). Fills in whatever is missing at the given
    time, closes the case so billing stops, and records who overrode it and
    why — a force-closed case is deliberately distinguishable from a clean
    dual confirmation in every read model."""
    if case.status == PatientCaseStatus.cancelled:
        raise DischargeValidationError("This case was cancelled — there's nothing to discharge.")
    if case.status == PatientCaseStatus.discharged:
        raise DischargeValidationError("This case is already fully discharged.")
    if not (reason or "").strip():
        raise DischargeValidationError("A reason is required when force-closing a discharge.")

    # The gap check is deliberately skipped: resolving a disagreement between
    # the two sides is the entire point of this override.
    resolved = validate_discharge_datetime(case, when, enforce_gap=False)

    if not case.hospital_discharge_at:
        case.hospital_discharge_at = resolved
    if requires_officer_confirmation(case) and not case.officer_discharge_at:
        case.officer_discharge_at = resolved

    case.discharge_force_closed_at = datetime.utcnow()
    case.discharge_force_closed_by_id = admin_id
    case.discharge_force_close_reason = reason.strip()

    # Kill the officer's link — the case is closed, so it has no further use.
    case.officer_discharge_token_expires_at = datetime.utcnow()

    recompute_discharge_status(case)


def recompute_discharge_status(case: PatientCase) -> None:
    """Single source of truth for status + discharged_at, derived from which
    confirmations are currently on the record. Written as a pure recompute
    (rather than one-way transitions) so that undoing a confirmation, or
    resetting the officer's side after a re-assign, lands the case back in
    exactly the right state instead of leaving it stranded.

    Also the single place a finished Hospital Concierge Program case counts
    as a completed job for the assigned officer — total_jobs previously only
    ever moved from the on-demand booking flow, so an officer who spent 30
    days on a hospital patient had nothing to show for it on their own
    record. Every path that can close a case (hospital confirms, officer
    confirms, admin force-closes) funnels through here, so the increment
    only needs to live in one place, and only fires on the transition INTO
    discharged (never twice for the same case, since undo is blocked once a
    case is already discharged — see undo_*_discharge_confirmation above)."""
    if case.status == PatientCaseStatus.cancelled:
        return

    was_discharged = case.status == PatientCaseStatus.discharged
    hospital_at = case.hospital_discharge_at
    officer_at = case.officer_discharge_at
    officer_needed = requires_officer_confirmation(case)

    if hospital_at and (officer_at or not officer_needed):
        case.status = PatientCaseStatus.discharged
        # The later of the confirmed timestamps is when coverage verifiably
        # stopped for both sides.
        case.discharged_at = max(t for t in (hospital_at, officer_at) if t)
        if not was_discharged and case.assigned_agent is not None:
            case.assigned_agent.total_jobs = (case.assigned_agent.total_jobs or 0) + 1
    elif hospital_at or officer_at:
        case.status = PatientCaseStatus.pending_discharge
        case.discharged_at = None
    else:
        case.status = PatientCaseStatus.active
        case.discharged_at = None


def discharge_waiting_on(case: PatientCase) -> Optional[str]:
    """Which side a pending_discharge case is actually waiting on — 'officer',
    'hospital', or None when it isn't pending."""
    if case.status != PatientCaseStatus.pending_discharge:
        return None
    if case.hospital_discharge_at and not case.officer_discharge_at:
        return "officer"
    return "hospital"


def discharge_pending_since(case: PatientCase) -> Optional[datetime]:
    """When the first (so far unanswered) confirmation landed."""
    if case.status != PatientCaseStatus.pending_discharge:
        return None
    stamps = [t for t in (case.hospital_discharge_at, case.officer_discharge_at) if t]
    return min(stamps) if stamps else None


# ---------------------------------------------------------------------------
# Ops alerts — the in-app stand-in for push notifications
# ---------------------------------------------------------------------------

@dataclass
class CaseAlert:
    code: str
    severity: str   # info | warning | critical
    message: str


def build_case_alerts(case: PatientCase, *, for_admin: bool = False) -> list[CaseAlert]:
    """Everything about this case that somebody should be chasing right now.

    This is what both dashboards render, so neither side has to notice a
    problem by reading timestamps. It is NOT a delivery channel — nobody gets
    an SMS/WhatsApp from this. Wiring these same alerts into a real notifier
    is a separate job (see the note in the handover doc); surfacing them in
    the UI is the part that needs no third-party provider."""
    alerts: list[CaseAlert] = []
    now = datetime.utcnow()
    today = now.date()

    if case.status in (PatientCaseStatus.discharged, PatientCaseStatus.cancelled):
        return alerts

    on_duty = officer_on_duty(case)
    if on_duty.no_show:
        alerts.append(CaseAlert(
            code="officer_no_show",
            severity="critical",
            message="Today's officer was marked a no-show — this patient is uncovered right now. Re-assign someone.",
        ))
    elif not on_duty.covered:
        alerts.append(CaseAlert(
            code="no_officer_assigned",
            severity="critical" if case.status == PatientCaseStatus.active else "warning",
            message="No Relationship Officer is assigned to this patient yet.",
        ))

    if case.status == PatientCaseStatus.pending_discharge:
        waiting_on = discharge_waiting_on(case)
        since = discharge_pending_since(case)
        hours = (now - since).total_seconds() / 3600.0 if since else 0.0
        if hours >= settings.DISCHARGE_PENDING_ESCALATE_HOURS:
            severity = "critical"
        elif hours >= settings.DISCHARGE_PENDING_ALERT_HOURS:
            severity = "warning"
        else:
            severity = "info"
        who = "the Relationship Officer" if waiting_on == "officer" else "the hospital"
        tail = (
            " Billing is still running — use Force-close discharge to settle it."
            if for_admin and severity == "critical" else
            " Billing keeps running until both confirmations are in."
        )
        alerts.append(CaseAlert(
            code="discharge_pending",
            severity=severity,
            message=f"Discharge has been waiting on {who} for {int(hours)}h.{tail}",
        ))

    if (
        case.status == PatientCaseStatus.active
        and case.expected_discharge_date
        and case.expected_discharge_date < today
    ):
        overdue = (today - case.expected_discharge_date).days
        alerts.append(CaseAlert(
            code="expected_discharge_passed",
            severity="warning" if overdue >= 2 else "info",
            message=(
                f"Expected discharge was {overdue} day{'s' if overdue != 1 else ''} ago "
                f"({case.expected_discharge_date.isoformat()}) and this case is still open. "
                f"Check whether the patient has actually gone home."
            ),
        ))

    if for_admin and requires_officer_confirmation(case):
        if not officer_discharge_link_is_live(case):
            alerts.append(CaseAlert(
                code="discharge_link_expired",
                severity="warning",
                message="The officer's discharge link has expired — regenerate it before they need to confirm.",
            ))
        elif case.officer_discharge_token_expires_at is None:
            alerts.append(CaseAlert(
                code="discharge_link_no_expiry",
                severity="info",
                message="This officer link was issued before links expired. Regenerate it to put it on a timer.",
            ))

    return alerts
