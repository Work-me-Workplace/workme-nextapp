# Digital Signage Workforce Achievement Migration Plan

## Overview

This migration refactors `ProductDigitalSignWorkforceAchievement` from the old structure to the new CommsIQ Signage Build Guide v2.0 structure.

## Changes

### Old Structure
- `personName` (String, required)
- `unit` (String?, nullable)
- `achievement` (String, required)
- `details` (String?, nullable)

### New Structure
- `headline` (String, required) - e.g., "Sarah Johnson — Excellence Award"
- `subhead` (String?, nullable) - e.g., "Congratulations, Sarah! Recognized by SEA 05..."
- `detailBlock` (String?, nullable) - e.g., "NAVSEA Excellence Award · 2025"
- `runtimeGuidance` (String?, nullable) - Default: "1 week"
- `imageAssetId` (String?, nullable) - FK to Asset (blob-backed)
- `employeeId` (String?, nullable) - FK to CompanyEmployee
- `highlightId` (String?, nullable) - FK to CompanyEmployeeHighlight

## Migration Steps

### 1. Run the Migration Script

```bash
# Review the migration script first
cat scripts/migrate-digital-signage-workforce-achievement.sql

# Execute the migration
npx prisma db execute --file scripts/migrate-digital-signage-workforce-achievement.sql --schema prisma/schema.prisma
```

### 2. Verify Data Migration

```sql
-- Check that all rows have headline
SELECT COUNT(*) FROM "ProductDigitalSignWorkforceAchievement" WHERE "headline" IS NULL;
-- Should return 0

-- Check sample migrated data
SELECT "headline", "subhead", "detailBlock", "runtimeGuidance" 
FROM "ProductDigitalSignWorkforceAchievement" 
LIMIT 5;
```

### 3. Update Prisma Client

```bash
npx prisma generate
```

### 4. Test Application

- Verify existing digital signage products still display correctly
- Test creating new digital signage from highlights
- Verify asset linking works

### 5. Drop Old Columns (After Verification)

Once you've confirmed everything works:

1. Uncomment Step 7 in the migration script
2. Run the script again to drop old columns
3. Or run manually:

```sql
ALTER TABLE "ProductDigitalSignWorkforceAchievement"
  DROP COLUMN IF EXISTS "personName",
  DROP COLUMN IF EXISTS "unit",
  DROP COLUMN IF EXISTS "achievement",
  DROP COLUMN IF EXISTS "details";
```

## Data Migration Strategy

The migration script converts old data to new structure:

- **headline**: `personName + ' — ' + achievement` (truncated to 50 chars)
- **subhead**: `achievement` (full text)
- **detailBlock**: `details` (if available)
- **runtimeGuidance**: Default to `'1 week'`

**Note**: This is a best-effort migration. The new structure is designed for AI-generated content, so manually migrated data may not match the exact format. New records created via the builder service will have proper formatting.

## Rollback Plan

If issues occur:

1. The old columns are still present (Step 7 is commented out)
2. You can revert the schema.prisma changes
3. Run `npx prisma generate` to restore old types
4. Application should continue working with old structure

## Safety Checks

The migration includes:
- ✅ Nullable columns added first
- ✅ Data backfilled before making required
- ✅ Safety check verifies no NULL headlines
- ✅ Indexes created before constraints
- ✅ Old columns preserved until verification complete

## Related Files

- `prisma/schema.prisma` - Updated model definition
- `scripts/migrate-digital-signage-workforce-achievement.sql` - Migration script
- `lib/services/digital-sign-employee-highlight-builder-service.ts` - New builder service
- `app/api/digital-signage/create/route.ts` - Updated API route

