# ClearMed — Setup Guide

## Prerequisites
- **Node.js** v18+ → [https://nodejs.org](https://nodejs.org)
- **Git** (optional) → [https://git-scm.com](https://git-scm.com)

## Step-by-step Setup

### 1. Install Dependencies
Open a terminal/command prompt in the project folder and run:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Environment
The `.env` files are already included. If you need to change the database, edit:
- `backend/.env` → `DATABASE_URL`

### 3. Set Up the Database
```bash
cd backend
npx prisma generate
npx prisma db push
```
> This syncs the schema to the cloud Supabase database.

### 4. (Optional) Seed Sample Data
```bash
cd backend
npm run seed
npm run seed:admin
```
> **Admin login:** `admin@clearmed.online` / `ClearMed@Admin2026`

### 5. Start the App
**Windows:** Double-click `start-local.bat`

**Manual (any OS):**
```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

### 6. Open in Browser
- **Website:** https://www.clearmed.online/
- **Admin Panel:** https://www.clearmed.online/admin/analytics
- **API Health:** https://www.clearmed.online/health

## Project Structure
```
clearmed/
├── backend/          # Express + Prisma API (Port 4000)
│   ├── prisma/       # Database schema
│   ├── src/routes/   # API endpoints
│   └── .env          # Backend config
├── frontend/         # Next.js App (Port 3000)
│   ├── src/app/      # Pages
│   ├── src/components/
│   └── public/       # Static assets (logo, etc.)
├── start-local.bat   # One-click Windows launcher
└── SETUP.md          # This file
```

## Key Environment Variables (backend/.env)
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection |
| `JWT_SECRET` | Auth token signing |
| `RESEND_API_KEY` | Email delivery (OTP verification) |
| `PORT` | Backend port (default: 4000) |

## Troubleshooting
- **Port in use?** The `start-local.bat` auto-kills old processes on ports 3000/4000.
- **Prisma errors?** Run `npx prisma generate` in the `backend` folder.
- **Email not sending?** Check `RESEND_API_KEY` in `backend/.env`. Free tier only sends to verified domains.
