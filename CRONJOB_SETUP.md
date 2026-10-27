# ⏰ 24/7 Render Keep-Alive Setup (cron-job.org)

Render free-tier Web Services automatically go to sleep (spin down) after **15 minutes of inactivity**. The next request then takes **30–50 seconds** (cold start) to wake the server up.

By setting up a free cron job on [cron-job.org](https://cron-job.org), your Render backend receives a lightweight ping every **10 minutes**, keeping it **awake 24/7/365 with ZERO downtime and zero cold starts**.

---

## 🚀 Quick Setup on cron-job.org (2 Minutes)

### Step 1: Create a Free Account
1. Open [https://cron-job.org](https://cron-job.org/en/signup/) in your browser.
2. Sign up with your email (it's completely free forever).

---

### Step 2: Create a New Cronjob
1. In the cron-job.org dashboard, click the **"CREATE CRONJOB"** button in the top right.
2. Fill in the following exact settings:

| Field | Value | Why |
| :--- | :--- | :--- |
| **Title** | `Suraksha Render Keep-Alive 24/7` | Any descriptive title |
| **URL** | `https://<YOUR-BACKEND-NAME>.onrender.com/health` | The ultra-lightweight keep-alive endpoint |
| **Schedule** | **Every 10 minutes** (`*/10 * * * *`) | **Crucial:** Render sleeps after 15 min; 10 min guarantees it **never** sleeps |
| **Request Method** | `GET` | Standard lightweight HTTP probe |
| **Request Timeout** | `30 seconds` or `60 seconds` | Prevents false failures if Render is under load |
| **Redirects** | Follow redirects (enabled by default) | Ensures smooth resolution |

> [!TIP]
> Alternative valid endpoints supported by the backend:
> - `https://<YOUR-BACKEND-NAME>.onrender.com/health`
> - `https://<YOUR-BACKEND-NAME>.onrender.com/cron/keep-alive`
> - `https://<YOUR-BACKEND-NAME>.onrender.com/ping`
> - `https://<YOUR-BACKEND-NAME>.onrender.com/api/health`

---

### Step 3: Advanced Settings (Recommended for Zero Failure)
In the cron-job creation form under **Advanced**:
1. **HTTP Headers (Optional)**:
   - Header Name: `User-Agent`
   - Header Value: `cron-job.org-keepalive`
2. **Failure notifications**:
   - Enable notifications only if it fails **3 consecutive times** (avoids spam from transient cloud hiccups).
3. Click **"CREATE"** to save.

---

## 🛡️ Why This Endpoint Will NEVER Fail (`cronjob.org fail na ho`)

We designed the `/health` and `/cron/keep-alive` endpoints with extreme resilience:

1. **Zero Database Blockers:**
   - The keep-alive probe does NOT wait on database queries or locks. It responds in `< 5ms`, so it will never time out.
2. **Anti-Caching Headers:**
   - Returns `Cache-Control: no-cache, no-store, must-revalidate`.
   - Edge CDNs (Cloudflare, Render proxies) cannot cache the response, ensuring every single ping reaches your container to keep the CPU awake.
3. **Multi-Method Support:**
   - Supports both `GET` and `HEAD` requests. If cron-job.org sends a `HEAD` request, it receives an instant `200 OK`.
4. **Built-in Automatic Self-Pinger (Double Shield):**
   - Render automatically injects the `RENDER_EXTERNAL_URL` environment variable.
   - The FastAPI backend includes a built-in background worker (`keep_alive_background_worker`) that also pings itself every 10 minutes.
   - Even if cron-job.org experiences network lag, the internal self-pinger keeps the service running 24/7.

---

## 🔍 How to Test

You can test the endpoint right now in your terminal or browser:

```bash
curl -I https://<YOUR-BACKEND-NAME>.onrender.com/health
```

Expected Output:
```http
HTTP/1.1 200 OK
content-type: application/json
cache-control: no-cache, no-store, must-revalidate, max-age=0
x-render-keepalive: true
x-cronjob-status: ok
```

JSON Response:
```json
{
  "status": "healthy",
  "service": "EvacuSafe Engine",
  "version": "1.0.0",
  "fictional_town": "Greenfield City",
  "uptime_seconds": 3600.0,
  "timestamp": "2026-10-24T04:30:00Z",
  "keep_alive": "active",
  "render_sleep_prevention": "enabled",
  "cronjob_status": "ok",
  "database": "unverified"
}
```
