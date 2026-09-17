"""
Coverage-day / billing math and the dual discharge confirmation rule for a
PatientCase — shared by app/routers/hospital_admin.py (ROSKYRO Admin) and
app/routers/hospitals.py (Hospital Console) and app/routers/officer.py (the
assigned Relationship Officer's no-login discharge link), so the three
surfaces can never quietly disagree on "how many days has this cost so far"
or "is this case actually discharged yet".

Design, per the ops rule this implements:
  - The Relationship Officer is assigned once (ROSKYRO Admin picks them from
    the dropdown, at admission). Coverage is NOT capped by whatever date
    range Admin happened to type into the "To" field when assigning — that
    range only seeds DailyOfficerAssignment rows for the history view.
  - Time (and therefore billing) keeps running, day by day, for as long as
    the case is active/pending_discharge — right up until the patient is
    actually discharged.
  - "Actually discharged" requires BOTH the hospital AND the assigned
    officer to separately confirm a discharge date & time. Only once both
    have confirmed does the case close and billing stop.
"""
from datetime import datetime, date as date_cls

from app.models.patient_case import PatientCase, PatientCaseStatus


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


def apply_hospital_discharge_confirmation(case: PatientCase, when: datetime | None, admin_id: int | None = None) -> None:
    """Hospital confirms the discharge date/time. Finalizes the case only if
    the assigned officer had already confirmed theirs."""
    case.hospital_discharge_at = when or datetime.utcnow()
    _finalize_if_both_confirmed(case)


def apply_officer_discharge_confirmation(case: PatientCase, when: datetime | None) -> None:
    """The assigned Relationship Officer confirms the discharge date/time,
    via their no-login token link. Finalizes the case only if the hospital
    had already confirmed theirs."""
    case.officer_discharge_at = when or datetime.utcnow()
    _finalize_if_both_confirmed(case)


def _finalize_if_both_confirmed(case: PatientCase) -> None:
    if case.hospital_discharge_at and case.officer_discharge_at:
        case.status = PatientCaseStatus.discharged
        # The later of the two confirmed timestamps is when coverage
        # actually, verifiably stopped for both sides.
        case.discharged_at = max(case.hospital_discharge_at, case.officer_discharge_at)
    else:
        case.status = PatientCaseStatus.pending_discharge
