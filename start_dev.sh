#!/usr/bin/env bash
echo "==================================================="
echo "  ReliefNet (Bangladesh Flood Relief Platform)"
echo "  Starting Local Development Environment..."
echo "==================================================="

echo ""
echo "[1/3] Checking / Seeding database..."
python scripts/seed_demo_data.py

echo ""
echo "[2/3] Starting FastAPI Backend on http://localhost:8000 ..."
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload &

echo ""
echo "[3/3] Starting React Frontend on http://localhost:5173 ..."
cd frontend && npm run dev &

wait
