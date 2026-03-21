# ClearMed — Supabase Database Setup Guide

## What is Supabase?
Supabase is a free, hosted PostgreSQL database — like Google Firebase but open-source.
Instead of running PostgreSQL on your machine, your data lives in Supabase's cloud.
It's FREE for personal projects (up to 500MB, perfect for ClearMed development).

---

## Step-by-Step Supabase Setup

### Step 1 — Create a FREE Supabase account
1. Open your browser → go to **https://supabase.com**
2. Click **"Start your project"** (green button)
3. Sign up with GitHub or Google (easiest)

### Step 2 — Create a new project
1. Click **"New Project"**
2. Fill in:
   - **Name:** `clearmed` (or any name)
   - **Database Password:** Choose a strong password → **SAVE THIS PASSWORD**
   - **Region:** Choose `Southeast Asia (Singapore)` — closest to India
3. Click **"Create new project"**
4. Wait 1-2 minutes while Supabase sets up your database

### Step 3 — Get your connection string
1. In your Supabase project dashboard, click **"Settings"** (gear icon, left sidebar)
2. Click **"Database"**
3. Scroll down to **"Connection string"**
4. Click the **"URI"** tab
5. You'll see something like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you saved in Step 2
7. **Copy the entire connection string**

### Step 4 — Add connection string to ClearMed

**Option A — Using docker-compose.supabase.yml (easiest):**

Create a file called `.env` in the `clearmed` folder with:
```
SUPABASE_DATABASE_URL=postgresql://postgres.xxxxx:yourpassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

Then run:
```powershell
docker-compose -f docker-compose.supabase.yml up --build
```

**Option B — Edit docker-compose.yml directly:**

Open `docker-compose.yml` in VS Code.
Find this line:
```yaml
DATABASE_URL: postgresql://clearmed:clearmed123@postgres:5432/clearmed_db
```
Replace it with your Supabase URL:
```yaml
DATABASE_URL: postgresql://postgres.xxxxx:yourpassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

Then comment out or remove the `postgres:` service section entirely, and in `backend:` under `depends_on:`, remove the postgres condition.

### Step 5 — Run ClearMed with Supabase

```powershell
# Option A (recommended)
docker-compose -f docker-compose.supabase.yml up --build -d

# Wait 2 minutes, then seed data:
docker exec clearmed-backend npm run seed
docker exec clearmed-backend npm run seed:admin
```

### Step 6 — Verify tables were created
1. Go back to **https://supabase.com** → your project
2. Click **"Table Editor"** in left sidebar
3. You should see all 24 ClearMed tables:
   - hospitals, treatments, doctors, bills, users
   - hospital_treatments, patient_feedback, etc.

If tables are there → **you're done!** Open http://localhost:3000

---

## Why Supabase over local PostgreSQL?

| Feature | Local PostgreSQL | Supabase |
|---------|-----------------|---------|
| Setup difficulty | Medium (Docker) | Very easy |
| Data persists on restart | ✅ | ✅ |
| Access from anywhere | ❌ | ✅ |
| Free tier | ✅ (your machine) | ✅ (500MB cloud) |
| Built-in dashboard | ❌ | ✅ Table editor, SQL editor |
| Backups | Manual | Automatic daily |
| Works without Docker | ❌ | ✅ |

---

## Troubleshooting Supabase

**"SSL required" error:**
Add `?sslmode=require` at the end of your DATABASE_URL:
```
postgresql://postgres.xxxxx:pass@host:6543/postgres?sslmode=require
```

**"Connection refused" error:**
Use port `5432` instead of `6543` in the connection string.

**"Database does not exist" error:**
Make sure you copied the full URL including the database name `/postgres` at the end.

**Tables not created:**
Run manually:
```powershell
docker exec clearmed-backend npx prisma db push --accept-data-loss
```

---

## Moving from local to Supabase

If you already have data in local Docker PostgreSQL and want to move to Supabase:

1. Export data: `docker exec clearmed-postgres pg_dump -U clearmed clearmed_db > backup.sql`
2. Import to Supabase: Go to Supabase → **SQL Editor** → paste the backup.sql content → Run

---

© 2025 ClearMed Health Technologies Pvt. Ltd.
