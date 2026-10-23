# 🚀 Deployment Guide: Vercel & Render Compatibility

Suraksha is fully pre-configured for seamless, zero-friction deployment to **Vercel** and **Render**.

You can deploy using any of the following architectures:
- **Architecture A (Recommended / Gold Standard):** Frontend on **Vercel** (Edge CDN) + Backend on **Render** (Python Web Service).
- **Architecture B (Automated Render Blueprint):** Both Frontend & Backend deployed on **Render** via [`render.yaml`](./render.yaml).
- **Architecture C (Full-Stack Vercel):** Frontend + Python Serverless Functions deployed on **Vercel** via [`vercel.json`](./vercel.json).
- **Architecture D (Docker Container):** Single unified container for Render, Railway, or Fly.io via [`Dockerfile`](./Dockerfile).

---

## 📋 Architecture Comparison

| Feature | Architecture A (Vercel + Render) | Architecture B (Render Blueprint) | Architecture C (All-on-Vercel) |
| :--- | :--- | :--- | :--- |
| **Frontend Host** | Vercel (Edge CDN) | Render Static Site | Vercel Static |
| **Backend Host** | Render Web Service | Render Web Service | Vercel Serverless Functions |
| **Execution Model** | Long-running Uvicorn process | Long-running Uvicorn process | AWS Lambda (Serverless) |
| **Execution Time Limit** | None (ideal for simulations) | None (ideal for simulations) | 10s (Free) / 60s (Pro) |
| **Database** | SQLite or Render PostgreSQL | SQLite or Render PostgreSQL | SQLite in `/tmp` or Remote PostgreSQL |
| **Setup Effort** | 2 clicks | 1 click via `render.yaml` | 1 click via `vercel.json` |

---

## 1️⃣ Deploying on Render

### Method 1: Instant Blueprint Deployment (Recommended)
1. Push your repository to **GitHub**.
2. Log in to [dashboard.render.com](https://dashboard.render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically read [`render.yaml`](./render.yaml) and configure two services:
   - **`suraksha-backend`**: Python FastAPI Web Service running Uvicorn.
   - **`suraksha-frontend`**: Vite React Static Site with automatic SPA rewrite and configured `VITE_API_BASE_URL`.
6. Click **Apply**.
7. *(Optional)* In `suraksha-backend` **Environment**, add:
   - `OPENWEATHER_API_KEY` (optional for live weather)
   - `GEMINI_API_KEY` (optional for live Gemini AI explanations)

---

### Method 2: Manual Web Service Deployment on Render
If deploying just the backend service to Render:
1. Click **New +** → **Web Service**.
2. Select your repository.
3. Configure the settings:
   - **Name:** `suraksha-backend`
   - **Language:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
4. Deploy! Your backend URL will be `https://<your-service>.onrender.com`.

---

## 2️⃣ Deploying on Vercel

### Method 1: Full-Stack on Vercel (Monorepo)
1. Push your repository to **GitHub**.
2. Log in to [vercel.com](https://vercel.com/) and click **Add New...** → **Project**.
3. Select your repository.
4. Leave **Root Directory** as `./` (the root).
5. Vercel will automatically detect [`vercel.json`](./vercel.json):
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Output Directory:** `frontend/dist`
   - **API Functions:** `api/index.py` (bundles `backend/**`)
6. Click **Deploy**.

---

### Method 2: Frontend-Only on Vercel (paired with Render Backend)
1. Follow **1️⃣ Deploying on Render** to deploy your backend first and copy its live URL (e.g. `https://suraksha-backend.onrender.com`).
2. In Vercel, import the repository.
3. In **Project Settings**:
   - Set **Root Directory** to `frontend`.
   - Add Environment Variable:
     - **Key:** `VITE_API_BASE_URL`
     - **Value:** `https://suraksha-backend.onrender.com`
4. Click **Deploy**.
5. Your frontend is live with Edge CDN speeds and automatically talks to your Render FastAPI backend!

---

## 3️⃣ Deploying via Docker (Render / Railway / Self-Hosted)

A production-ready multi-stage [`Dockerfile`](./Dockerfile) is included:
- It builds the Vite React client into static assets.
- Installs Python dependencies and runs FastAPI on port `10000` (or `$PORT`).
- Serves both the backend API (`/api/*`) and the frontend single-page application (`/`) in one container.

To build and run locally with Docker:
```bash
docker build -t suraksha .
docker run -p 10000:10000 -e PORT=10000 suraksha
```
Visit `http://localhost:10000` in your browser.

---

## 🔑 Environment Variables Reference

| Variable | Scope | Required | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Frontend | No (default: `/api`) | URL of the backend API (e.g. `https://suraksha-backend.onrender.com` or `/api`). |
| `ALLOWED_ORIGINS` | Backend | No (default: `*`) | Comma-separated allowed CORS origins (e.g. `https://your-app.vercel.app`). |
| `DATABASE_URL` | Backend | No | Optional PostgreSQL connection string (auto-detected on Render if Postgres attached). Falls back to SQLite. |
| `OPENWEATHER_API_KEY` | Backend & Frontend | No | API key for live real-time precipitation and weather hazard overlays. |
| `GEMINI_API_KEY` | Backend | No | API key for live Gemini evacuation debriefing and AI explanation. |
| `PORT` | Backend | No (default: `10000`) | Port for the Uvicorn ASGI server. |

---

## 🩺 Health Check & API Verification

Once deployed, you can verify your service health at:
- Root info: `https://<your-backend>/` or `https://<your-backend>/api`
- Health check: `https://<your-backend>/health` or `https://<your-backend>/api/health`
- Interactive Swagger docs: `https://<your-backend>/api/docs`
