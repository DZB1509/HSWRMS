# HSWRMS — Local Development (one command)

Get the full app (backend + frontend) running locally in a couple of minutes.
No SQL Server, no database setup, and no manual SMTP/JWT configuration required.

## Prerequisites
- **Git**
- **Java 17** (JDK) — `java -version` should show 17
- **Node.js** (LTS; includes `npm`)

That's it. Do **not** install SQL Server or create a database — the backend runs on an in-memory H2 database.

## Clone
```powershell
git clone https://gitlab.com/manhnc2/fal26-isp392-is2005-g1.git
cd fal26-isp392-is2005-g1
git checkout feature/hswrms-m1-m6-integration
```

## Start everything (one command)
From the **repository root**:
```powershell
.\run-project.ps1
```
If PowerShell blocks the script (execution policy), run:
```powershell
powershell -ExecutionPolicy Bypass -File .\run-project.ps1
```

This opens the **backend** in a new PowerShell window and starts the **frontend** in the current one. Dependency install (`npm ci`) runs automatically only if `node_modules` is missing.

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080/api/v1 (health: `/api/v1/health`)

## Try registration + login
1. Open http://localhost:5173
2. Register with **your own email**.
3. A **Gmail OTP** is sent automatically (SMTP is pre-configured for local dev — no setup).
4. Enter the OTP to verify, then log in.

## Stop
- **Backend:** close the separate backend PowerShell window (or press `Ctrl+C` in it).
- **Frontend:** press `Ctrl+C` in the window running `npm run dev`.

## Important
- The backend uses an **in-memory H2 database**: all data (accounts, OTPs, health profiles) **resets every time the backend stops**. Re-register after a restart.
