import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .seed_data import seed_database
from .api import (
    scenarios,
    shelters,
    simulations,
    analytics,
    compare,
    reports,
    map_api,
    ai,
    weather
)


# Ensure tables and seed data are created on cold start
try:
    Base.metadata.create_all(bind=engine)
    seed_database(force=False)
except Exception as e:
    print(f"Cold start init notice: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_database(force=False)
    yield

app = FastAPI(
    title="EvacuSafe — Intelligent Disaster Evacuation Planning API",
    description="Software-only agent-based disaster evacuation simulation and route optimization engine.",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS configuration - supports Vercel, Render, custom domains, and local dev
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "").strip()
if allowed_origins_env and allowed_origins_env != "*":
    origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]
    allow_credentials = True
else:
    origins = ["*"]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Root & Health endpoints (supports Render /health and Vercel /api/health)
@app.get("/")
@app.get("/api")
def api_root():
    return {
        "status": "online",
        "service": "EvacuSafe Engine API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/health"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EvacuSafe Engine",
        "version": "1.0.0",
        "fictional_town": "Greenfield City"
    }

# Include API Routers
app.include_router(scenarios.router)
app.include_router(shelters.router)
app.include_router(simulations.router)
app.include_router(analytics.router)
app.include_router(compare.router)
app.include_router(reports.router)
app.include_router(map_api.router)
app.include_router(ai.router)
app.include_router(weather.router)

# Optional Static File Serving for unified deployments (e.g. Render Web Service or Docker)
FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)
if os.path.exists(FRONTEND_DIST):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        # Do not intercept API or documentation routes
        if (
            full_path == "api"
            or full_path.startswith("api/")
            or full_path == "health"
            or full_path.startswith("health/")
            or full_path == "docs"
            or full_path == "openapi.json"
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        target = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(target):
            return FileResponse(target)

        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)

        raise HTTPException(status_code=404, detail="Frontend asset not found")


