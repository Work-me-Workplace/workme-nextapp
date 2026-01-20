# Milestone Creation Path Analysis

## Problem Statement

The UX for creating company milestones is confusing because there are multiple paths, some of which are overbuilt (schema supports them but code doesn't), and it's unclear which path users should use.

## Current State: Multiple Creation Paths

### Path 1: Direct Milestone Creation (News Artifact Flow)

**Location:** `/mycompany/milestones/new`

**Flow:**
1. User selects "Generate w/ AI"
2. User pastes URL or text
3. Creates `CompanyNewsArtifact` (stores raw text)
4. Calls `/api/company/milestones/upsert` 
5. Parses artifact with AI
6. Creates `CompanyMilestone` with `newsArtifactId` link

**Code:**
- UI: `app/mycompany/milestones/new/page.tsx`
- API: `app/api/company/milestones/upsert/route.ts`
- Schema: `CompanyMilestone.newsArtifactId` (optional link)

**Status:** ✅ **IMPLEMENTED AND USED**

---

### Path 2: Platform Product Creation (Bulk Milestone Creation)

**Location:** Platform product creation flow

**Flow:**
1. User creates platform product with units
2. Parses platform data (includes milestones array)
3. Creates `CompanyMilestone` records for each milestone found

**Code:**
- API: `app/api/company/products/platform/create-with-units/route.ts` (lines 85-129)
- Creates milestones directly from parsed platform data
- Links milestones to platform units via `platformUnitId`
- Does NOT use `newsArtifactId` or `updateId`

**Status:** ✅ **IMPLEMENTED** - Used when creating platforms from articles

---

### Path 3: Manual Milestone Creation (Platform Unit Context)

**Location:** `/company/products/milestones/new`

**Flow:**
1. User manually enters milestone details
2. Can link to `platformUnitId` (optional)
3. Creates `CompanyMilestone` directly

**Code:**
- UI: `app/company/products/milestones/new/page.tsx`
- API: `app/api/company/products/milestones/create/route.ts`
- Creates milestone with manual data
- Can link to `platformUnitId` but not `updateId` or `newsArtifactId`

**Status:** ✅ **IMPLEMENTED** - Simple manual creation

---

### Path 4: Platform Unit Update → Milestone (THEORETICAL - NOT IMPLEMENTED)

**Location:** ⚠️ **DOES NOT EXIST**

**Proposed Flow:**
1. User creates `CompanyPlatformUnitUpdate` (from article/statement)
2. Update contains milestone information (e.g., "keel laid on 2024-01-15")
3. System extracts milestone from update
4. Creates `CompanyMilestone` with `updateId` link

**Schema Support:**
- ✅ `CompanyMilestone.updateId` exists (optional, unique)
- ✅ Schema comment says: "PROVENANCE: updateId is OPTIONAL - links back to the update that triggered this milestone"
- ✅ Documentation (`docs/PLATFORM_UNIT_UPDATE_MILESTONE_ARCHITECTURE.md`) describes this flow

**Code:**
- ❌ **NO CODE EXISTS** to create milestones from updates
- ❌ `/api/company/products/platform/unit/update/create` does NOT create milestones
- ❌ No UI exists to "extract milestone from update"

**Status:** ⚠️ **SCHEMA SUPPORTS IT BUT CODE DOESN'T EXIST**

**Evidence:**
```typescript
// app/api/company/products/platform/unit/update/create/route.ts
// Line 49-50:
// Check if milestones should be created from the update
// This would be enhanced with AI parsing to detect milestone events
// ❌ NO IMPLEMENTATION
```

---

### Path 5: Clip Parser (Blocked for Milestones)

**Location:** `/signal/google` (Google Scan)

**Flow:**
1. User searches for articles
2. User clicks "Ingest Article"
3. Calls `/api/signalingest/clip/parse`
4. **RECENTLY FIXED:** Now returns error for milestones instead of auto-creating

**Status:** ✅ **BLOCKED** - Returns error directing users to news artifact flow

---

## The Confusion: Update → Milestone Path

### What Was Built

1. **Schema:** `CompanyMilestone.updateId` field exists
2. **Documentation:** `docs/PLATFORM_UNIT_UPDATE_MILESTONE_ARCHITECTURE.md` describes the flow
3. **Schema Comments:** Says "links back to the update that triggered this milestone"

### What Wasn't Built

1. **No Code:** No API endpoint to create milestones from updates
2. **No UI:** No user interface to extract milestones from updates
3. **No Logic:** Update creation doesn't detect/extract milestones

### Why This Is Confusing

1. **Schema implies it exists** - The `updateId` field suggests milestones can come from updates
2. **Documentation describes it** - The architecture doc explains how it should work
3. **But code doesn't do it** - Users can't actually use this path
4. **Users don't know which path to use** - Multiple paths exist, unclear which is "right"

---

## Current Reality vs. Intended Design

### Current Reality (What Actually Works)

```
Article/Text
  ↓
CompanyNewsArtifact (created)
  ↓
CompanyMilestone (created directly with newsArtifactId)
```

**OR**

```
Platform Product Creation
  ↓
Parsed Milestones Array
  ↓
CompanyMilestone (created directly, linked to platformUnitId)
```

**OR**

```
Manual Entry
  ↓
CompanyMilestone (created directly)
```

### Intended Design (From Documentation)

```
Article
  ↓
CompanyPlatformUnitStatement (created)
  ↓
CompanyPlatformUnitUpdate (created from statement)
  ↓
CompanyMilestone (extracted from update, linked via updateId)
```

**BUT THIS DOESN'T EXIST IN CODE**

---

## Questions to Answer

### 1. Do We Need the Update → Milestone Path?

**Arguments FOR:**
- ✅ Preserves provenance (know which update triggered milestone)
- ✅ Rich context (update has narrative, quotes, etc.)
- ✅ Traceability (can link back to original article/statement)

**Arguments AGAINST:**
- ❌ Adds complexity (another step in the pipeline)
- ❌ Current paths work fine (news artifact → milestone works)
- ❌ Updates and milestones serve different purposes (ongoing vs. discrete)
- ❌ One milestone per update (unique constraint on `updateId`) is limiting

### 2. What Should Users Use?

**For Milestones from Articles:**
- ✅ **Use:** News Artifact → Milestone (Path 1)
- ❌ **Don't use:** Update → Milestone (doesn't exist)

**For Platform Milestones:**
- ✅ **Use:** Platform Product Creation (Path 2) OR Manual (Path 3)

### 3. Should We Remove Update → Milestone Support?

**Option A: Remove It**
- Remove `updateId` from schema
- Simplify documentation
- Clearer: milestones come from news artifacts or manual entry

**Option B: Implement It**
- Build the update → milestone extraction logic
- Add UI to extract milestones from updates
- More complex but more traceable

**Option C: Keep Schema But Don't Use**
- Keep `updateId` for future use
- Don't implement now
- Document that it's not implemented
- **CURRENT STATE** - but confusing

---

## Recommendations

### Immediate (Reduce Confusion)

1. **Document the Gap**
   - Update `PLATFORM_UNIT_UPDATE_MILESTONE_ARCHITECTURE.md` to clearly state: "⚠️ Update → Milestone flow is NOT IMPLEMENTED"
   - Clarify which paths actually work

2. **Clarify User Flows**
   - Make it clear in UI which path to use
   - For articles: Use News Artifact flow
   - For platform units: Use manual or platform creation flow

### Short Term (Decide on Update → Milestone)

1. **Decide if we need it**
   - Evaluate if update → milestone adds value
   - Consider: Does it solve a real problem or just add complexity?

2. **If we don't need it:**
   - Remove `updateId` from schema (breaking change, but cleaner)
   - Update documentation
   - Simplify milestone creation to 3 clear paths

3. **If we do need it:**
   - Implement the extraction logic
   - Build UI for it
   - Make it a clear, discoverable path

### Long Term (Simplify)

1. **Consider consolidating paths**
   - Do we really need 3+ ways to create milestones?
   - Can we simplify to 1-2 clear paths?

2. **Better UX**
   - Make it obvious which path to use
   - Guide users based on their use case
   - Reduce cognitive load

---

## Code Locations

- **Milestone Creation (News Artifact):** `app/api/company/milestones/upsert/route.ts`
- **Milestone Creation (Platform):** `app/api/company/products/platform/create-with-units/route.ts`
- **Milestone Creation (Manual):** `app/api/company/products/milestones/create/route.ts`
- **Update Creation:** `app/api/company/products/platform/unit/update/create/route.ts`
- **Update → Milestone:** ⚠️ **DOES NOT EXIST**

## Summary

**The Problem:**
- Schema and docs suggest milestones can come from updates
- But code doesn't implement this path
- Users don't know which path to use
- Multiple paths exist with unclear distinctions

**The Fix:**
- Decide if update → milestone path is needed
- If yes: implement it
- If no: remove schema support and clarify docs
- Either way: make user flows clearer

**Verdict:**
- ⚠️ **OVERBUILT** - Schema supports it but code doesn't
- ⚠️ **UNCLEAR** - Users don't know which path to use
- ✅ **SOLUTION:** Decide on update → milestone, then either implement or remove

