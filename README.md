# ClearMed — Healthcare Cost Transparency Platform

Transparent Healthcare Decisions. Compare verified hospital costs, check insurance coverage, and make informed healthcare choices across India.

---

## Quick Start (3 Steps)

**Step 1 — Make sure Docker Desktop is running** (green icon in taskbar)

**Step 2 — On Mac:**
```bash
cd clearmed
bash start.sh
```

**On Windows:** Double-click `start.bat`

**Step 3 — Wait 5-8 minutes for first build, then open:**
- 🌐 Website: http://localhost:3000
- 🔧 Admin:   http://localhost:3000/admin/analytics
- 📡 API:     http://localhost:4000/health

Admin login: `admin@clearmed.in` / `ClearMed@Admin2025!`

---

## Load Sample Data (run once after first start)

```bash
docker exec clearmed-backend npm run seed
docker exec clearmed-backend npm run seed:admin
docker exec clearmed-backend npm run trends:build
docker exec clearmed-backend npm run scores:recalc
curl -X POST http://localhost:4000/api/insurance/seed-demo
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ | 64-char secret — get from https://generate-secret.vercel.app/64 |
| `ANTHROPIC_API_KEY` | Optional | AI symptom analyzer — https://console.anthropic.com |
| `SMTP_HOST/USER/PASS` | Optional | Email notifications — https://resend.com |
| `MSG91_API_KEY` | Optional | SMS in India |

---

## Project Structure

```
clearmed/
├── backend/                    Node.js + Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma       24 database tables
│   │   └── seed.ts             Sample data (28 hospitals, 29 treatments)
│   ├── src/
│   │   ├── index.ts            App entry point
│   │   ├── lib/                Core services
│   │   ├── middleware/         Auth, security, error handling
│   │   ├── routes/             20 API route files
│   │   ├── jobs/               Nightly cron jobs
│   │   └── scripts/            CLI tools
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/                   Next.js 14 + Tailwind CSS
│   ├── public/
│   │   ├── manifest.json       PWA config
│   │   └── sw.js               Service Worker (offline)
│   ├── src/
│   │   ├── app/                22 pages
│   │   ├── components/         8 reusable components
│   │   └── lib/api.ts          API client
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml          Starts everything: DB + Redis + Backend + Frontend
├── start.sh                    Mac one-click launcher
└── start.bat                   Windows one-click launcher
```

---

## All Pages

| URL | Description |
|-----|-------------|
| `/` | Homepage |
| `/search` | Find hospitals by treatment + city |
| `/hospitals/[id]` | Hospital detail, costs, doctors, reviews |
| `/compare` | Side-by-side hospital comparison |
| `/symptoms` | AI symptom analyzer |
| `/insurance` | Cashless hospitals + coverage estimator |
| `/dashboard` | Cost Intelligence Dashboard |
| `/treatments/[slug]` | SEO treatment landing pages |
| `/community` | Patient reviews |
| `/leaderboard` | Gamification leaderboard |
| `/contribute` | User profile + referral system |
| `/upload` | Upload hospital bill |
| `/partner` | Hospital Partner Program |
| `/pricing` | Pricing plans |
| `/b2b` | B2B Data API |
| `/privacy` | Privacy Policy (DPDP Act 2023) |
| `/terms` | Terms of Service |
| `/offline` | PWA offline fallback |
| `/admin/analytics` | Admin dashboard |
| `/admin/import` | Hospital CSV import |

---

## Stop / Restart

```bash
# Stop
docker-compose down

# Start again (fast, no rebuild)
docker-compose up

# Rebuild (after code changes)
docker-compose up --build
```

---

© 2025 ClearMed Health Technologies Pvt. Ltd.
Medical disclaimer: ClearMed does not provide medical diagnosis or advice.
