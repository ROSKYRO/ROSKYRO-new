import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.db.session import Base, engine
from app.routers import auth, services, bookings, agents, misc, admin, hospitals

# Auto-create tables on boot for simplicity (swap for Alembic migrations in production).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="Backend API for ROSKYRO — a verified on-demand care & assistance marketplace.",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All API routes live under /api so they never collide with the frontend's own
# client-side routes of the same name (e.g. the React app also has a "/admin" page).
app.include_router(auth.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(misc.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(hospitals.public_router, prefix="/api")
app.include_router(hospitals.router, prefix="/api")


@app.on_event("startup")
def seed_on_boot():
    # Populates services/cities/admin login on first boot only (seed.run() checks
    # for existing rows before inserting, so this is safe to leave on every deploy).
    if settings.AUTO_SEED:
        from app.seed import run as run_seed
        run_seed()


@app.get("/health")
def health():
    return {"status": "ok"}


# --- Combined single-service deploy: serve the built React frontend ---
# When the frontend is built into backend/app/static (see root Dockerfile), this
# app serves both the API (under /api) and the website (everything else) from one
# process/one Railway service. If app/static doesn't exist (e.g. running the
# backend alone via `backend/Dockerfile` in the two-service setup), this block is
# skipped and only the JSON API responds — nothing breaks either way.
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.isdir(STATIC_DIR):
    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        candidate = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        # Anything else (/, /login, /my-bookings, /admin, deep links, refreshes)
        # falls back to index.html so React Router can take over client-side.
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {"app": settings.APP_NAME, "status": "live"}
