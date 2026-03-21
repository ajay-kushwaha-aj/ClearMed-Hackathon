@echo off
echo.
echo  =========================================
echo    ClearMed - Starting up...
echo  =========================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Docker services (first run: 5-10 mins)...
docker-compose up --build -d

echo.
echo [2/3] Waiting 45 seconds for services to be ready...
timeout /t 45 /nobreak > nul

echo.
echo [3/3] Loading sample data...
docker exec clearmed-backend npm run seed
docker exec clearmed-backend npm run seed:admin

echo.
echo  =========================================
echo    ClearMed is RUNNING!
echo  =========================================
echo.
echo   Website:  http://localhost:3000
echo   Admin:    http://localhost:3000/admin/analytics
echo   API:      http://localhost:4000/health
echo.
echo   Login: admin@clearmed.in
echo   Pass:  ClearMed@Admin2025!
echo.
echo  --- Run these in a NEW window for full setup ---
echo   docker exec clearmed-backend npm run trends:build
echo   docker exec clearmed-backend npm run scores:recalc
echo.
echo  Note: Insurance seed - use this in PowerShell:
echo   Invoke-WebRequest -Uri http://localhost:4000/api/insurance/seed-demo -Method POST
echo.
pause
