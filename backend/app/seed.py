"""
Run once to populate a fresh database with:
- The three launch services (renamed/re-priced for ROSKYRO, same structure as the source model)
- An admin login
- A first live city + a couple of waitlisted cities

Usage:  python -m app.seed
"""
from app.db.session import SessionLocal, engine, Base
from app.models.service import Service
from app.models.city import City
from app.models.user import User, UserRole
from app.core.security import hash_password
from app.core.config import settings

Base.metadata.create_all(bind=engine)


def run():
    db = SessionLocal()
    try:
        if not db.query(Service).first():
            db.add_all([
                Service(
                    name="Hospital Assist", slug="hospital-assist", icon="🏥",
                    short_description="OPD visits, admission paperwork, attendant support",
                    description="A trained companion for OPD queues, admission formalities, and hospital-floor support so your family isn't navigating it alone.",
                    hourly_rate=219, display_order=1,
                ),
                Service(
                    name="Elder Companion Care", slug="elder-companion-care", icon="🤝",
                    short_description="Companionship & daily support for seniors",
                    description="Day-to-day companionship, light assistance, and a reassuring presence for elderly family members living alone.",
                    hourly_rate=199, display_order=2,
                ),
                Service(
                    name="24x7 Urgent Support", slug="urgent-support", icon="🆘",
                    short_description="Non-medical urgent help, any hour",
                    description="Round-the-clock non-medical urgent assistance when something comes up and you need trusted help fast.",
                    hourly_rate=269, display_order=3,
                ),
                Service(
                    name="Hospital Concierge", slug="hospital-concierge", icon="🏥",
                    short_description="Admission → discharge, attendant coordination",
                    description="A dedicated concierge who coordinates the full hospital journey — admission formalities, floor-level attendant support, and discharge — so the family always has one point of contact.",
                    hourly_rate=249, display_order=4,
                ),
                Service(
                    name="Elderly Care Concierge", slug="elderly-care-concierge", icon="👴",
                    short_description="Hospital visits + appointments + assistance",
                    description="Ongoing concierge support for seniors — accompanying hospital visits, managing appointment schedules, and general day-to-day assistance.",
                    hourly_rate=229, display_order=5,
                ),
                Service(
                    name="Medical Travel Concierge", slug="medical-travel-concierge", icon="✈️",
                    short_description="Outstation patient → city → hospital → stay → treatment → return",
                    description="End-to-end coordination for patients travelling from outside the city — arrival, hospital coordination, stay arrangements, treatment-day support, and the return journey.",
                    hourly_rate=349, display_order=6,
                ),
                Service(
                    name="Diagnostic Concierge", slug="diagnostic-concierge", icon="🧪",
                    short_description="Test booking → centre coordination → report collection",
                    description="Handles diagnostic test bookings, coordination with the test centre, and collection/delivery of reports — one less thing for the family to chase.",
                    hourly_rate=179, display_order=7,
                ),
                Service(
                    name="Post-Discharge Concierge", slug="post-discharge-concierge", icon="🏠",
                    short_description="Hospital → home transition + follow-up coordination",
                    description="Supports the transition from hospital to home after discharge, including follow-up appointment and medication coordination.",
                    hourly_rate=209, display_order=8,
                ),
            ])

        if not db.query(City).first():
            db.add_all([
                City(name="INDIA", state="Bihar", is_live=True),
                City(name="Ranchi", state="Jharkhand", is_live=False),
                City(name="Lucknow", state="Uttar Pradesh", is_live=False),
            ])

        if not db.query(User).filter(User.role == UserRole.admin).first():
            db.add(User(
                full_name="ROSKYRO Admin",
                phone="9999999999",
                email="admin@roskyro.in",
                hashed_password=hash_password("admin123"),  # CHANGE IMMEDIATELY in production
                role=UserRole.admin,
            ))

        db.commit()
        print("Seed complete. Admin login -> phone: 9999999999 / password: admin123 (change this!)")

        # One-time reset hook: if ADMIN_RESET_PHONE / ADMIN_RESET_PASSWORD are set as
        # env vars, overwrite the existing admin's credentials with them. Lets you
        # rotate the seeded default without touching the database directly — set the
        # two Railway variables, redeploy, log in with the new values, then remove
        # the variables (otherwise every future boot keeps re-applying them).
        if settings.ADMIN_RESET_PHONE or settings.ADMIN_RESET_PASSWORD:
            admin = db.query(User).filter(User.role == UserRole.admin).first()
            if admin:
                if settings.ADMIN_RESET_PHONE:
                    admin.phone = settings.ADMIN_RESET_PHONE
                if settings.ADMIN_RESET_PASSWORD:
                    admin.hashed_password = hash_password(settings.ADMIN_RESET_PASSWORD)
                db.commit()
                print("Admin credentials reset from ADMIN_RESET_PHONE / ADMIN_RESET_PASSWORD.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
