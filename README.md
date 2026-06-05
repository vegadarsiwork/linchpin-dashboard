# Linchpin Studio Dashboard

Linchpin Studio Dashboard is a multi-role marketing operations portal for Linchpin Studio, its client businesses, and marketplace creators. It combines a client command center, reel/content review workflows, lightweight lead tracking, creator discovery, influencer requests, and admin operations in one Next.js app.

Production URL: https://linchpin-dashboard.vercel.app

## Product Roles

The application has three primary user types:

| Role | Entry Point | Purpose |
| --- | --- | --- |
| Superadmin | `/admin` | Linchpin internal operations: clients, metrics, deliverables, reels, scripts, influencers, creator applications, and request review. |
| Client | `/dashboard/login` | Business-facing dashboard: command center, reels, clips, leads, scripts, influencers, billing, notifications, and settings. |
| Influencer | `/influencer/signup` or `/influencer/login` | Creator-owned marketplace profile: onboarding, profile media, trial reel previews, and incoming campaign requests. |

## Current Tech Stack

- Framework: Next.js 16 App Router
- UI: React 19, TypeScript, Tailwind CSS, shadcn-style primitives, Lucide icons, Sonner toasts
- Database: Neon Postgres or any Postgres-compatible `DATABASE_URL`
- Auth: Custom email/password auth backed by the `users` table, password hashes, and server-side session cookies
- File uploads: UploadThing for profile photos, cover images, and lightweight trial reel previews
- AI: OpenRouter for script generation and JSON chat completions where enabled
- Deployment: Vercel
- Cron: Vercel Cron hitting `/api/cron/reminders`

The repository still has a `supabase/` folder because the original schema was written as Supabase migrations. Runtime code no longer requires Supabase services. Treat `supabase/migrations` as Postgres SQL migrations.

## Core Features

### Client Dashboard

Client routes live under `/dashboard`.

Current client surfaces:

- Command Center: `/dashboard`
- Reels: `/dashboard/reels`
- Clips: `/dashboard/clips`
- Leads: `/dashboard/leads`
- Scripts: `/dashboard/scripts`
- Script detail: `/dashboard/scripts/[id]`
- Influencer marketplace: `/dashboard/influencers`
- Influencer profile: `/dashboard/influencers/[id]`
- Outreach: `/dashboard/outreach`
- Zap: `/dashboard/zap`
- Billing: `/dashboard/billing`
- Notifications: `/dashboard/notifications`
- Settings: `/dashboard/settings`

Client flow:

1. Client logs in at `/dashboard/login`.
2. They land on the Command Center for account status, activity, deliverables, reels, and production summaries.
3. They can approve/reject reels or clips, review scripts, manage lightweight leads, and update settings.
4. In `/dashboard/influencers`, they can browse approved creators, filter/search, submit a campaign brief, request a creator, and track request status.
5. Clients never see creator direct contact details. Linchpin remains the operator between client and creator.

### Influencer Marketplace

Influencer routes live under `/influencer`.

Current influencer surfaces:

- Signup: `/influencer/signup`
- Login: `/influencer/login`
- Dashboard and onboarding: `/influencer/dashboard`

Influencer flow:

1. Creator signs up at `/influencer/signup`.
2. Creator is redirected to `/influencer/dashboard`.
3. Creator completes profile fields, uploads profile photo and optional cover photo, adds platform stats, niches, languages, audience details, pricing range, campaign preferences, and past collaborations.
4. Creator uploads trial reel previews. These are lightweight previews for marketplace browsing, not full-quality reel delivery files.
5. Creator submits the profile for review.
6. While pending, the dashboard shows a review confirmation state.
7. Superadmin approves or rejects the creator profile and trial reels from `/admin/influencer-applications`.
8. Once approved and public-visible, clients can browse and request the creator.
9. Creator can track requests through the influencer dashboard. Direct client contact is intentionally not exposed.

UploadThing limits for the current free-plan setup:

| Upload Type | Endpoint | Limit |
| --- | --- | --- |
| Profile photo | `avatarUploader` | Image, 2 MB |
| Cover photo | `coverUploader` | Image, 4 MB |
| Trial reel image/GIF preview | `trialReelPreview` | Image/GIF, 8 MB |
| Trial reel video preview | `trialReelPreview` | Video, 16 MB |

For now, full-quality reels should be delivered through Google Drive or another private link stored in the relevant workflow. The app storage is intentionally limited to profile media and small marketplace previews.

### Superadmin

Admin routes live under `/admin`.

Current admin surfaces:

- Overview: `/admin`
- Client creation: `/admin/clients/new`
- Client detail: `/admin/clients/[orgId]`
- Client reels: `/admin/clients/[orgId]/reels`
- Client clips: `/admin/clients/[orgId]/clips`
- Client scripts: `/admin/clients/[orgId]/scripts`
- Influencer roster: `/admin/influencers`
- New influencer: `/admin/influencers/new`
- Influencer detail: `/admin/influencers/[influencerId]`
- Creator applications: `/admin/influencer-applications`
- Influencer requests: `/admin/influencer-requests`
- Admin matching tool: `/admin/match`
- New script: `/admin/scripts/new`

Admin flow:

1. Superadmin logs in through `/dashboard/login`.
2. Because the user role is `superadmin`, the app redirects/permits access to `/admin`.
3. Admin can create and manage client organisations, update metrics and deliverables, upload/manage reels, manage scripts, review influencer applications, approve/reject trial reels, review client creator requests, and maintain the influencer roster.
4. Admin confirms, declines, or progresses influencer requests. This protects the marketplace from clients and creators taking deals off-platform.

## Request and Review Workflow

Influencer request statuses currently include:

- `requested`
- `under_review`
- `confirmed`
- `unavailable`
- `script_ready`
- `in_production`
- `delivered`

High-level flow:

```text
Client browses or matches creator
-> Client sends request
-> Linchpin reviews availability and fit
-> Admin confirms, declines, or suggests alternatives
-> Admin can generate scripts
-> Production happens off-platform or through Linchpin workflow
-> Client tracks status
-> Influencer sees managed requests without direct client contact
```

## Authentication

This app uses custom auth, not Supabase Auth.

Key files:

- `src/lib/auth/crypto.ts` - password hashing and verification
- `src/lib/auth/sessions.ts` - server-side sessions and cookies
- `src/app/api/auth/login/route.ts` - login endpoint
- `src/app/api/auth/logout/route.ts` - logout endpoint
- `src/app/api/auth/set-password/route.ts` - set/change password
- `src/app/api/auth/forgot-password/route.ts` - password reset token creation
- `src/middleware.ts` - route protection and role routing

Auth rules:

- Clients and superadmins use `/dashboard/login`.
- Influencers can sign up publicly at `/influencer/signup`.
- Admin access requires `users.role = 'superadmin'`.
- Client dashboard access requires an authenticated client or superadmin depending on route behavior.
- Influencer dashboard access requires `users.role = 'influencer'`.

## Environment Variables

Required for normal runtime:

```env
DATABASE_URL=
UPLOADTHING_TOKEN=
```

Optional or feature-specific:

```env
POSTGRES_URL=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_URL=https://linchpin-dashboard.vercel.app
OPENROUTER_APP_NAME=Linchpin Studio
CRON_SECRET=
```

Notes:

- `DATABASE_URL` is the primary Postgres connection string. `POSTGRES_URL` is accepted as a fallback by `src/lib/db.ts`.
- `UPLOADTHING_TOKEN` is required for profile and trial reel preview uploads.
- OpenRouter is only required for routes that generate AI-backed scripts or structured completions.
- WhatsApp and email delivery are intentionally disabled/left out for now. Notifications are handled in-app.
- Do not commit `.env.local`.

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```env
DATABASE_URL="postgres://..."
UPLOADTHING_TOKEN="..."
OPENROUTER_API_KEY="..."
OPENROUTER_MODEL="openai/gpt-4o-mini"
OPENROUTER_SITE_URL="http://localhost:3000"
OPENROUTER_APP_NAME="Linchpin Studio"
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Database Setup

The SQL migrations are in `supabase/migrations`, but they are plain Postgres SQL.

Apply migrations in numeric order:

```text
001_initial_schema.sql
002_rls_policies.sql
003_client_write_policies.sql
004_billing_and_prefs.sql
005_vps_auth.sql
006_seed_vps_auth_passwords.sql
007_influencer_marketplace.sql
008_creator_marketplace_accounts.sql
009_media_assets.sql
010_uploadthing_media_assets.sql
011_influencer_profile_extended.sql
012_extend_campaigns.sql
013_clips.sql
014_reel_delivery_workflow.sql
015_scripts_workflow.sql
```

If `psql` is installed:

```bash
psql "$DATABASE_URL" -f supabase/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/002_rls_policies.sql
psql "$DATABASE_URL" -f supabase/migrations/003_client_write_policies.sql
psql "$DATABASE_URL" -f supabase/migrations/004_billing_and_prefs.sql
psql "$DATABASE_URL" -f supabase/migrations/005_vps_auth.sql
psql "$DATABASE_URL" -f supabase/migrations/006_seed_vps_auth_passwords.sql
psql "$DATABASE_URL" -f supabase/migrations/007_influencer_marketplace.sql
psql "$DATABASE_URL" -f supabase/migrations/008_creator_marketplace_accounts.sql
psql "$DATABASE_URL" -f supabase/migrations/009_media_assets.sql
psql "$DATABASE_URL" -f supabase/migrations/010_uploadthing_media_assets.sql
psql "$DATABASE_URL" -f supabase/migrations/011_influencer_profile_extended.sql
psql "$DATABASE_URL" -f supabase/migrations/012_extend_campaigns.sql
psql "$DATABASE_URL" -f supabase/migrations/013_clips.sql
psql "$DATABASE_URL" -f supabase/migrations/014_reel_delivery_workflow.sql
psql "$DATABASE_URL" -f supabase/migrations/015_scripts_workflow.sql
```

On Windows PowerShell:

```powershell
psql "$env:DATABASE_URL" -f supabase/migrations/001_initial_schema.sql
```

If `psql` is not installed, use the Neon SQL editor and paste each migration in numeric order.

Seed data:

```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```

The seed creates one superadmin, two clients, sample dashboard data, and sample public marketplace influencers.

## Demo Accounts

Seeded accounts use this password:

```text
password123
```

| Role | Email | Password |
| --- | --- | --- |
| Superadmin | `admin@linchpinstudio.in` | `password123` |
| Client | `priya@spicebowl.in` | `password123` |
| Client | `rahul@bytebrew.in` | `password123` |

Influencer accounts are created through `/influencer/signup`.

For a test influencer:

1. Open `/influencer/signup`.
2. Create a creator account with any new email and an 8+ character password.
3. Complete profile fields in `/influencer/dashboard`.
4. Upload profile photo, optional cover photo, and at least one trial reel preview.
5. Submit the profile for review.
6. Log in as superadmin and open `/admin/influencer-applications`.
7. Approve the profile and trial reel.
8. Log in as a client and open `/dashboard/influencers`.
9. Confirm the creator is visible and can be requested.

## AI and Matching

There are two separate concepts:

1. Influencer matching for clients is currently tag/data based. It scores creator fit using fields such as category, niches, language, city, budget, audience, and availability.
2. Script generation uses OpenRouter where configured. The helper is `src/lib/ai/openrouter.ts`.

OpenRouter defaults to:

```text
openai/gpt-4o-mini
```

Set `OPENROUTER_MODEL` to use another model.

## Media and Storage Policy

Current policy:

- UploadThing is for lightweight marketplace/profile assets only.
- Profile photo max: 2 MB.
- Cover photo max: 4 MB.
- Trial reel image/GIF preview max: 8 MB.
- Trial reel video preview max: 16 MB.
- Full-quality production reels should not be uploaded to UploadThing for now.
- Full-quality reel delivery should use Google Drive or another private delivery link.

Important files:

- `src/app/api/uploadthing/core.ts`
- `src/components/influencer/InfluencerProfileForm.tsx`
- `src/components/influencer/InfluencerPortfolioManager.tsx`
- `src/components/studio/marketplace/CreatorCard.tsx`
- `src/components/studio/marketplace/InfluencerProfileModal.tsx`
- `src/components/studio/marketplace/InfluencerProfilePageClient.tsx`

## Deployment

The project is linked to Vercel.

Deploy production manually:

```bash
npx vercel deploy --prod --yes
```

The current production alias is:

```text
https://linchpin-dashboard.vercel.app
```

Vercel Cron is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Testing Checklist

Before shipping:

```bash
npm run lint
npm run build
```

Manual checks:

### Admin

- Log in as `admin@linchpinstudio.in`.
- Open `/admin`.
- Check client list/overview.
- Open `/admin/influencer-applications`.
- Approve/reject a pending creator profile.
- Approve/reject a pending trial reel.
- Open `/admin/influencer-requests`.
- Confirm request status updates work.
- Open `/admin/clients/new` and verify the create-client form renders.
- Open a client detail route and verify tabs for reels, clips, and scripts.

### Client

- Log in as `priya@spicebowl.in`.
- Open `/dashboard`.
- Confirm sidebar and topbar render.
- Open `/dashboard/reels`, `/dashboard/clips`, `/dashboard/leads`, `/dashboard/scripts`, `/dashboard/influencers`, `/dashboard/billing`, and `/dashboard/settings`.
- In `/dashboard/influencers`, search/filter creators.
- Open a creator profile.
- Submit an enquiry.
- Check `/dashboard/influencers` -> `My Requests`.

### Influencer

- Create a new account at `/influencer/signup`.
- Complete profile fields.
- Upload profile photo.
- Upload cover photo.
- Upload a trial reel preview under the current size limits.
- Submit for review.
- Confirm the review confirmation state appears.
- Log in as admin and approve the creator/profile media.
- Return to the client marketplace and confirm visibility.

## Known Product Decisions

- Clients and creators should not connect directly. The UI avoids exposing direct creator contact details to clients.
- Linchpin stays in the middle for pricing, availability, scripting, production, and delivery.
- UploadThing is intentionally limited to lightweight previews on the current free-plan setup.
- WhatsApp and email integrations are currently not active in product flow. Keep them as future enhancements unless explicitly re-enabled.
- The dashboard is intended to follow a light-mode, Linear-inspired visual style with restrained purple accents.

## Important Directories

```text
src/app                 Next.js App Router pages and API routes
src/components/studio   Client/admin dashboard components
src/components/influencer Influencer onboarding/dashboard components
src/components/ui       Shared UI primitives
src/lib                 Database, auth, AI, utility code
supabase/migrations     Postgres SQL migrations
supabase/seed.sql       Demo seed data
config                  ESLint configuration
docs                    Project docs and planning notes
```

## Maintenance Notes

- Keep environment variables in Vercel and `.env.local`; never commit secrets.
- If changing upload limits, update both `src/app/api/uploadthing/core.ts` and the user-facing helper text.
- If adding AI features, route them through `src/lib/ai/openrouter.ts`.
- If adding database fields, create a new numbered SQL migration.
- If changing route guards, update `src/middleware.ts` and test all three user roles.
