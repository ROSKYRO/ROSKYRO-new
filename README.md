# ROSKYRO

A verified, on-demand care & assistance marketplace — customers book background-verified
"Partners" (caregivers/attendants) by the hour for hospital assistance, elder companionship,
and urgent non-medical support. Same business model, flow, and pricing mechanics as the
reference product this was scoped from, rebuilt from scratch under the ROSKYRO brand with
original code, copy, and design.

## Architecture

```
roskyro/
├── backend/     FastAPI + SQLAlchemy REST API
├── frontend/    React (Vite) SPA — mobile-first, PWA-ready, Capacitor-wrappable
└── docker-compose.yml
```

**Why this stack works for "web now, apps later":** the frontend is a plain React SPA that
talks to the backend only over HTTP JSON. That means the exact same frontend build can be:
1. Deployed as a normal website today.
2. Wrapped with **Capacitor** into an installable Android APK / iOS IPA later, with no
   rewrite — see [Mobile app conversion](#mobile-app-conversion-ios--android) below.

## Marketing site (frontend `Home.jsx`)

The landing page (`frontend/src/pages/Home.jsx`) is a full one-page marketing
site, composed from section components in `frontend/src/components/sections/`,
with the same anchors as the reference site's nav:

| Anchor | Section | File |
|---|---|---|
| `#services` | Live service catalogue + pricing | `ServicesSection.jsx` |
| `#story` | Founder story / "why we built this" | `StorySection.jsx` |
| `#how` | 4-step booking flow | `HowItWorksSection.jsx` |
| `#demo` | Scripted WhatsApp-chat playback + "Try it live" | `DemoSection.jsx` |
| `#trust` | 6-step Partner verification | `TrustSection.jsx` |
| `#faq` | Accordion FAQ | `FaqSection.jsx` |
| `#join` | Become a Partner (benefits, eligibility, apply) | `PartnerSection.jsx` |
| `#investor` | Investor/partner outreach | `InvestorSection.jsx` |
| `#complaint` | Complaint/feedback form → `POST /complaints` | `ComplaintSection.jsx` |
| `#terms`, `#privacy` | ToS / Privacy Policy text | `TermsSection.jsx`, `PrivacySection.jsx` |

Also included: `PromiseSection.jsx` (safety promises), `AudienceSection.jsx`
("who we're for"), `CityExpansionSection.jsx` (city waitlist →
`POST /cities/interest`), `AppComingSoonSection.jsx`, `FinalCtaSection.jsx`,
`LaunchBanner.jsx`.

**WhatsApp numbers are placeholders.** All "Book on WhatsApp" / "Apply as a
Partner" / investor CTAs read from `frontend/src/config.js`, which reads
`VITE_WHATSAPP_BOOKING_NUMBER` / `VITE_WHATSAPP_SUPPORT_NUMBER` /
`VITE_SUPPORT_PHONE_DISPLAY` from the environment (see
`frontend/.env.example`). Set your real numbers there before going live — the
reference site's own WhatsApp automation (the actual chatbot that replies on
WhatsApp) is **not** replicated here; ROSKYRO instead has a real in-app
booking flow (`/services`, PIN-secured bookings, `/my-bookings`, `/admin`)
that the reference site doesn't have, reachable via the "Web login" link in
the navbar. Wiring a real WhatsApp Business API bot is listed under
"Extending the system" below.

## Core business logic implemented

- **Service catalogue** with published hourly rates (seeded: Hospital Assist ₹219/hr, Elder
  Companion Care ₹199/hr, 24×7 Urgent Support ₹269/hr — edit freely in the admin API).
- **6-step Partner verification pipeline**: ID, police/background check, references,
  interview, training, photo ID issuance — tracked as discrete checkboxes so admins see
  exactly where each applicant is stuck.
- **PIN-secured booking lifecycle**: `requested → assigned → en_route → awaiting_start_pin →
  in_progress → awaiting_end_pin → completed`. Billing time starts only when the customer
  shares the Start PIN and ends only when they share the End PIN — never before either.
- **Pricing engine** (`backend/app/services/pricing.py`), fully unit-testable and separate
  from the API layer:
  - Bills **actual time worked**, not booked time.
  - Free cushion (default 15 min) past booked time before extra hours are charged.
  - Minimum billable floor: 50% of booked hours normally, 75% for bookings of 4+ hours.
  - Tiered one-time **Arrival Fee** based on distance (GST-exempt).
  - Flat **Return Support Fee** if the service ends at a different location (GST-exempt).
  - GST (18%) applied only to the service charge.
  - Configurable "first hour free" launch-promo discount.
- **Pay-after-service** model: a `Payment` record (status `pending`) is generated
  automatically the moment the End PIN closes a booking; admins mark it `paid` once the UPI
  transfer is confirmed.
- **SOS button** available on any in-progress booking.
- **Complaints/feedback intake**, with safety-category submissions auto-flagged as priority.
- **City waitlist**: customers can register interest in a city ROSKYRO hasn't launched in yet.
- **Admin dashboard API**: booking/revenue/partner/complaint stats in one call.

## Running locally

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
python -m app.seed          # creates tables + seed data + an admin login
uvicorn app.main:app --reload
```

Default seeded admin login: phone `9999999999`, password `admin123` — **change this
immediately** in any real deployment (see [Security checklist](#security-checklist)).

API docs are auto-generated at `http://localhost:8000/docs`.

By default this uses SQLite (`roskyro.db`) so you can try it with zero setup. For anything
beyond local development, set `DATABASE_URL` to a Postgres instance (see `.env.example`).

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Set `VITE_API_URL` (e.g. in a `.env` file in `frontend/`) if your API isn't on
`http://localhost:8000`.

### Both together, via Docker

```bash
docker compose up --build
```

This brings up Postgres + the API on port 8000. Build and deploy the frontend separately
(e.g. to a static host, or add an `nginx` service to this compose file to serve `dist/`).

## Deployment (web)

1. **Backend**: build the provided `backend/Dockerfile` and deploy it (Fly.io, Render,
   Railway, a VPS behind Nginx + systemd, ECS, etc.). Point `DATABASE_URL` at a managed
   Postgres instance. Set a strong random `SECRET_KEY`. Run `python -m app.seed` once
   against the production database to create tables (or switch to Alembic migrations for
   ongoing schema changes — the models are already structured for it).
2. **Frontend**: `npm run build` produces a static `dist/` folder — deploy it to any static
   host (Vercel, Netlify, S3+CloudFront, or Nginx). Set `VITE_API_URL` to your backend's
   public URL at build time.
3. **CORS**: set `CORS_ORIGINS` on the backend to your real frontend domain(s) — don't leave
   it as `["*"]` in production.
4. **Payments**: this scaffold generates a `Payment` record and expects UPI collection to be
   confirmed manually via `/admin/payments/{booking_id}/confirm` (mirroring the "share a UPI
   QR, then confirm on screenshot" flow). To automate this, integrate a UPI/payment gateway
   (Razorpay, Cashfree, etc.) inside `app/routers/admin.py` or a new `payments` router.
5. **Notifications**: booking updates are currently pull-based (the customer refreshes "My
   Bookings"). To replicate WhatsApp-style push updates, add a notification service (e.g.
   the WhatsApp Business API, or SMS/push) triggered from the booking status-change
   endpoints in `app/routers/bookings.py`.

## Deploying on Railway

There are two ways to deploy this on Railway. **Use Option A** — it's simpler (one
service, one URL, no CORS headaches) and is what these instructions assume from here on.

### Option A — Combined (recommended): one Railway service for everything
The root-level `Dockerfile` builds the React frontend and bundles it straight into the
FastAPI backend, which then serves the whole site from `/` and the API from `/api`. One
service, one domain, no CORS setup needed.

1. **Push this repo to GitHub** (see the section above on uploading via GitHub's web UI, or
   `git push` if you're using the command line).
2. **Add Postgres**: in your Railway project, **+ New → Database → Add PostgreSQL**.
   `DATABASE_URL` is generated automatically — you don't set this by hand.
3. **Create the service**: **+ New → GitHub Repo** → select your repo. Leave
   **Settings → Source → Root Directory** blank/empty (it should build from the repo root,
   picking up the root `Dockerfile` and `railway.toml` automatically).
4. **Variables** — add:
   ```
   SECRET_KEY=<a long random string>
   AUTO_SEED=true
   ```
   Then use **"+ New Variable" → "Add Reference"** to link `DATABASE_URL` from the Postgres
   plugin — don't type it by hand.
5. **Settings → Networking → Generate Domain** — this one URL is your entire live site
   (both the website and the API live here, e.g. `https://roskyro.up.railway.app` for the
   site and `https://roskyro.up.railway.app/api/...` for API calls).
6. **Verify**:
   - `https://<your-domain>/` → the ROSKYRO homepage
   - `https://<your-domain>/health` → `{"status":"ok"}`
   - `https://<your-domain>/api/services` → JSON list of the 3 seeded services
   - Admin login (seeded automatically): phone `9999999999` / password `admin123` —
     **change this immediately after your first deploy.**

WhatsApp numbers (`VITE_WHATSAPP_BOOKING_NUMBER` etc.) are baked in at build time. If you
need to change them later, add them as variables on this same service and Railway will
rebuild with the new values (the root `Dockerfile` reads `frontend/.env.example`-style
`VITE_*` vars the same way described in Option B below).

### Option B — Separate services (advanced): independent frontend + backend
Only use this if you specifically want the frontend and backend on different domains/scaling
independently. This uses `backend/Dockerfile` and `frontend/Dockerfile` instead of the root
one, and needs manual CORS configuration between the two.

### 1. Push this repo to GitHub
Railway deploys from a GitHub repo. Push this whole `roskyro/` folder (with `backend/` and
`frontend/` as subfolders) to a new GitHub repo first.

### 2. Create the Postgres database
In your Railway project: **+ New → Database → Add PostgreSQL**. Railway auto-generates a
`DATABASE_URL` — you don't set this manually.

### 3. Create the backend service
**+ New → GitHub Repo** → select your repo → after it's created, go to
**Settings → Root Directory** and set it to `backend`. Railway will detect `backend/Dockerfile`
automatically (via `backend/railway.toml`).

Then in **Variables**, add:
```
SECRET_KEY=<generate a long random string>
CORS_ORIGINS=https://<your-frontend-service>.up.railway.app
AUTO_SEED=true
```
Click **Variables → Reference a variable** (or "Add Variable Reference") to link
`DATABASE_URL` from the Postgres plugin into this service — Railway does this with one click
via its variable-reference picker, so the backend can reach the DB. Don't set `DATABASE_URL`
by hand.

Railway sets `PORT` automatically — the Dockerfile already binds to `$PORT`, nothing to do.
Once deployed, note the backend's public URL (Settings → Networking → Generate Domain), e.g.
`https://roskyro-api.up.railway.app`.

### 4. Create the frontend service
**+ New → GitHub Repo** (same repo again) → **Settings → Root Directory** → `frontend`.
Railway detects `frontend/Dockerfile`.

In **Variables**, add (mark these as build-time variables, since Vite bakes them in at
`npm run build` — Railway does this automatically for any `ARG` declared in the Dockerfile):
```
VITE_API_URL=https://roskyro-api.up.railway.app/api      (the backend URL from step 3, with /api)
VITE_WHATSAPP_BOOKING_NUMBER=91XXXXXXXXXX
VITE_WHATSAPP_SUPPORT_NUMBER=91XXXXXXXXXX
VITE_SUPPORT_PHONE_DISPLAY=+91 XXXXX XXXXX
```
Generate a domain for this service too (Settings → Networking → Generate Domain) — this is
the URL your users will actually visit.

### 5. Close the loop
Go back to the **backend** service's `CORS_ORIGINS` variable and set it to the frontend's
real generated domain (step 4), then redeploy the backend so it accepts requests from it.

### 6. Verify
- Backend: `https://<backend-domain>/health` → `{"status":"ok"}`
- Backend docs: `https://<backend-domain>/docs`
- Frontend: open the frontend domain — the homepage should load and the Hero section's
  live-pricing box should show the three seeded services (confirms the frontend is reaching
  the backend and CORS is correct).
- Admin login seeded automatically: phone `9999999999` / password `admin123` —
  **change this immediately** by logging into `/admin` or updating it directly via the API.

### Custom domain
Once `roskyro.in`-style domains are ready, add them under each service's
**Settings → Networking → Custom Domain**, point your DNS `CNAME` at the value Railway gives
you, then update `VITE_API_URL` (frontend, Option B only) and `CORS_ORIGINS` (backend, Option
B only) to the final domains and redeploy both. For Option A, just add the custom domain to
the single service — nothing else to update.

## Mobile app conversion (iOS & Android)

The frontend is a plain static SPA, which makes wrapping it as simple as:

```bash
cd frontend
npm run build                 # produces dist/
npm install -D @capacitor/core @capacitor/cli
npx cap init roskyro in.roskyro.app --web-dir=dist
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npx cap copy                  # copies dist/ into the native shells
npx cap open android          # opens Android Studio to build/sign an APK/AAB
npx cap open ios              # opens Xcode to build/sign an IPA (needs macOS + Apple dev account)
```

Notes:
- Point `VITE_API_URL` at your **public** backend URL before running `npm run build` for
  mobile — the app on a phone can't reach `localhost`.
- The `public/manifest.json` and viewport meta tags are already in place so the app behaves
  like an installable PWA even before you wrap it with Capacitor.
- For push notifications, live Partner tracking, or native camera access (e.g. photo ID
  capture during Partner onboarding) later, add the relevant Capacitor plugins
  (`@capacitor/push-notifications`, `@capacitor/geolocation`, `@capacitor/camera`).
- Re-run `npx cap copy` (or `npx cap sync`) every time you rebuild the web app to push the
  latest frontend into the native projects.

## Security checklist before going live

- [ ] Change the seeded admin password immediately.
- [ ] Set a long random `SECRET_KEY` (never commit it).
- [ ] Restrict `CORS_ORIGINS` to real domains.
- [ ] Move off SQLite to Postgres.
- [ ] Add rate limiting on `/auth/login` and `/auth/signup`.
- [ ] Add Alembic migrations instead of `create_all` for schema changes.
- [ ] Put the API behind HTTPS (Let's Encrypt/managed cert) end to end.
- [ ] Review the pricing constants in `app/core/config.py` against your actual city rates
      before launch — they're seeded to match a specific reference model and will need
      updating for your market.

## Extending the system

- **Real-time tracking**: add a WebSocket or polling endpoint reporting the assigned
  Partner's live location during `en_route`.
- **Multi-city**: the `City` model and `/cities` endpoints already support this — surface a
  city selector in the frontend and filter services/agents by `city_id`.
- **Ratings**: the `Review` model exists; add a `POST /bookings/{id}/review` endpoint and a
  post-completion prompt in the frontend.
- **Payouts to Partners**: add a `Payout` model and a weekly batch job that sums each
  Partner's completed-booking earnings.
- **Real WhatsApp bot**: the `#demo` section on the homepage is a scripted client-side
  playback for illustration only. To actually take bookings over WhatsApp (as the
  reference product does), integrate the WhatsApp Business Cloud API (or a BSP like
  Gupshup/Interakt) with a webhook that creates `Booking` rows via the existing
  `POST /bookings` endpoint.
- **Reviews on the homepage**: the reference site's Instagram/testimonial content isn't
  replicated (no real customer content exists yet) — add real reviews once you have them.

## What's intentionally not built yet

- Real WhatsApp Business API bot (see above) — CTAs currently deep-link to `wa.me` with a
  pre-filled message; a human (or you) replies manually until the bot is wired up.
- Payment gateway integration — UPI collection is confirmed manually in the admin panel
  (`POST /admin/payments/{booking_id}/confirm`), same as the reference model's pilot phase.
  See "Payments" under Deployment above for adding Razorpay/Cashfree.
  - Live Partner GPS tracking during `en_route` (flagged under "Real-time tracking" above).
- Native iOS/Android builds — the frontend is Capacitor-ready (see "Mobile app conversion"
  above) but the actual `npx cap add ios/android` step, app-store listings, icons and
  signing have not been run; that's a manual one-time step you do locally/on a Mac.
- Company legal registration details (GSTIN, registered address) — placeholders in
  `TermsSection.jsx` (`GSTIN_PLACEHOLDER` in `config.js`) — fill in once ROSKYRO is
  registered.
