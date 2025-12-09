-- Initial migration for Work.me
-- Create required extensions (pgcrypto for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "JobRole" AS ENUM ('INDIVIDUAL_CONTRIBUTOR','MANAGER','DIRECTOR_LEVEL','PROJECT_LEAD');
CREATE TYPE "SalaryRange" AS ENUM ('BELOW_50K','K50_100K','K100_150K','K150_200K','ABOVE_200K');

-- Company table
CREATE TABLE "Company" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL UNIQUE,
  "industry" text,
  "website" text,
  "city" text,
  "state" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- WorkMe (user) table
CREATE TABLE "WorkMe" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "firstName" text,
  "lastName" text,
  "photoUrl" text,
  "companyId" uuid,
  "workLocation" text,
  "city" text,
  "state" text,
  "jobTitle" text,
  "specialty" text,
  "industry" text,
  "jobRole" "JobRole",
  "annualSalary" text,
  "salaryRange" "SalaryRange",
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "WorkMe"
  ADD CONSTRAINT "WorkMe_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL;

-- Task table
CREATE TABLE "Task" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "description" text,
  "completed" boolean NOT NULL DEFAULT false,
  "dueAt" timestamptz,
  "workMeId" uuid NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE;

-- Goal table
CREATE TABLE "Goal" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "description" text,
  "progress" integer NOT NULL DEFAULT 0,
  "targetDate" timestamptz,
  "workMeId" uuid NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "Goal"
  ADD CONSTRAINT "Goal_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE;

-- Achievement table
CREATE TABLE "Achievement" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "description" text,
  "date" timestamptz NOT NULL DEFAULT now(),
  "workMeId" uuid NOT NULL
);

ALTER TABLE "Achievement"
  ADD CONSTRAINT "Achievement_workMeId_fkey" FOREIGN KEY ("workMeId") REFERENCES "WorkMe"("id") ON DELETE CASCADE;
