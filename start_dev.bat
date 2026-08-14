@echo off
echo ===================================================
echo   ReliefNet (Bangladesh Flood Relief Platform)
echo   Starting Local Development Environment...
echo ===================================================

echo.
echo [1/3] Checking / Seeding database...
.\.venv\Scripts\python.exe scripts\seed_demo_data.py

echo.
echo [2/3] Starting FastAPI Backend on http://localhost:8000 ...
start "ReliefNet Backend" cmd /k ".\.venv\Scripts\uvicorn.exe backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [3/3] Starting React Frontend on http://localhost:5173 ...
cd frontend
start "ReliefNet Frontend" cmd /k "npm run dev"

echo.
echo ReliefNet is up and running!
echo Web UI: http://localhost:5173
echo API Docs: http://localhost:8000/api/v1/docs
echo ===================================================
