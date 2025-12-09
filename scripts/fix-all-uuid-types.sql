-- Fix all UUID foreign key types after db push
-- This converts TEXT columns that reference WorkMe.id to UUID type

-- Convert WorkMe.id to UUID (if not already)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'WorkMe' 
        AND column_name = 'id' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE "WorkMe" ALTER COLUMN "id" TYPE UUID USING "id"::UUID;
    END IF;
END $$;

-- Drop and recreate all foreign keys to WorkMe.id with correct types
DO $$ 
DECLARE
    r RECORD;
    fk_record RECORD;
BEGIN
    -- First, drop all FKs
    FOR fk_record IN (
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'WorkMe'
        AND ccu.column_name = 'id'
    ) LOOP
        EXECUTE 'ALTER TABLE "' || fk_record.table_name || '" DROP CONSTRAINT IF EXISTS "' || fk_record.constraint_name || '"';
    END LOOP;

    -- Convert all FK columns to UUID
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
        BEGIN
            EXECUTE 'ALTER TABLE "' || r.table_name || '" ALTER COLUMN "' || r.column_name || '" TYPE UUID USING "' || r.column_name || '"::UUID';
            RAISE NOTICE 'Converted %.% to UUID', r.table_name, r.column_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to convert %.%: %', r.table_name, r.column_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Recreate foreign keys (db push will handle this, but we can do it manually)
-- Actually, let db push recreate them

