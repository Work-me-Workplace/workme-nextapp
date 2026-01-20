# CompanyMilestone Deprecation Analysis

## The Problem

**User Insight:** "Company milestone might be deprecated and I like just the product/platform updates and company milestone is no kidding like the entire company does something"

**Current Issue:**
- CompanyMilestone is being used for platform-specific events (e.g., "USNS Lansing (T-EPF-7) Christening")
- But it should be for **company-wide** milestones (entire company does something)
- Platform-specific milestones should just be **platform updates**
- **No delete endpoint exists** - can't even remove bad data

## Current Misuse

### What CompanyMilestone Is Being Used For (WRONG)

1. **Platform Unit Events** (e.g., "USNS Lansing (T-EPF-7) Christening")
   - ❌ This is platform-specific, not company-wide
   - ✅ Should be: `CompanyPlatformUnitUpdate` with milestone info

2. **Platform Product Milestones** (keel laying, delivery, etc.)
   - ❌ These are platform-specific
   - ✅ Should be: `CompanyPlatformUnitUpdate` or platform product updates

### What CompanyMilestone SHOULD Be For (CORRECT)

**Company-Wide Milestones:**
- Entire company reorganization
- Major company-wide contract award
- Company-wide strategic initiative launch
- Company merger/acquisition
- Company-wide achievement (e.g., "Company reaches 10,000 employees")
- Company-wide policy change

**Key Distinction:**
- **CompanyMilestone:** Entire company does something
- **Platform Update:** Specific platform/unit does something

## Current State

### Schema Definition

```prisma
// Generic company-level milestones (platform events, business milestones, strategic milestones)
model CompanyMilestone {
  // ...
  platformUnitId String? // OPTIONAL - provides context when milestone relates to a platform unit
  // ...
}
```

**Problem:** Schema comment says "platform events" but user says those should be platform updates, not company milestones.

### Current Usage

1. **Platform Product Creation** creates CompanyMilestone records
   - `app/api/company/products/platform/create-with-units/route.ts`
   - Creates milestones for platform units
   - ❌ **WRONG** - These should be platform updates

2. **News Artifact → Milestone** creates CompanyMilestone
   - `app/api/company/milestones/upsert/route.ts`
   - Creates milestones from articles
   - ⚠️ **MIXED** - Some might be company-wide, some platform-specific

3. **Manual Creation** creates CompanyMilestone
   - `app/api/company/products/milestones/create/route.ts`
   - Can link to `platformUnitId`
   - ⚠️ **MIXED** - Can create platform-specific or company-wide

## The Fix

### Option A: Deprecate CompanyMilestone for Platform Events

**Keep CompanyMilestone for:**
- ✅ Company-wide milestones only
- ✅ No `platformUnitId` linkage (or make it clear it's just context, not ownership)

**Use Platform Updates for:**
- ✅ All platform-specific milestones
- ✅ Platform unit events (keel laying, delivery, etc.)
- ✅ Platform product milestones

**Migration:**
- Existing platform-specific CompanyMilestone records → Convert to platform updates
- Keep only company-wide milestones in CompanyMilestone

### Option B: Remove CompanyMilestone Entirely

**Use Platform Updates for:**
- ✅ All platform-specific milestones

**Use Other Models for:**
- ✅ Company-wide events → Maybe `CompanyEvent` or new model?
- ✅ Strategic initiatives → Maybe `CompanyCampaign` or new model?

**Migration:**
- All CompanyMilestone records → Convert to appropriate model
- Remove CompanyMilestone model entirely

## Immediate Issues

### 1. No Delete Endpoint

**Problem:** Can't delete milestones even if they're wrong

**Fix:** Add delete endpoint
- `DELETE /api/company/milestones/[id]`
- Check companyId ownership
- Delete milestone

### 2. Unclear Purpose

**Problem:** Users don't know when to use CompanyMilestone vs Platform Updates

**Fix:** 
- Update schema comments to clarify: "Company-wide milestones only"
- Update UI to guide users
- Deprecate platform-specific milestone creation

## Recommendations

### Short Term

1. **Add Delete Endpoint**
   - `DELETE /api/company/milestones/[id]/route.ts`
   - Allow users to remove bad data

2. **Clarify Purpose**
   - Update schema comments
   - Update UI labels/descriptions
   - Make it clear: "Company-wide milestones only"

### Medium Term

1. **Deprecate Platform-Specific Milestone Creation**
   - Block creating CompanyMilestone with `platformUnitId`
   - Or redirect to platform update creation

2. **Migrate Existing Data**
   - Identify platform-specific milestones
   - Convert to platform updates
   - Keep only company-wide milestones

### Long Term

1. **Decide on CompanyMilestone Future**
   - Keep for company-wide only?
   - Or remove entirely and use other models?

## Code Locations

- **Milestone Creation (Platform):** `app/api/company/products/platform/create-with-units/route.ts`
- **Milestone Creation (News Artifact):** `app/api/company/milestones/upsert/route.ts`
- **Milestone Creation (Manual):** `app/api/company/products/milestones/create/route.ts`
- **Milestone Detail Page:** `app/mycompany/milestones/[id]/page.tsx`
- **Milestone List Page:** `app/mycompany/milestones/page.tsx`
- **Delete Endpoint:** ⚠️ **DOES NOT EXIST**

## Questions

1. **Should we keep CompanyMilestone at all?**
   - If yes: Only for company-wide milestones
   - If no: What replaces it for company-wide events?

2. **What about company-wide strategic milestones?**
   - Merger, acquisition, reorganization
   - Should these be CompanyMilestone or another model?

3. **How do we handle the migration?**
   - Convert existing platform-specific milestones to updates?
   - Or just deprecate and let them sit?

## Summary

**The Core Issue:**
- CompanyMilestone is being used for platform-specific events
- But it should be for company-wide milestones only
- Platform-specific events should be platform updates
- No way to delete bad data

**The Solution:**
- Add delete endpoint (immediate)
- Clarify purpose (short term)
- Deprecate platform-specific milestone creation (medium term)
- Decide on CompanyMilestone future (long term)

