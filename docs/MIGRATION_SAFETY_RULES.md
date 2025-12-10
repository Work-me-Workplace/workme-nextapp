# Migration Safety Rules

## ⚠️ CRITICAL: Never Use Destructive Flags

**NEVER run these commands unless explicitly requested by the user:**
- ❌ `--accept-data-loss` - Will delete data without warning
- ❌ `--force-reset` - Will wipe entire database  
- ❌ `--reset` - Will drop all data

## Step-by-Step Migration Pattern

When adding required columns to tables with existing data:

1. **Add columns as nullable first**
2. **Backfill data from existing relationships**
3. **Run safety check to verify all rows have values**
4. **Only then make columns required**
5. **Drop old structures only after data is migrated**

### Example SQL Pattern

```sql
-- Step 1: Add as nullable
ALTER TABLE "TableName" ADD COLUMN "newColumn" TYPE;

-- Step 2: Backfill from existing data
UPDATE "TableName" SET "newColumn" = (derived value) WHERE "newColumn" IS NULL;

-- Step 3: Safety check (MUST PASS before proceeding)
DO $$ 
DECLARE null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "TableName" WHERE "newColumn" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Safety check failed: % rows still have NULL values', null_count;
  END IF;
END $$;

-- Step 4: Make required (only after safety check passes)
ALTER TABLE "TableName" ALTER COLUMN "newColumn" SET NOT NULL;
```

## Safety Tools

- `scripts/safe-prisma.js` - Blocks destructive operations
- `scripts/prisma-safety-guard.sh` - Bash version of safety guard
- Always verify data integrity before making columns required

## When to Use `db push` vs Migrations

- **`db push`**: Safe when database and schema are already aligned (check with `migrate diff` first)
- **Migrations**: Required for production, preserves history, safer for data changes

## Always Check Before Applying

```bash
# Check what changes would be made
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script

# If empty, safe to proceed
# If changes shown, review carefully before applying
```
