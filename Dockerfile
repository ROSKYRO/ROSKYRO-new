# ============================================================================
# Combined deploy: ONE Railway service runs both the frontend and backend.
# Use this Dockerfile (at repo root) with Root Directory = "." (leave blank)
# on Railway — NOT backend/Dockerfile or frontend/Dockerfile individually.
# ============================================================================

# ---- Stage 1: build the React/Vite frontend into static files ----
FROM node:20-slim AS frontend-build
WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
# No VITE_API_URL set here on purpose: the built app calls same-origin "/api",
# which this combined service serves itself. See frontend/src/api/client.js.
RUN npm run build

# ---- Stage 2: Python backend, serving the API + the built frontend ----
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
# Drop the frontend's built files into app/static — main.py auto-detects this
# folder and serves the site from "/" while the API stays under "/api".
COPY --from=frontend-build /frontend/dist ./app/static

EXPOSE 8000
# Railway injects $PORT at runtime — fall back to 8000 for local `docker run`.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
