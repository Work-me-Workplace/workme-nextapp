-- Fix training dates that were incorrectly parsed as 2024 instead of 2026
-- These trainings were ingested in 2026, so dates without years should be 2026

-- Training 1: "FEB. 25" should be 2026-02-25 (not 2024-02-25)
UPDATE "CompanyTraining"
SET "trainingDate" = '2026-02-25'::date
WHERE id = 'cmm0ud2560001v43t4u7nt5dg'
  AND "trainingDate" = '2024-02-25'::date;

-- Training 2: "JAN. 22" should be 2026-01-22 (not 2024-01-22)  
UPDATE "CompanyTraining"
SET "trainingDate" = '2026-01-22'::date
WHERE id = 'cmkh4fp4g0001b8r7nswgo7uc'
  AND "trainingDate" = '2024-01-22'::date;

-- Verify the updates
SELECT id, title, "trainingDate", "createdAt"
FROM "CompanyTraining"
WHERE id IN ('cmm0ud2560001v43t4u7nt5dg', 'cmkh4fp4g0001b8r7nswgo7uc');
