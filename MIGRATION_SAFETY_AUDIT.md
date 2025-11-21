# Migration Safety Audit Report
**Date:** December 2024  
**Purpose:** Pre-migration safety assessment before adding required `companyId` and `createdByWorkMeId` fields

---

## EXECUTIVE SUMMARY

**Database State:**
- ✅ **1 WorkMe record** - All have `companyId` assigned
- ✅ **1 Company record** - NAVSEA Naval Systems Command
- ⚠️ **1 WorkContext record** - Missing `companyId` (can be backfilled)
- ⚠️ **1 WorkContextCampaign record** - Missing `companyId` (can be backfilled)
- ✅ **All other tables empty** - No data to migrate

**Migration Risk Level:** 🟢 **LOW**  
**Recommended Strategy:** **Backfill from Creator's CompanyId**  
**Migration Approach:** **Three-Step Migration with Backfill**

---

## DETAILED TABLE AUDIT

### ✅ SAFE: No Migration Issues

| Table | Records | Status | Notes |
|-------|---------|--------|-------|
| WorkSupport | 0 | ✅ Safe | Empty table |
| WorkOutput | 0 | ✅ Safe | Empty table |
| WorkOutputStandalone | 0 | ✅ Safe | Empty table |
| WorkContextImpactEvent | 0 | ✅ Safe | Empty table |
| WorkContextTraining | 0 | ✅ Safe | Empty table |
| WorkContextEvent | 0 | ✅ Safe | Empty table |
| WorkContextCommunity | 0 | ✅ Safe | Empty table |
| WorkContextBenefits | 0 | ✅ Safe | Empty table |
| WorkContextCareer | 0 | ✅ Safe | Empty table |
| WorkContextEmployeeCause | 0 | ✅ Safe | Empty table |
| Achievement | 0 | ✅ Safe | Empty table |
| Objective | 0 | ✅ Safe | Empty table |
| CommsOutput | 0 | ✅ Safe | Empty table |
| WorkforceComms | 0 | ✅ Safe | Empty table |
| WorkforceCommsDraft | 0 | ✅ Safe | Empty table |
| WorkforceCommsEdition | 0 | ✅ Safe | Empty table |

### ⚠️ NEEDS BACKFILL: Can Derive companyId from Creator

| Table | Records | Missing Fields | Can Backfill? | Strategy |
|-------|---------|----------------|---------------|----------|
| **WorkContext** | 1 | `companyId` | ✅ YES | From `createdByWorkMeId` → WorkMe.companyId |
| **WorkContextCampaign** | 1 | `companyId` | ✅ YES | From `createdByWorkMeId` → WorkMe.companyId |

**Details:**
- WorkContext ID: `cmi8afdmq0001fq2nvmlx2w06`
  - CreatedBy: `493ff489-dcc3-4cdd-a7df-1a8c8b22bd75`
  - Creator's CompanyId: `3cb181b9-60e8-4306-8c74-4b3b954021ab` ✅
  
- WorkContextCampaign ID: `cmi8afdm50000fq2nq7t6uddz`
  - CreatedBy: `493ff489-dcc3-4cdd-a7df-1a8c8b22bd75`
  - Creator's CompanyId: `3cb181b9-60e8-4306-8c74-4b3b954021ab` ✅

### ✅ VERIFIED: Foundation Data

| Entity | Count | Status |
|--------|-------|--------|
| WorkMe | 1 | ✅ All have `companyId` |
| Company | 1 | ✅ Exists (NAVSEA Naval Systems Command) |

**WorkMe Details:**
- ID: `493ff489-dcc3-4cdd-a7df-1a8c8b22bd75`
- Email: `adam.cole.novadude@gmail.com`
- CompanyId: `3cb181b9-60e8-4306-8c74-4b3b954021ab` ✅
- Company: NAVSEA Naval Systems Command

---

## MIGRATION BLOCKERS ANALYSIS

### ✅ NO BLOCKERS IDENTIFIED

1. **WorkMe.companyId Status:** ✅ All WorkMe records have `companyId` assigned
2. **Company Records:** ✅ Company exists and is properly linked
3. **Orphaned Records:** ✅ None - all work records have valid creators with companyId
4. **Data Integrity:** ✅ All relationships are valid

---

## MODELS THAT WILL CAUSE MIGRATION FAILURE

### ❌ **None** - All records can be backfilled

**Reason:** All existing work records have:
- ✅ Valid `createdByWorkMeId` pointing to WorkMe
- ✅ WorkMe has valid `companyId`
- ✅ Company exists in database

**Backfill Strategy:**
```sql
-- For WorkContext
UPDATE "WorkContext" 
SET "companyId" = (
  SELECT "companyId" 
  FROM "WorkMe" 
  WHERE "WorkMe"."id" = "WorkContext"."createdByWorkMeId"
)
WHERE "companyId" IS NULL;

-- For WorkContextCampaign
UPDATE "WorkContextCampaign" 
SET "companyId" = (
  SELECT "companyId" 
  FROM "WorkMe" 
  WHERE "WorkMe"."id" = "WorkContextCampaign"."createdByWorkMeId"
)
WHERE "companyId" IS NULL;
```

---

## RECOMMENDED MIGRATION PLAN

### 🎯 **Strategy: Three-Step Migration with Backfill**

**Why This Approach:**
- ✅ Preserves existing data
- ✅ No data loss
- ✅ Safe rollback possible
- ✅ Minimal risk

### Step 1: Add Fields as Nullable

**Migration 1:** `add_company_id_nullable`

```prisma
// Add companyId as nullable first
model WorkContext {
  companyId String?  // Nullable initially
  // ... other fields
}

model WorkContextCampaign {
  companyId String?  // Nullable initially
  // ... other fields
}

// ... repeat for all models
```

**Action:** 
- Run `prisma migrate dev --name add_company_id_nullable`
- Schema adds fields as nullable
- No data loss risk

---

### Step 2: Backfill Data from Creator's CompanyId

**Backfill Script:** `scripts/backfill-company-id.ts`

```typescript
// Backfill WorkContext
const workContexts = await prisma.workContext.findMany({
  where: { companyId: null },
  include: { createdBy: { select: { companyId: true } } },
})

for (const ctx of workContexts) {
  if (ctx.createdBy?.companyId) {
    await prisma.workContext.update({
      where: { id: ctx.id },
      data: { companyId: ctx.createdBy.companyId },
    })
  }
}

// Repeat for all other models...
```

**Action:**
- Run backfill script
- Verify all records have `companyId`
- Check for any NULL values

---

### Step 3: Make Fields Required

**Migration 2:** `make_company_id_required`

```prisma
// Make companyId required
model WorkContext {
  companyId String  // Now required
  // ... other fields
}

model WorkContextCampaign {
  companyId String  // Now required
  // ... other fields
}

// ... repeat for all models
```

**Action:**
- Run `prisma migrate dev --name make_company_id_required`
- Verify migration succeeds
- All records now have required fields

---

## RECOMMENDATION: PRESERVE DATA (Not Wipe)

**Decision:** ✅ **DO NOT WIPE DATABASE**

**Rationale:**
1. ✅ Only 2 records exist (WorkContext + WorkContextCampaign)
2. ✅ Both can be safely backfilled from creator's companyId
3. ✅ No orphaned or invalid data
4. ✅ Low risk migration with proper backfill
5. ✅ Preserves user's work

**Alternative (Only if backfill fails):**
- If backfill script fails for any record
- Manually assign companyId to that specific record
- OR wipe only if user explicitly requests it

---

## DEFAULT VALUES (If Needed)

**For companyId backfill:**
- **Source:** WorkMe.companyId (via createdByWorkMeId)
- **Fallback:** None (all creators have companyId)

**For createdByWorkMeId:**
- **Already exists** in all models (no default needed)

**If NULL values found (should not happen):**
- **Do NOT use placeholder values**
- **Manually review and assign correct companyId**
- **OR delete orphaned records if no valid company can be assigned**

---

## EXACT MIGRATION SEQUENCE

### Phase 1: Add Nullable Fields

```bash
# 1. Ensure schema has companyId as nullable
# 2. Generate migration
npx prisma migrate dev --name add_company_id_nullable --create-only

# 3. Review migration SQL
# 4. Apply migration
npx prisma migrate dev
```

### Phase 2: Backfill Data

```bash
# 1. Run backfill script
npx tsx scripts/backfill-company-id.ts

# 2. Verify all records have companyId
npx tsx scripts/verify-company-id.ts
```

### Phase 3: Make Required

```bash
# 1. Update schema to make companyId required
# 2. Generate migration
npx prisma migrate dev --name make_company_id_required --create-only

# 3. Review migration SQL
# 4. Apply migration
npx prisma migrate dev
```

### Phase 4: Verify

```bash
# 1. Run final verification
npx tsx scripts/verify-migration.ts

# 2. Generate Prisma Client
npx prisma generate
```

---

## RISK MITIGATION

### ✅ Pre-Migration Checks

1. ✅ All WorkMe records have companyId
2. ✅ All work records have valid createdByWorkMeId
3. ✅ Company records exist
4. ✅ No orphaned relationships

### ✅ During Migration

1. ✅ Use nullable fields first (Step 1)
2. ✅ Backfill before making required (Step 2)
3. ✅ Verify backfill success (Step 2)
4. ✅ Make required only after verification (Step 3)

### ✅ Post-Migration Verification

1. ✅ All records have companyId
2. ✅ All foreign keys valid
3. ✅ No NULL values in required fields
4. ✅ Relations work correctly

---

## TABLES THAT WILL FAIL MIGRATION

### ❌ **NONE**

All tables are either:
- ✅ Empty (no migration needed)
- ✅ Can be backfilled from creator's companyId

**No migration failures expected.**

---

## FILES TO CREATE

### 1. Backfill Script
**File:** `scripts/backfill-company-id.ts`

**Purpose:** Backfill companyId for all existing records from creator's WorkMe.companyId

### 2. Verification Script
**File:** `scripts/verify-company-id.ts`

**Purpose:** Verify all records have companyId before making it required

### 3. Migration Verification Script
**File:** `scripts/verify-migration.ts`

**Purpose:** Final verification after migration completes

---

## CONCLUSION

**✅ MIGRATION IS SAFE TO PROCEED**

**Summary:**
- Only 2 records need backfilling
- Both can be safely backfilled
- No data loss risk
- Three-step migration approach recommended
- Preserve data (do not wipe)

**Next Steps:**
1. Create backfill script
2. Create Step 1 migration (nullable fields)
3. Run Step 1 migration
4. Run backfill script
5. Verify backfill success
6. Create Step 2 migration (required fields)
7. Run Step 2 migration
8. Final verification

**Estimated Time:** 30-45 minutes

---

**Report Generated:** December 2024  
**Status:** ✅ **SAFE TO MIGRATE**

