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

AWS RDS + Amplify deployment (scaffolded):

- A Terraform scaffold is provided in `infrastructure/terraform/` to create a VPC, 2 subnets, a security group, and a Postgres RDS instance. You must supply `db_password` as a Terraform variable.
- The Prisma `schema.prisma` has been switched to use `env("DATABASE_URL")`. Copy `.env.example` to `.env` and fill `DATABASE_URL` once you have the RDS endpoint.
- `amplify.yml` is added for Amplify Console build settings. Set `DATABASE_URL` and other environment variables in the Amplify Console for your app.

Important:
- The Terraform example opens Postgres on 0.0.0.0/0 for simplicity. Restrict this to your IPs or internal CIDRs in production.
- You need AWS credentials to run `terraform init` and `terraform apply`.

Quick Terraform run (example):

```bash
cd infrastructure/terraform
terraform init
terraform apply -var='db_password=StrongPassword123' -auto-approve
```

After apply, copy the outputs `db_endpoint` and `db_port` and set:

```
DATABASE_URL="postgresql://<username>:<password>@<endpoint>:<port>/<dbname>"
```

Then generate Prisma client and apply migrations:

```bash
npm run prisma:generate
npx prisma migrate deploy
```


Workme repo for mvp1 

## Amplify build troubleshooting
- If the Amplify Console build fails with "Could not read package.json": ensure the app's root directory is set to the repository root (i.e. `/`) in the Amplify build settings. The `amplify.yml` in this repo assumes the Next app lives at the repository root.
- Make sure environment variables (e.g. `DATABASE_URL`) are set in the Amplify Console. If you rely on SSM Parameter Store, ensure the Amplify service role has permissions to read those parameters.
- Confirm Amplify is using a Node runtime >= 18 to match the `engines` field in `package.json`.
- If problems persist, check the build logs for `pwd` and `ls -la` output (these are printed during `preBuild` in `amplify.yml`) to see where CodeBuild is running and what files exist.
