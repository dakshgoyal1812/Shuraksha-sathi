import os
import sys
import time
import asyncio
import urllib.request
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
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

START_TIME = time.time()

# Ensure tables and seed data are created on cold start
try:
    Base.metadata.create_all(bind=engine)
    seed_database(force=False)
except Exception as e:
    print(f"Cold start init notice: {e}")

async def keep_alive_background_worker():
    """
    Background worker that runs every 10 minutes to ping the service.
    This prevents Render free-tier instances from spinning down due to inactivity.
    """
    # Wait 2 minutes after startup before first ping
    await asyncio.sleep(120)
    
    while True:
        ping_url = os.environ.get("RENDER_EXTERNAL_URL") or os.environ.get("KEEP_ALIVE_URL")
        if ping_url:
            if not ping_url.startswith("http"):
                ping_url = f"https://{ping_url}"
            target = f"{ping_url.rstrip('/')}/health"
            try:
                def _do_ping():
                    req = urllib.request.Request(
                        target,
                        headers={"User-Agent": "Suraksha-Internal-KeepAlive/1.0"}
                    )
                    with urllib.request.urlopen(req, timeout=30) as resp:
                        return resp.status
                status = await asyncio.to_thread(_do_ping)
                print(f"[KeepAlive] Self-ping to {target} succeeded with status {status}")
            except Exception as e:
                print(f"[KeepAlive] Self-ping to {target} notice: {e}")
        
        # Ping every 10 minutes (600 seconds) - Render sleeps after 15 min idle
        await asyncio.sleep(600)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        seed_database(force=False)
    except Exception as e:
        print(f"Lifespan DB init notice: {e}")

    # Launch background keep-alive worker to prevent Render sleep
    keep_alive_task = asyncio.create_task(keep_alive_background_worker())
    try:
        yield
    finally:
        keep_alive_task.cancel()
        try:
            await keep_alive_task
        except asyncio.CancelledError:
            pass

app = FastAPI(
    title="SurakshaSathi — Intelligent Disaster Evacuation Planning API",
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

# API Root (GET and HEAD for lightweight pings)
@app.api_route("/", methods=["GET", "HEAD"])
@app.api_route("/api", methods=["GET", "HEAD"])
def api_root():
    return {
        "status": "online",
        "service": "SurakshaSathi Engine API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/health",
        "cron_keep_alive": "/cron/keep-alive"
    }

# Ultra-reliable zero-fail Healthcare & Keep-Alive endpoints
# Compatible with cron-job.org, Render health checks, Vercel, UptimeRobot, BetterUptime
@app.api_route("/health", methods=["GET", "HEAD"])
@app.api_route("/healthz", methods=["GET", "HEAD"])
@app.api_route("/ping", methods=["GET", "HEAD"])
@app.api_route("/api/health", methods=["GET", "HEAD"])
@app.api_route("/cron/keep-alive", methods=["GET", "HEAD"])
@app.api_route("/cronjob", methods=["GET", "HEAD"])
def health_check(request: Request, check_db: bool = False):
    """
    Ultra-reliable, zero-downtime health & keep-alive endpoint for cron-job.org and Render.
    Guaranteed HTTP 200 response with zero database dependencies by default.
    Includes anti-cache headers so every ping reaches the container and prevents sleep.
    """
    uptime_sec = round(time.time() - START_TIME, 1)
    
    db_status = "unverified"
    if check_db:
        try:
            from sqlalchemy import text
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception as e:
            db_status = f"warning: {e}"

    payload = {
        "status": "healthy",
        "service": "SurakshaSathi Engine",
        "version": "1.0.0",
        "fictional_town": "Greenfield City",
        "uptime_seconds": uptime_sec,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "keep_alive": "active",
        "render_sleep_prevention": "enabled",
        "cronjob_status": "ok",
        "database": db_status
    }

    response = JSONResponse(content=payload, status_code=200)
    # Strictly disable caching across CDNs, proxies, and cloud routers
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["X-Render-KeepAlive"] = "true"
    response.headers["X-CronJob-Status"] = "ok"
    return response

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
        # Do not intercept API, health, keep-alive, or documentation routes
        if (
            full_path == "api"
            or full_path.startswith("api/")
            or full_path in {"health", "healthz", "ping", "cronjob"}
            or full_path.startswith(("health/", "cron/"))
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


