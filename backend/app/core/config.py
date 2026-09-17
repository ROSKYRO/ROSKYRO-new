"""
Central configuration for ROSKYRO.

All environment-specific values (DB url, secret key, business rule constants)
live here so the rest of the app never hardcodes them. Override anything via
a .env file or real environment variables in production/deployment.
"""
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "ROSKYRO"
    ENV: str = "development"

    # Use SQLite for local/dev by default; point DATABASE_URL at Postgres in prod.
    # Railway's Postgres plugin injects DATABASE_URL automatically (as postgres://,
    # which we normalize to postgresql:// below since SQLAlchemy/psycopg2 need that).
    DATABASE_URL: str = "sqlite:///./roskyro.db"

    SECRET_KEY: str = "change-this-in-production-to-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days (customer sessions)

    # Admin/support sessions. Matches customer session length (7 days) for
    # convenience — shorten this back down (e.g. 60-120 minutes) if you'd
    # rather trade convenience for a smaller window if a token ever leaks.
    ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Basic login rate limiting (per IP). Admin login gets a tighter limit.
    LOGIN_RATE_LIMIT: str = "10/minute"
    ADMIN_LOGIN_RATE_LIMIT: str = "5/minute"

    # Kept as a plain string (not List[str]) because pydantic-settings tries to
    # JSON-parse env vars for list-typed fields, which breaks Railway's plain
    # comma-separated env var style. Use the `cors_origins` property below to
    # get the parsed list. Accepts "*" , "https://a.com,https://b.com", or a
    # JSON array string like '["https://a.com"]'.
    CORS_ORIGINS: str = "*"

    # Auto-seed the database with launch services/cities/admin on first boot if empty.
    # Safe to leave on in production — seed.py is idempotent (checks before inserting).
    AUTO_SEED: bool = True

    # Optional: set these as Railway Variables to reset the admin login on next boot
    # (e.g. after the default 9999999999/admin123 has been used). Leave unset normally —
    # when both are set, seed.py overwrites the existing admin's phone/password with
    # these values on every boot, so remove the variables again once you've changed in.
    ADMIN_RESET_PHONE: str | None = None
    ADMIN_RESET_PASSWORD: str | None = None

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_db_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql://", 1)
        return v

    @property
    def cors_origins(self) -> List[str]:
        raw = self.CORS_ORIGINS.strip()
        if raw.startswith("["):
            import json
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                pass
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    # ---- Business rule constants (mirrors the source business model) ----
    GST_PERCENT: float = 18.0
    FREE_CUSHION_MINUTES: int = 15
    MIN_BILLABLE_FRACTION_SHORT: float = 0.5   # bookings < 4 hrs: min 50% of booked hours billed
    MIN_BILLABLE_FRACTION_LONG: float = 0.75   # bookings >= 4 hrs: min 75% of booked hours billed
    LONG_BOOKING_HOURS_THRESHOLD: float = 4.0
    RETURN_SUPPORT_FEE: float = 49.0           # flat fee if service ends at a different location

    # Arrival fee tiers: (max_km, fee). First matching tier (by distance) applies.
    ARRIVAL_FEE_TIERS: List[List[float]] = [
        [3, 0],
        [8, 29],
        [13, 59],
        [18, 79],
        [999, 99],
    ]

    FIRST_HOUR_FREE_SLOTS: int = 50  # launch-offer style promo, configurable per city
    SUPPORT_EMAIL: str = "support@roskyro.in"

    # ---- Hospital patient-case / dual discharge confirmation rules ----
    # How far in the future a confirmed discharge date/time may be. This is a
    # confirmation of something that already happened, so the only slack here
    # is for clock skew between the phone/browser and the server.
    DISCHARGE_FUTURE_TOLERANCE_MINUTES: int = 15
    # How far apart the hospital's and the officer's confirmed discharge
    # date/times may be before we stop accepting the second one silently.
    # Beyond this, the two sides genuinely disagree about what happened and a
    # human (ROSKYRO Admin, via force-close) has to decide.
    DISCHARGE_MAX_CONFIRMATION_GAP_HOURS: int = 72
    # How long an officer's no-login discharge link stays usable after it is
    # issued/refreshed. A leaked link stops working after this.
    OFFICER_DISCHARGE_LINK_TTL_DAYS: int = 30
    # A case sitting half-confirmed for longer than this shows up as an alert
    # on the ops board (warning), then escalates (critical).
    DISCHARGE_PENDING_ALERT_HOURS: int = 24
    DISCHARGE_PENDING_ESCALATE_HOURS: int = 72

    # How many patients one Relationship Officer can be covering on the same
    # calendar day before the ops board refuses the assignment (a human can
    # consciously override this — see AssignOfficerIn.force — but it never
    # slides past silently). A hospital-program-specific cap, separate from
    # anything in the on-demand booking marketplace.
    MAX_DAILY_PATIENTS_PER_OFFICER: int = 4
    # Same idea as OFFICER_DISCHARGE_LINK_TTL_DAYS, but for the officer's
    # standing "my day" portal link rather than a single case's link.
    OFFICER_PORTAL_TOKEN_TTL_DAYS: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
