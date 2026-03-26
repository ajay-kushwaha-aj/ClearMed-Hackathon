# ClearMed — Smarter Choices. Better Care.

> India's first open healthcare cost transparency platform — built on real patient bill data.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4-green?logo=express)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange?logo=google)](https://ai.google.dev)

---

## What is ClearMed?

ClearMed is a full-stack healthcare transparency platform that lets Indian patients **compare real hospital costs**, **analyze symptoms with AI**, **understand medical reports instantly**, and **find cashless insurance hospitals** — all in one place.

Every cost figure shown is derived from verified, anonymized patient-submitted bills. No estimates. No guesses. Real data from real patients.

---

## Key Features

### For Patients
- **Hospital Cost Comparison** — Compare treatment costs across 28+ hospitals in Delhi, Mumbai & Bengaluru, backed by verified bills
- **AI Symptom Analyzer** — Describe symptoms in plain language; get matched conditions, specialists, and relevant hospitals (powered by Gemini AI)
- **Medical Report Analyzer** — Upload any lab report or diagnostic document; get an instant AI-powered plain-language explanation in 10 Indian languages
- **Insurance Intelligence** — Find cashless hospitals for your insurer and estimate how much your policy actually covers
- **Cost Intelligence Dashboard** — Live cost trends, govt vs private comparisons, and city-wise breakdowns
- **Hospital Comparison Tool** — Side-by-side radar chart comparisons of up to 4 hospitals

### For Contributors
- **Bill Upload with OCR** — Upload your hospital bill; Tesseract + Google Vision auto-extracts cost data
- **PII Auto-Removal** — Patient name, Aadhaar, PAN, phone, address are stripped before any data is stored
- **Points & Gamification** — Earn ClearMed Points for every bill uploaded, review posted, and referral made
- **Leaderboard** — City-wise rankings of top contributors

### For Hospitals
- **Partner Program** — Free listing, verified badge, sponsored placement, and patient enquiry routing
- **Analytics Dashboard** — Track profile views, enquiries, and verified bill counts

### For Businesses
- **B2B Data API** — REST API with cost percentiles, ClearMed Scores, and bulk exports for insurers, TPAs, and researchers

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | React framework, SSR/SSG |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| Lucide React | Icon system |
| PWA (Service Worker) | Offline support + installable app |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| Prisma ORM | Database access layer |
| PostgreSQL | Primary database |
| Redis (optional) | Response caching |
| Multer | File upload handling |
| JWT | User + admin authentication |
| TOTP (otplib) | Admin 2FA |
| Winston | Structured JSON logging |

### AI & Processing
| Technology | Purpose |
|---|---|
| Google Gemini 2.0 Flash | Report analysis, symptom AI |
| Google Gemini 1.5 Flash | Symptom quiz generation |
| Tesseract.js | Local OCR for bill images |
| Google Vision API | Fallback OCR (high accuracy) |

### Infrastructure & Compliance
| Technology | Purpose |
|---|---|
| Helmet.js | OWASP security headers |
| express-rate-limit | API rate limiting |
| node-cron | Scheduled jobs (trends, scores, notifications) |
| Resend / Nodemailer | Transactional email |
| DPDP Act 2023 | Data erasure & export endpoints |

---

## Project Structure

```
clearmed/
├── frontend/                  # Next.js 15 App Router
│   └── src/
│       ├── app/               # Pages (file-based routing)
│       │   ├── page.tsx       # Home
│       │   ├── search/        # Hospital search
│       │   ├── symptoms/      # AI symptom analyzer
│       │   ├── reports/       # Medical report analyzer
│       │   ├── dashboard/     # Cost intelligence
│       │   ├── insurance/     # Insurance tools
│       │   ├── upload/        # Bill upload
│       │   ├── community/     # Patient reviews
│       │   ├── leaderboard/   # Gamification
│       │   ├── compare/       # Hospital comparison
│       │   ├── treatments/    # SEO treatment pages
│       │   ├── hospitals/     # Hospital detail pages
│       │   ├── partner/       # Hospital partner program
│       │   ├── b2b/           # API documentation
│       │   └── admin/         # Admin panel
│       ├── components/        # Reusable UI components
│       │   ├── Navbar.tsx
│       │   ├── SearchBar.tsx
│       │   ├── HospitalCard.tsx
│       │   ├── ClearMedScore.tsx
│       │   ├── CostRange.tsx
│       │   ├── RadarChart.tsx
│       │   └── ...
│       └── lib/
│           └── api.ts         # Typed API client
│
└── backend/                   # Express.js REST API
    └── src/
        ├── index.ts           # Server entry point
        ├── routes/            # API route handlers
        │   ├── hospitals.ts
        │   ├── treatments.ts
        │   ├── bills.ts
        │   ├── symptoms.ts
        │   ├── reports.ts
        │   ├── scores.ts
        │   ├── intelligence.ts
        │   ├── insurance.ts
        │   ├── reviews.ts
        │   ├── gamification.ts
        │   ├── partners.ts
        │   ├── b2bApi.ts
        │   ├── adminAuth.ts
        │   ├── adminOps.ts
        │   ├── compliance.ts
        │   └── userAuth.ts
        ├── lib/               # Core business logic
        │   ├── scoreEngine.ts # ClearMed Score algorithm
        │   ├── costTrends.ts  # Monthly trend aggregation
        │   ├── ocr.ts         # Tesseract + Vision OCR
        │   ├── pii.ts         # PII detection & removal
        │   ├── pointsEngine.ts# Gamification logic
        │   ├── symptomAnalyzer.ts # Gemini AI integration
        │   ├── auth.ts        # JWT + TOTP auth
        │   ├── auditLog.ts    # Admin audit trail
        │   ├── notifications.ts # Email/SMS queuing
        │   ├── dataRetention.ts # DPDP compliance
        │   ├── seoGenerator.ts # Treatment page SEO
        │   └── cache.ts       # Redis caching
        ├── middleware/
        │   ├── security.ts    # Auth guards, rate limits
        │   └── errorHandler.ts
        ├── jobs/
        │   └── cronJobs.ts    # Scheduled tasks
        └── scripts/           # One-off admin scripts
            ├── seedAdmin.ts
            ├── recalcScores.ts
            └── buildTrends.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (optional, for caching)
- Google Gemini API key (for AI features)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/clearmed.git
cd clearmed
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/clearmed"
JWT_SECRET="your-strong-secret-here"
GEMINI_API_KEY="your-gemini-api-key"
FRONTEND_URL="http://localhost:3000"

# Optional
REDIS_URL="redis://localhost:6379"
RESEND_API_KEY="your-resend-key"
GOOGLE_VISION_API_KEY="your-vision-key"
SMTP_HOST="smtp.example.com"
SMTP_USER="noreply@example.com"
SMTP_PASS="your-smtp-password"
```

```bash
npx prisma migrate dev
npx prisma generate
npm run seed:admin      # Creates default admin accounts
npm run dev             # Starts on port 4000
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

```bash
npm run dev             # Starts on port 3000
```

### 4. Seed sample data (optional)

```bash
cd backend
npm run scores:recalc   # Calculate ClearMed scores
npm run trends:build    # Build cost trend charts
```

---

## Admin Panel

Navigate to `/admin/analytics` and log in with the seeded credentials:

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@clearmed.online | ClearMed@Admin2026 |
| Moderator | moderator@clearmed.online | ClearMed@Mod2026 |

> ⚠️ **Change these passwords before any production deployment.**

### Admin capabilities
- **Overview** — KPI dashboard, bill status breakdown, daily charts
- **Bill Verification** — Review uploaded bills against OCR extraction, approve or reject
- **Audit Log** — Immutable record of all admin actions
- **Moderation** — Manage abuse reports and DPDP erasure requests
- **CSV Import** — Bulk-import hospitals from CSV

Enable 2FA for admin accounts:

```
POST /api/admin/auth/totp/setup
POST /api/admin/auth/totp/confirm  { token: "123456" }
```

---

## ClearMed Score Algorithm

Each hospital-treatment pair receives a composite score (0–10):

| Component | Weight | Source |
|---|---|---|
| Patient Success Rate | 25% | Complication flags in reviews |
| Patient Satisfaction | 20% | Weighted review scores |
| Doctor Expertise | 20% | Experience years + doctor ratings |
| Cost Efficiency | 20% | Hospital avg vs city avg |
| Recovery Speed | 15% | Recovery days vs expected |
| NABH Bonus | +0.5 flat | Accreditation status |

Scores require a minimum of **5 data points** to be marked reliable. Scores are recalculated nightly via cron job.

---

## API Reference

### Public endpoints (sample)

```
GET  /api/hospitals?city=Delhi&treatment=knee-replacement
GET  /api/hospitals/:slug
POST /api/hospitals/compare           { ids: [...], treatmentSlug }
GET  /api/treatments/search?q=knee
GET  /api/costs/:treatmentId/:city
GET  /api/scores/:hospitalId/:treatmentId
POST /api/symptoms/analyze            { symptoms, city, answers }
POST /api/reports/analyze             multipart/form-data (file)
GET  /api/insurance/cashless?insurer=STAR_HEALTH&city=Delhi
POST /api/bills/upload                multipart/form-data
POST /api/reviews
GET  /api/community/leaderboard
```

### B2B API (API key required)

```
GET  /api/b2b/costs/:treatmentSlug/:city
GET  /api/b2b/outcomes/:hospitalId/:treatmentId
GET  /api/b2b/bulk/costs?city=Mumbai   (Professional+ only)
```

Pass your key via `X-Api-Key` header. See `/api/b2b/docs` for full documentation.

---

## Scheduled Jobs (Production only)

| Job | Schedule | Purpose |
|---|---|---|
| Trend Rebuild | 2:00 AM daily | Aggregate bills into monthly cost trends |
| Score Recalc | 3:00 AM daily | Recalculate all ClearMed scores |
| Notifications | Every 5 min | Send queued email/SMS notifications |
| Data Retention | Sunday 1:00 AM | DPDP Act purge of expired data |
| Post-treatment Nudge | 4:00 AM daily | Prompt verified patients to leave reviews |

---

## Privacy & Compliance

ClearMed is built with **DPDP Act 2023** (India's Digital Personal Data Protection Act) compliance from day one.

- **PII Auto-Removal** — All uploaded bills are scanned for patient name, Aadhaar, PAN, phone, address, and patient ID before any data is stored. Original files are deleted within 24 hours.
- **Data Erasure** — Users can request complete data deletion at `/privacy/erasure`. Processed within 30 days.
- **Data Export** — Users can download all data held about them (`POST /api/compliance/export`).
- **Audit Trail** — All admin actions are logged immutably with IP address and timestamp.
- **Retention Policy** — Bills: 5 years · Reviews: 3 years · Symptom queries: 12 months · Audit logs: 7 years.
- **Minimal Cookies** — Session and preference cookies only. No advertising or tracking pixels.

---

## Points System

| Activity | Points |
|---|---|
| Upload bill (manual) | +50 |
| Upload bill with file | +75 |
| Bill verified by admin | +100 |
| Post a review | +30 |
| Refer a friend | +200 |
| Daily login | +5 |

### Badges

| Badge | Requirement |
|---|---|
| 🏥 First Contribution | First bill uploaded |
| ⭐ Data Hero | 500 points |
| 🔍 Transparency Champion | 1,000 points |
| 🤝 Community Builder | 2,000 points |
| 🏆 ClearMed Legend | 5,000 points |

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing user JWTs |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (AI features) |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS & email links |
| `REDIS_URL` | ❌ | Redis URL for caching (degrades gracefully) |
| `RESEND_API_KEY` | ❌ | Resend.com key for transactional email |
| `GOOGLE_VISION_API_KEY` | ❌ | Google Vision API (OCR fallback) |
| `SMTP_HOST` | ❌ | SMTP host for email sending |
| `MAX_FILE_SIZE_MB` | ❌ | Max upload size in MB (default: 10) |
| `LOG_LEVEL` | ❌ | Winston log level (default: info) |

---

## Scripts

```bash
# Backend
npm run dev              # Development server (nodemon)
npm run build            # Compile TypeScript
npm run start            # Production server
npm run seed:admin       # Create admin accounts
npm run scores:recalc    # Recalculate all ClearMed scores
npm run trends:build     # Build cost trend snapshots

# Frontend
npm run dev              # Development server
npm run build            # Production build
npm run start            # Production server
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is proprietary software. © 2026 ClearMed Health Technologies Pvt. Ltd. All rights reserved.

---

## Contact

- **General:** contact.raktsetu@gmail.com
- **Privacy / DPDP:** privacy@clearmed.online
- **Partners:** partners@clearmed.online
- **B2B API:** api@clearmed.online
- **Built by:** [Ajay Kushwaha](https://portfolio.raktport.in/)

---

> *Medical disclaimer: ClearMed does not provide medical diagnosis or advice. Always consult a qualified doctor.*
