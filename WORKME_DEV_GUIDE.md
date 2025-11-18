# Work.me — Developer Guide

This document is a concise developer guide for the Work.me Next.js app in this repository. It summarizes the app structure, data models, local setup, running, and deployment notes.

---

**Architecture (high level):**
- Frontend: Next.js 14 (app router) — UI + server components live in `app/`.
- Styling: Tailwind CSS (`globals.css` imported in `app/layout.tsx`).
- Database: Prisma with PostgreSQL datasource (`prisma/schema.prisma`).
- Hosting: Target platforms — Vercel for the Next app, Render for managed Postgres (recommended for dev).

---

**Pages & Routes** (file → route → purpose)
- `app/page.tsx` → `/` : Splash / landing page
- `app/auth/page.tsx` → `/auth` : Sign-in placeholder (Firebase/Cognito placeholder)
- `app/welcome/page.tsx` → `/welcome` : Onboarding/profile setup
- `app/dashboard/page.tsx` → `/dashboard` : App overview (links to features)

- Tasks
  - `app/tasks/page.tsx` → `/tasks` : Tasks list (placeholder)
  - `app/tasks/new/page.tsx` → `/tasks/new` : New task (client form)
  - `app/tasks/[taskId]/page.tsx` → `/tasks/:taskId` : Task detail

- Goals
  - `app/goals/page.tsx` → `/goals` : Goals list
  - `app/goals/new/page.tsx` → `/goals/new` : New goal (client form)
  - `app/goals/[goalId]/page.tsx` → `/goals/:goalId` : Goal detail

- Achievements
  - `app/achievements/page.tsx` → `/achievements` : Achievements list
  - `app/achievements/new/page.tsx` → `/achievements/new` : New achievement
  - `app/achievements/[achievementId]/page.tsx` → `/achievements/:id` : Achievement detail

Notes: many pages are placeholders with TODOs for CRUD. There are currently no API route files under `app/api/` — server-side endpoints need to be implemented (see Next tasks below).

---

**Data Models (Prisma)** — `prisma/schema.prisma` (summary)
- `User`
  - `id: String (uuid)`, `email: String (unique)`, `name`, `company`, `createdAt`
  - Relations: `tasks`, `goals`, `achievements`
- `Task`
  - `id`, `title`, `description?`, `completed: Boolean`, `dueAt?`, `userId` → relation to `User`
- `Goal`
  - `id`, `title`, `description?`, `progress: Int`, `targetDate?`, `userId` → `User`
- `Achievement`
  - `id`, `title`, `description?`, `date`, `userId` → `User`

These are straightforward one-to-many relations from `User` to each resource.

---

**Key repository files**
- `prisma/schema.prisma` — Prisma models and datasource
- `package.json` — scripts and dependencies
- `app/` — Next.js app router pages/components
- `app/layout.tsx` and `app/globals.css` — base layout + Tailwind imports
- `infrastructure/terraform/` — (existing AWS Terraform for RDS; you moved away from Amplify)

---

Developer setup (local)

1) Prerequisites
   - Node 18+ (repo `engines` requires `>=18`).
   - Docker (recommended for local Postgres) or an accessible Postgres instance.

2) Install dependencies
```
npm ci
```

3) Run a local Postgres (quick via Docker)
```
docker run --rm --name workme-postgres -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=workme -e POSTGRES_DB=workmedb -p 5432:5432 -d postgres:15
```
Set your `DATABASE_URL` locally (example):
```
export DATABASE_URL="postgresql://workme:pass@localhost:5432/workmedb"
```

4) Prisma - generate client and create migrations
```
npx prisma generate
npx prisma migrate dev --name init
```
This creates `prisma/migrations/` which should be committed.

If you're starting fresh (no existing data): delete any existing `prisma/migrations/` folder (if present) and run the commands above to create a single initial migration. There are no migrations in this repo currently, so you can run the commands directly.

5) Run the dev server
```
npm run dev
```
Open `http://localhost:3000`.

Notes: The app currently uses placeholder forms and navigation. API endpoints that call Prisma are not implemented yet — you'll add server handlers (Next.js app `app/api/*` or server components that call a database layer).

---

Deployment notes (Vercel + Render)
- Database: create a Render Managed Postgres and copy its connection string.
- Set `DATABASE_URL` in Vercel project env vars (Production + Preview as needed).
- Migrations: run locally and commit migrations, or run `npx prisma migrate deploy` during your deploy step.
- Recommended `package.json` additions for production deploys:
  - `"postinstall": "prisma generate"` to ensure client exists on install
  - `"start": "next start -p $PORT"` if your host expects `$PORT` (Vercel handles this automatically but Render or other hosts may need it).

Example production deploy flow:
```
# locally
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "Add prisma migrations"
git push origin main

# on deploy (CI or server)
npx prisma migrate deploy
npm run build
npm run start
```

---

Short roadmap / next tasks
- Implement server-side API routes for CRUD using Prisma (`app/api/tasks`, `app/api/goals`, etc.)
- Wire forms to call those endpoints (client code in `app/*/new` currently has TODOs)
- Add authentication (NextAuth, Cognito, or Firebase) and associate users with resources
- Add seeds and a `prisma/seed.ts` script for dev data
- Add CI step to run `prisma migrate deploy` before publishing (GitHub Actions or Vercel build hook)
- Add tests and linting (ESLint + Prettier) if desired

Profile / Identity model
- The `WorkMe` Prisma model holds the user's profile. Fields added:
  - `firstName`, `lastName` — first and last name (also provided by Firebase if using social sign-in)
  - `photoUrl` — avatar/photo URL (from Firebase)
  - `email` — primary email (unique)
  - `workLocation`, `city`, `state` — location/profile fields
  - `jobTitle`, `specialty`, `industry` — job metadata
  - `jobRole` — configured enum (`INDIVIDUAL_CONTRIBUTOR`, `MANAGER`, `DIRECTOR_LEVEL`, `PROJECT_LEAD`)
  - `annualSalary` — free-form string (displayed as entered)
  - `salaryRange` — configured enum (`BELOW_50K`, `K50_100K`, `K100_150K`, `K150_200K`, `ABOVE_200K`) for standardized ranges

  Company directory
  - `WorkMe` now links to a `Company` model via `companyId` and `company` relation. `Company` has fields: `id`, `name` (unique), `industry`, `website`, `city`, `state`, and `createdAt`.
  - The onboarding flow should let users pick their company from a directory (autocomplete/select) populated from the `Company` table. Admins or a seed script can populate the `Company` directory.
   - New company fields: `description`, `headcount` (Int), `companyType` (enum), and `revenueRange` (enum).
   - `companyType` options: `NON_PROFIT`, `FOR_PROFIT`, `PUBLICLY_TRADED`, `GOVERNMENT`.
   - `revenueRange` is a coarse bucket for company revenue (e.g. `UNDER_10M`, `M10_50`, `M50_200`, `M200_1000`, `ABOVE_1000M`).

  UX for company selection and creation
  - Show an autocomplete/select that searches `Company.name` as the user types. If no match, allow the user to "Create company" which opens a small form to add basic details (`name`, `companyType`, `city`, `state`).
  - New company entries should be validated and possibly reviewed by admin before being promoted for all users (optional).
  - Prefer storing `headcount` as an integer when known; otherwise, use `revenueRange` and similar canned buckets for reporting/filtering.

  Backend API notes
  - Implement a read endpoint for `GET /api/companies?query=` that returns matching companies for autocomplete.
  - Implement `POST /api/companies` to create new companies (validate unique `name`).
  - Protect company creation if you require admin approval; otherwise, allow authenticated users to create and later have admins moderate.

Notes:
- Use `email`, `photoUrl`, and name fields from Firebase (or your chosen auth provider) to prefill the profile during onboarding.
- `annualSalary` remains a string for flexibility, while `salaryRange` lets you categorize users into buckets for reporting/filters.
- If you want different salary buckets, edit `prisma/schema.prisma` enum `SalaryRange` and regenerate the Prisma client.

---

If you want, I can:
- Create this file in the repo (done).
- Patch `package.json` to add `postinstall` and `start` changes.
- Scaffold example API handlers (server) for `tasks` and wire the `new` forms to call them.
- Add a GitHub Action template that runs migrations and builds.

Tell me which of the follow-ups you'd like and I will implement them.
