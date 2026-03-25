@echo off
echo.
echo  =========================================
echo    ClearMed - Starting up (Local)
echo  =========================================
echo.

cd /d "%~dp0"

echo [0/2] Cleaning up existing processes...
FOR /F "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
FOR /F "tokens=5" %%a in ('netstat -aon ^| findstr :4000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo [1/2] Starting Backend (Port 4000)...
start "ClearMed Backend" cmd /k "cd backend && npm run dev"

echo [2/2] Starting Frontend (Port 3000)...
start "ClearMed Frontend" cmd /k "cd frontend && npm run dev -- -H 0.0.0.0"

echo.
echo  =========================================
echo    Services are starting in new windows!
echo  =========================================
echo.
FOR /F "tokens=2 delims=:" %%A in ('ipconfig ^| findstr IPv4') do set ip=%%A
set IPv4=%ip: =%
echo   Website:  http://localhost:3000
echo   Network:  http://%IPv4%:3000
echo   Admin:    http://localhost:3000/admin/analytics
echo   API:      http://localhost:4000/health
echo.
echo   Login: admin@clearmed.online
echo   Pass:  ClearMed@Admin2026
echo.
pause
