# ClearMed — Windows Setup Guide

## Prerequisites (install once)

1. **Docker Desktop for Windows**
   - Download: https://www.docker.com/products/docker-desktop
   - Install and restart your computer
   - Open Docker Desktop → wait for green "Engine running" status

## Running ClearMed

### Option A — Double-click (easiest)
Just double-click `start.bat` inside the `clearmed` folder.

### Option B — PowerShell manual steps

Open PowerShell, navigate to the clearmed folder:
```powershell
cd "C:\path\to\clearmed"
```

Start all services:
```powershell
docker-compose up --build -d
```

Wait 45 seconds, then load sample data:
```powershell
docker exec clearmed-backend npm run seed
docker exec clearmed-backend npm run seed:admin
```

Load extra data (PowerShell-compatible commands):
```powershell
docker exec clearmed-backend npm run trends:build
docker exec clearmed-backend npm run scores:recalc
Invoke-WebRequest -Uri http://localhost:4000/api/insurance/seed-demo -Method POST
```

## Open ClearMed

| What | URL |
|------|-----|
| 🌐 Website | http://localhost:3000 |
| 🔧 Admin Panel | http://localhost:3000/admin/analytics |
| 📡 API Health | http://localhost:4000/health |

**Admin login:**
- Email: `admin@clearmed.in`
- Password: `ClearMed@Admin2025!`

## Stop / Start

```powershell
# Stop everything
docker-compose down

# Start again next time (fast, under 30 seconds)
docker-compose up -d

# Rebuild after code changes
docker-compose up --build -d
```

## If something goes wrong

### "Port already in use" error
ClearMed uses ports 3000, 4000, 5433, 6380 (non-standard to avoid conflicts).
If you still get conflicts:
```powershell
# Find what's using the port (example: 3000)
netstat -ano | findstr :3000
# Kill it by PID
taskkill /PID <PID_NUMBER> /F
```

### "No such container: clearmed-backend"
The container isn't running yet. Check if build is still happening:
```powershell
docker ps -a
docker-compose logs backend
```

### Postgres exits immediately
```powershell
# Clean everything and start fresh
docker-compose down -v
docker-compose up --build -d
```

### curl doesn't work in PowerShell
Don't use `curl`. Use `curl.exe` or `Invoke-WebRequest`:
```powershell
# Instead of: curl -X POST http://localhost:4000/api/insurance/seed-demo
# Use:
Invoke-WebRequest -Uri http://localhost:4000/api/insurance/seed-demo -Method POST
# Or:
curl.exe -X POST http://localhost:4000/api/insurance/seed-demo
```

## Check everything is running

```powershell
docker ps
```

You should see 4 containers:
```
NAMES                STATUS
clearmed-frontend    Up
clearmed-backend     Up
clearmed-redis       Up
clearmed-postgres    Up
```

If all 4 show "Up" → ClearMed is working! Open http://localhost:3000
