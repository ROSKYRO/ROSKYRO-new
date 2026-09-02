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
    finally:
        db.close()


if __name__ == "__main__":
    run()
