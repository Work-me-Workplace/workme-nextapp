-- AlterTable (only if table exists - WorkEvent may have been refactored)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'WorkEvent') THEN
        ALTER TABLE "WorkEvent" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        
        -- Update existing rows to have updatedAt = createdAt (if any exist)
        UPDATE "WorkEvent" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
    END IF;
END $$;

