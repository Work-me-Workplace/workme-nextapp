# Context Cleanup Report - Deep Dive Analysis

**Date:** 2025-11-26  
**Goal:** Remove all WorkContext references and migrate to CompanyX architecture

---

## 📋 FILES FOUND WITH CONTEXT REFERENCES

### 1. API Routes (3 files)
- ✅ `app/api/context/route.ts` - **FIXED** (uses CompanyX models)
- ✅ `app/api/context/[contextId]/route.ts` - **FIXED** (searches CompanyX models)
- ✅ `app/api/context/create/[type]/route.ts` - **FIXED** (creates CompanyX directly)

### 2. Pages - Context Routes (12 files)
- ❌ `app/mywork/context/page.tsx` - **NEEDS REWRITE/DELETE**
- ❌ `app/mywork/context/[contextId]/page.tsx` - **NEEDS REWRITE** (TypeScript error)
- ❌ `app/mywork/context/[contextId]/success/page.tsx` - **NEEDS REWRITE/DELETE**
- ❌ `app/mywork/context/new/page.tsx` - **NEEDS REWRITE**
- ❌ `app/mywork/context/new/campaign/page.tsx` - **NEEDS REWRITE**
- ❌ `app/mywork/context/new/impact-event/page.tsx` - **NEEDS REWRITE**
- ❌ `app/mywork/context/new/training/page.tsx` - **NEEDS REWRITE**
- ❌ `app/mywork/context/new/event/page.tsx` - **NEEDS REWRITE**
- ❌ `app/mywork/context/new/community/page.tsx` - **NEEDS REWRITE**
- ❌ `app/mywork/context/new/benefits/page.tsx` - **NEEDS REWRITE**
- ❌ `app/mywork/context/new/career/page.tsx` - **NEEDS REWRITE**
- ❌ `app/mywork/context/new/employee-cause/page.tsx` - **NEEDS REWRITE**

### 3. Pages - Other References (8 files)
- ⚠️ `app/mywork/page.tsx` - Uses `getWorkContexts()` (already updated, may need review)
- ⚠️ `app/mywork/support/[routerId]/page.tsx` - **DELETE** (WorkSupport removed)
- ⚠️ `app/mywork/support/[routerId]/setup/page.tsx` - **DELETE** (WorkSupport removed)
- ⚠️ `app/attention/events/[eventId]/view/page.tsx` - May reference WorkEvent
- ⚠️ `app/career/page.tsx` - May reference WorkContext
- ⚠️ `app/mywork/events/page.tsx` - May reference WorkContext
- ⚠️ `app/mywork/outputs/builder/[outputId]/page.tsx` - May reference WorkContext
- ⚠️ `app/workforce-comms/[productId]/drafts/[draftId]/page.tsx` - May reference eventRouterIds

### 4. Library Files (7 files)
- ✅ `lib/actions/work-context.ts` - **UPDATED** (uses CompanyX)
- ✅ `lib/server/get-work-context.ts` - **UPDATED** (uses CompanyX)
- ✅ `lib/server/context-factory.ts` - **UPDATED** (uses CompanyX)
- ❌ `lib/actions/work-support.ts` - **DELETE** (WorkSupport removed)
- ❌ `lib/actions/work-event-router.ts` - **DELETE** (WorkEventRouter removed)
- ❌ `lib/server/migrate-context-type.ts` - **DELETE** (migration script, obsolete)
- ⚠️ `lib/actions/work-output.ts` - **REVIEW** (may reference WorkOutput model)

### 5. Components (1 file)
- ⚠️ `components/events/EventTemplatePicker.tsx` - May reference WorkContext

### 6. Types (1 file)
- ✅ `lib/types/context-type.ts` - **CREATED** (TypeScript type, not Prisma enum)

---

## 🗑️ FILES TO DELETE

### Obsolete Server Actions
1. `lib/actions/work-support.ts` - WorkSupport model deleted
2. `lib/actions/work-event-router.ts` - WorkEventRouter model deleted
3. `lib/server/migrate-context-type.ts` - Migration script, no longer needed

### Obsolete Pages
4. `app/mywork/support/[routerId]/page.tsx` - WorkSupport removed
5. `app/mywork/support/[routerId]/setup/page.tsx` - WorkSupport removed

---

## ✏️ FILES TO REWRITE

### Context Pages → CompanyX Pages
All `/mywork/context/*` pages need to be either:
- **Deleted** if functionality is obsolete
- **Rewritten** to use CompanyX models directly
- **Moved** to `/mywork/company/[companyId]/[type]` structure

**Decision:** Since these are creation/view pages for CompanyX models, they should be rewritten to work directly with CompanyX models, not deleted.

---

## 🔧 TYPESCRIPT ERRORS TO FIX

### Error 1: `app/mywork/context/[contextId]/page.tsx`
```typescript
// OLD (broken):
const result = await getWorkContext(contextId, clientWorkMeId)

// NEW (needs type parameter):
const result = await getWorkContext(contextId, type, clientWorkMeId)
```

**Problem:** `getWorkContext()` now requires `type: ContextType` parameter, but page doesn't have it.

**Solution:** 
- Option A: Get type from URL params (e.g., `/mywork/context/[type]/[id]`)
- Option B: Search across all CompanyX types to find the one with matching ID
- Option C: Delete this page if not needed

---

## 📊 CLEANUP PLAN

### Phase 1: Delete Obsolete Files
- [ ] Delete `lib/actions/work-support.ts`
- [ ] Delete `lib/actions/work-event-router.ts`
- [ ] Delete `lib/server/migrate-context-type.ts`
- [ ] Delete `app/mywork/support/*` directory

### Phase 2: Fix TypeScript Errors
- [ ] Fix `app/mywork/context/[contextId]/page.tsx` - Add type parameter or search logic
- [ ] Fix `app/mywork/context/[contextId]/success/page.tsx` - Update or delete
- [ ] Review `app/mywork/page.tsx` - Verify getWorkContexts() usage

### Phase 3: Rewrite Context Pages
- [ ] Rewrite context creation pages to use CompanyX models directly
- [ ] Update routes to match new architecture
- [ ] Remove all `/context/*` routes

### Phase 4: Review Other Files
- [ ] Review `lib/actions/work-output.ts` - Check for WorkOutput references
- [ ] Review components for WorkContext references
- [ ] Review other pages that may reference WorkContext

### Phase 5: Final Build Check
- [ ] Run `npm run build`
- [ ] Fix all remaining TypeScript errors
- [ ] Verify no context references remain

---

## 🎯 EXPECTED FINAL STRUCTURE

```
app/
  mywork/
    page.tsx                    # Main hub (uses getWorkContexts - already fixed)
    company/                    # NEW: Company-centric routes
      [companyId]/
        page.tsx
        events/
        campaigns/
        trainings/
        etc.
    outputs/                    # Keep (uses WorkCommsProduct)
    events/                     # Keep (uses CompanyEvent)
    # NO /context/* directory
    # NO /support/* directory
```

---

## ⚠️ BREAKING CHANGES

1. **Route Changes:**
   - `/mywork/context/*` → `/mywork/company/[companyId]/[type]/*`
   - `/mywork/support/*` → **DELETED**

2. **Function Signature Changes:**
   - `getWorkContext(id, workMeId)` → `getWorkContext(id, type, workMeId)`
   - `deleteWorkContext(id)` → `deleteWorkContext(id, type)`

3. **Model Changes:**
   - `WorkContext*` → `CompanyX*`
   - `WorkEventRouter` → **DELETED**
   - `WorkSupport` → **DELETED**

---

**Status:** Analysis complete, ready for cleanup execution.

