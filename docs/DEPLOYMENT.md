# Linchpin — Deployment Guide

**Target URL:** https://dashboard.linchpinsoftsolution.com

---

## 1. Database — Neon Postgres (free)

1. Go to [neon.tech](https://neon.tech) and sign up / log in.
2. Create a new project → choose a region closest to your users (e.g. `ap-southeast-1` for India).
3. In the project dashboard, open **Connection Details** → copy the **Connection string** (starts with `postgresql://`).
4. Run your Prisma migration against Neon to create the schema:
   ```bash
   DATABASE_URL="<your-neon-url>" npx prisma db push
   ```
5. Save the `DATABASE_URL` — you'll add it to Vercel in step 5.

---

## 2. Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or use an existing one).
3. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
4. Application type: **Web application**.
5. Add the following **Authorized redirect URI**:
   ```
   https://dashboard.linchpinsoftsolution.com/api/auth/callback/google
   ```
   (Also add `http://localhost:3000/api/auth/callback/google` for local dev.)
6. Save — copy the **Client ID** and **Client Secret**.

---

## 3. AI (OpenRouter)

1. Go to [openrouter.ai](https://openrouter.ai) and sign up.
2. Navigate to **Keys → Create Key**.
3. Copy the API key (starts with `sk-or-...`).

> The daily report generation uses OpenRouter. If you prefer Anthropic directly, get a key from [console.anthropic.com](https://console.anthropic.com) and update `src/lib/openrouter.ts`.

---

## 4. Email — Resend

1. Go to [resend.com](https://resend.com) and sign up.
2. Navigate to **API Keys → Create API Key** with full access.
3. Under **Domains**, add and verify `linchpinsoftsolution.com` (add the DNS TXT record at your registrar).
4. Set your from-address as `noreply@linchpinsoftsolution.com`.
5. Copy the API key (starts with `re_...`).

---

## 5. Vercel — Deploy

### a. Import the repository
1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import this Git repository.
3. Framework preset: **Next.js** (auto-detected).
4. Click **Deploy** (first deploy may fail — set env vars next, then redeploy).

### b. Environment Variables
In Vercel project → **Settings → Environment Variables**, add all of these:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` locally to generate |
| `NEXTAUTH_URL` | `https://dashboard.linchpinsoftsolution.com` |
| `GOOGLE_CLIENT_ID` | From step 2 |
| `GOOGLE_CLIENT_SECRET` | From step 2 |
| `OPENROUTER_API_KEY` | From step 3 |
| `RESEND_API_KEY` | From step 4 |
| `RESEND_FROM_EMAIL` | `noreply@linchpinsoftsolution.com` |
| `CRON_SECRET` | Any random string — secures the cron endpoint |
| `OFFICE_IP` | Your office's public IP (for attendance IP check) |
| `COMPANY_NAME` | `Linchpin Soft Solution` |
| `COMPANY_ADDRESS` | Your company's full address (multiline OK) |
| `COMPANY_GSTIN` | Your GSTIN (optional, appears on invoices) |

After adding all variables, trigger a **Redeploy**.

### c. Custom Domain
1. Vercel project → **Settings → Domains → Add**.
2. Enter: `dashboard.linchpinsoftsolution.com`
3. Add this record at your domain registrar (GoDaddy / Namecheap / Cloudflare):
   - **Type:** CNAME
   - **Host / Name:** `dashboard`
   - **Value / Points to:** `cname.vercel-dns.com`
4. DNS propagates in 5–30 minutes. Vercel provisions SSL automatically.

---

## 6. Cron Job (Daily Report)

`vercel.json` is already configured:
```json
{ "crons": [{ "path": "/api/reports/generate-daily", "schedule": "30 13 * * *" }] }
```

This fires at **7:00 PM IST** (13:30 UTC) every day. The endpoint verifies `Authorization: Bearer <CRON_SECRET>`.

> Vercel Cron Jobs require a **Pro plan**. On the free Hobby plan, trigger reports manually from Admin → Reports.

---

## 7. First-time Setup After Deploy

After your first successful deploy:

1. Log in with Google OAuth to create your account.
2. **Promote yourself to ADMIN** — connect to Neon via Prisma Studio:
   ```bash
   DATABASE_URL="<neon-url>" npx prisma studio
   ```
   Open the `User` table, find your record, set `role = ADMIN`.
3. From the dashboard, invite your team via **Admin → Manage Users → Invite User**.
4. Set each employee's **Base Monthly Salary** and **Designation** in Manage Users.
5. Test attendance check-in from the office network.
6. Generate a test daily report from **Admin → Reports**.

---

## Local Development

```bash
# Install dependencies
npm install

# Create local env file
cp .env.example .env.local
# Fill in DATABASE_URL and other vars (use a local or Neon dev branch)

# Push schema
npx prisma db push

# Run dev server
npm run dev
```
