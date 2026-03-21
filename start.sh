#!/bin/bash
set -e

echo ""
echo "==========================================="
echo "  ClearMed - Starting up..."
echo "==========================================="
echo ""

cd "$(dirname "$0")"

echo "[1/3] Starting Docker services (first run: 5-10 mins)..."
docker-compose up --build -d

echo ""
echo "[2/3] Waiting 45 seconds for all services..."
sleep 45

echo ""
echo "[3/3] Loading sample data..."
docker exec clearmed-backend npm run seed && echo "  ✅ Hospitals loaded" || echo "  ⚠ Seed already done"
docker exec clearmed-backend npm run seed:admin && echo "  ✅ Admin created" || echo "  ⚠ Admin already exists"

echo ""
echo "==========================================="
echo "  ✅ ClearMed is RUNNING!"
echo "==========================================="
echo ""
echo "  🌐  Website:  http://localhost:3000"
echo "  🔧  Admin:    http://localhost:3000/admin/analytics"
echo "  📡  API:      http://localhost:4000/health"
echo ""
echo "  Login: admin@clearmed.in"
echo "  Pass:  ClearMed@Admin2025!"
echo ""
echo "  Extra setup (run in a new terminal):"
echo "  docker exec clearmed-backend npm run trends:build"
echo "  docker exec clearmed-backend npm run scores:recalc"
echo "  curl -X POST http://localhost:4000/api/insurance/seed-demo"
echo ""
