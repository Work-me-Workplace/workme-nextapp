# MyContribution Migration Needed

**Date:** February 6, 2026  
**Status:** ⚠️ **Migration Required**

## Schema Changes Made

### 1. Removed CompanyWork from MyContribution
- ❌ Removed `companyWorkId String?` field
- ❌ Removed `companyWork CompanyWork?` relation
- ❌ Removed `@@unique([workMeId, companyWorkId])` constraint
- ❌ Removed `@@index([companyWorkId])` index

### 2. Added SkillTopicIds to MyContribution
- ✅ Added `skillTopicIds String[] @default([])` field
- Links contributions to skills demonstrated

### 3. Added Reverse Relations to CompanyX Models
- ✅ Added `myContributions MyContribution[]` to:
  - CompanyEvent (already had it)
  - CompanyCampaign (already had it)
  - CompanyTraining (already had it)
  - CompanyImpactEvent (already had it)
  - CompanyCommunity (already had it)
  - **CompanyEmployeeCause** (NEW)
  - **CompanyBenefits** (NEW)
  - **CompanyCareer** (NEW)
  - **CompanyLeaderEngagement** (NEW)

### 4. Removed CompanyWork.contributions Relation
- ❌ Removed `contributions MyContribution[]` from CompanyWork
- MyContribution no longer links to CompanyWork

## Migration SQL Needed

When you run the migration, it will need to:

1. **Remove companyWorkId column** from MyContribution table
2. **Add skillTopicIds column** (String array) to MyContribution table
3. **Add reverse relation indexes** (if Prisma doesn't auto-create them)

## Migration Command

```bash
npx prisma migrate dev --name add_mycontribution_skills_and_fix_relations
```

## What Will Happen

1. **Data Loss Warning:** Any existing MyContribution records with `companyWorkId` will lose that reference
   - But since CompanyWork wasn't actually being used, this should be fine
   - MyContribution now links directly to CompanyX models

2. **New Field:** `skillTopicIds` will be added as empty array by default
   - Existing records will have `[]`
   - Can be populated later

3. **Relations:** Reverse relations added to CompanyX models
   - No data changes, just schema updates

## Verification

After migration, verify:
- ✅ MyContribution table has `skillTopicIds` column
- ✅ MyContribution table does NOT have `companyWorkId` column
- ✅ CompanyX models can query `myContributions`

## Rollback Plan

If needed, migration can be rolled back, but:
- Any `skillTopicIds` data will be lost
- `companyWorkId` would need to be re-added (but it wasn't being used anyway)
