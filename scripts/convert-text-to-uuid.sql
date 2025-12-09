-- Convert all TEXT foreign keys to WorkMe.id to UUID type
-- This script fixes the type mismatch after db push

-- First, drop all foreign key constraints
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'WorkMe'
        AND ccu.column_name = 'id'
    ) LOOP
        EXECUTE 'ALTER TABLE "' || r.table_name || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
    END LOOP;
END $$;

-- Convert WorkMe.id to UUID
ALTER TABLE "WorkMe" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;

-- Convert all foreign key columns to UUID
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT DISTINCT c.table_name, c.column_name
        FROM information_schema.columns c
        JOIN information_schema.table_constraints tc ON c.table_name = tc.table_name
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'WorkMe'
        AND ccu.column_name = 'id'
        AND (c.column_name LIKE '%workMeId%' OR c.column_name LIKE '%createdByWorkMeId%' OR c.column_name = 'userId')
        AND c.data_type = 'text'
    ) LOOP
        EXECUTE 'ALTER TABLE "' || r.table_name || '" ALTER COLUMN "' || r.column_name || '" TYPE UUID USING "' || r.column_name || '"::UUID';
    END LOOP;
END $$;

-- Recreate foreign key constraints
-- (These will be recreated by Prisma, but we'll let db push handle it)

