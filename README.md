# workme-nextapp

High-level scaffold for the Work.me career growth tracker.

Stack:
- Next.js (App Router)
- Prisma (SQLite dev by default)
- TailwindCSS

Routes scaffolded:
- `/` — Splash
- `/auth` — Auth placeholder (Firebase/Cognito)
- `/welcome` — Welcome/setup flow
- `/dashboard` — Dashboard overview
- `/tasks`, `/tasks/new`, `/tasks/[taskId]`
- `/goals`, `/goals/new`, `/goals/[goalId]`
- `/achievements`, `/achievements/new`, `/achievements/[achievementId]`

Quick setup (dev):

1. Install dependencies

```bash
npm install
```

2. Generate Prisma client and run the first migration (dev sqlite)

```bash
npm run prisma:generate
npm run prisma:migrate
```

3. Run the dev server

```bash
npm run dev
```

Next steps / Notes:
- Implement authentication (Firebase or AWS Cognito) in `/auth` and secure server APIs.
- Add API routes and Prisma CRUD calls for tasks, goals, and achievements.
- Replace SQLite with Postgres for production and update `prisma/schema.prisma` datasource.

Deployment (recommended)

This project is set up to deploy on Vercel for the Next.js app and Render for a managed Postgres database. Vercel handles Next.js SSR and static builds automatically; Render provides an easy managed Postgres instance for dev/prod.

Quick Render + Vercel flow:

1. Create a Render Postgres instance (Dashboard → New → Database → Postgres). Choose a Hobby plan for development.
2. Copy the Render Postgres connection string and add it as `DATABASE_URL` in Vercel (Project → Settings → Environment Variables) and/or in a local `.env`.
3. Locally, generate Prisma client and create the initial migration:

```bash
npm ci
export DATABASE_URL="postgresql://user:pass@your-db-host:5432/workmedb"
npx prisma generate
npx prisma migrate dev --name init
```

4. Commit the `prisma/migrations/` folder and push to your repo. Vercel will build and deploy the app. If you prefer migrations to run during deploy, add a build/start hook to run `npx prisma migrate deploy` in your CI.

Notes:
- `package.json` includes `postinstall` to `prisma generate` and `start` uses `$PORT` so Render/other hosts will work.
- If you still want to use AWS: see `infrastructure/terraform/` for a Terraform RDS example, but be careful with networking and costs.

Workme repo for mvp1

## Architecture Principle

**Identity-First Architecture:**

- **WorkMeID = identity only** (not a tenant or workspace). WorkMe contains user profile fields, tasks/goals/achievements relations, and companyId relation. No other relations on WorkMe.

- **Companies are independent entities** with no dependency on WorkMe. Company is a standalone table (name, city, type, etc.). WorkMe references Company via `companyId`, but Company does NOT reference WorkMe.

- **Work outputs use `originatorId`** for all "work output" models (WorkSupport, WorkforceComms, NTKEdition, OrgCampaign, etc.). This allows:
  - MVP1 single-user workflows
  - Future multi-originator workflows  
  - Future company/group routing

Work outputs reference WorkMe via `originatorId` for MVP1, and will move into the Workbench repository for collaboration in Phase 2.

