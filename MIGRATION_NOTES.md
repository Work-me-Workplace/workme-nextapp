# WorkContext Refactor Migration Notes

## Breaking Changes

The WorkContext refactor introduces a breaking change:
- `WorkContext.type` changed from `String` to `ContextType` enum
- This requires a database migration

## Migration Options

### Option 1: Force Reset (⚠️ DESTROYS ALL DATA)
```bash
npx prisma db push --force-reset
```
**Warning:** This will delete all WorkContext data in the database.

### Option 2: Custom Migration (Recommended for Production)
Create a Prisma migration that:
1. Creates the `ContextType` enum
2. Updates existing `WorkContext.type` values (they should already be valid)
3. Changes the column type from `String` to `ContextType`

Example SQL migration:
```sql
-- Create enum
CREATE TYPE "ContextType" AS ENUM (
  'campaign',
  'impact_event',
  'training',
  'event',
  'community',
  'benefits',
  'career',
  'employee_cause'
);

-- Update column type
ALTER TABLE "WorkContext" 
  ALTER COLUMN "type" TYPE "ContextType" 
  USING "type"::"ContextType";
```

### Option 3: Development/Testing
If you're in development and don't need to preserve data:
```bash
npx prisma db push --force-reset
npx prisma db seed  # if you have seed data
```

## What Changed

### Schema Changes
- ✅ Added `ContextType` enum
- ✅ Changed `WorkContext.type` from `String` to `ContextType`
- ✅ All typed context models unchanged

### Code Changes
- ✅ Created factory layer: `/lib/server/context-factory.ts`
- ✅ Created schemas: `/lib/server/context-schemas.ts`
- ✅ Created enrichment: `/lib/server/get-work-context.ts`
- ✅ Updated API routes to use factory pattern
- ✅ All CRUD operations now use transactions
- ✅ Consistent WorkMeId handling

### API Routes
- ✅ `POST /api/context/create/[type]` - Uses factory
- ✅ `GET /api/context/[contextId]` - Uses factory enrichment
- ✅ `PUT /api/context/[contextId]` - Uses factory with validation
- ✅ `DELETE /api/context/[contextId]` - Uses factory with transaction

## Benefits

1. **Type Safety**: Enum ensures only valid context types
2. **Transactions**: All operations are atomic
3. **Consistency**: Single factory pattern for all CRUD
4. **Validation**: Zod schemas for all context types
5. **Ownership**: All operations validate WorkMeId

## Next Steps

1. Run the migration script to verify existing data:
   ```bash
   npx tsx lib/server/migrate-context-type.ts
   ```

2. Choose migration option above

3. Deploy and test all context CRUD operations

4. Update any remaining code using old patterns to use factory functions

