# WorkContext Legacy Audit Report
**Date:** 2025-01-28  
**Purpose:** Complete audit of all "workcontext" references before cleanup

---

## 🔍 EXECUTIVE SUMMARY

**Total Files with References:** 72 files  
**Broken Imports:** ~35 files importing from deleted `lib/auth/getWorkContext.ts`  
**Legacy Functions:** Multiple functions with "WorkContext" in name  
**Status:** System is in broken state - many files reference deleted functions

---

## 📊 CATEGORIES OF REFERENCES

### 1. **BROKEN IMPORTS** (35 files)
Files importing from `@/lib/auth/getWorkContext` which was just deleted:

#### API Routes (30 files):
- `app/api/workstuff/ingest/create-training/route.ts`
- `app/api/workstuff/ingest/career-hydrate/route.ts`
- `app/api/workforce-stuff/ingest/supreme/route.ts`
- `app/api/workstuff/ingest/training-hydrate/route.ts`
- `app/api/workstuff/ingest/training-save/route.ts`
- `app/api/workstuff/ingest/type-infer/route.ts`
- `app/api/workstuff/ingest/career-save/route.ts`
- `app/api/workforcestuff/route.ts`
- `app/api/workforcestuff/career/[careerId]/route.ts`
- `app/api/workforcestuff/training/[trainingId]/route.ts`
- `app/api/workme/hydrate/route.ts`
- `app/api/user/update/route.ts`
- `app/api/ingest/promotional/ai/route.ts`
- `app/api/ingest/event/ai/route.ts`
- `app/api/ingest/event/save/route.ts`
- `app/api/ai/parse-event/route.ts`
- `app/api/events/hydrate/route.ts`
- `app/api/workforce-comms/generate/route.ts`
- `app/api/enrich/company/route.ts`
- `app/api/ntk/csv-preview/route.ts`
- `app/api/output-standalone/create/route.ts`
- `app/api/ntk/generate/route.ts`
- `app/api/ntk/editions/[editionId]/route.ts`
- `app/api/ntk/items/[itemId]/regenerate/route.ts`
- `app/api/ntk/items/[itemId]/mark-final/route.ts`
- `app/api/output-standalone/[id]/route.ts`
- `app/api/ntk/items/[itemId]/route.ts`
- `app/api/ntk/editions/route.ts`
- `app/api/output-standalone/route.ts`
- `app/api/ntk/[ntkId]/route.ts`
- `app/api/ntk/create/route.ts`
- `app/api/ntk/route.ts`

#### Server Actions (1 file):
- `lib/actions/companyx-actions.ts` (8 functions using it)

**Action Required:** Replace all `getWorkContext(firebaseId)` calls with `loadWorkMe(firebaseId)` pattern

---

### 2. **DELETED FILES** (Already removed)
- ✅ `lib/auth/getWorkContext.ts` - DELETED
- ✅ `lib/actions/work-context.ts` - DELETED (had `getWorkContext`, `getWorkContexts`, `deleteWorkContext`)
- ✅ `lib/server/get-work-context.ts` - DELETED (renamed to `get-company-x.ts`)

---

### 3. **BROKEN CLIENT IMPORTS** (4 files)
Files importing from deleted `lib/actions/work-context.ts`:

- `app/mywork/page.tsx` - imports `getWorkContexts`
- `app/workforce-comms/[productId]/drafts/new/page.tsx` - imports `getWorkContexts`
- `app/workforce-comms/[productId]/drafts/[draftId]/page.tsx` - imports `getWorkContexts`
- `app/mywork/context/[contextId]/success/page.tsx` - imports `getWorkContext`
- `app/mywork/context/[contextId]/page.tsx` - imports `getWorkContext`, `deleteWorkContext`
- `components/events/EventTemplatePicker.tsx` - imports `getWorkContexts`

**Action Required:** These need replacement functions or refactoring

---

### 4. **FIXED IMPORTS** (1 file)
- ✅ `app/api/context/[contextId]/route.ts` - Now imports from `@/lib/server/get-company-x.ts` (renamed)

---

### 5. **COMMENTS & DOCUMENTATION** (Multiple files)
References in comments/docs (non-breaking):

- `prisma/schema.prisma` - Comment: "// COMPANY MODELS (Renamed from WorkContext*)"
- `app/api/context/route.ts` - Comment: "List all WorkContexts"
- `app/api/context/[contextId]/route.ts` - Comments mentioning "WorkContext"
- Various docs files in `docs/` and `docs/archive/`

**Action Required:** Update comments for clarity

---

### 6. **VARIABLE NAMES** (Non-breaking, but confusing)
- `app/api/context/[contextId]/route.ts` - Variable `workContext` (should be `companyX`)
- `app/attention/events/[eventId]/view/page.tsx` - Variable `workContext` in state

**Action Required:** Rename variables for clarity

---

## 🎯 IDENTITY/AUTH FUNCTIONS EXPLAINED

### Current Identity Stack:

1. **`verifyAuth(request)`** - `lib/server/verifyAuth.ts`
   - **Purpose:** Pure Firebase authentication
   - **Returns:** `{ firebaseId, email, displayName, photoUrl }`
   - **Does NOT:** Fetch WorkMe, companyUnit, or membership
   - **Status:** ✅ Correct

2. **`loadWorkMe(firebaseId)`** - `lib/auth/loadWorkMe.ts`
   - **Purpose:** Load WorkMe identity from database
   - **Takes:** `firebaseId` (from verifyAuth)
   - **Returns:** `{ id, firebaseId, email, firstName, lastName, photoUrl, companyUnit, companyDivision }`
   - **Status:** ✅ Exists and works

3. **`loadMembership(workMeId, companyUnit)`** - `lib/auth/loadMembership.ts`
   - **Purpose:** Check WorkMe → CompanyUnit membership and role
   - **Takes:** `workMeId`, `companyUnit`
   - **Returns:** `{ id, workMeId, companyUnit, role, createdAt }`
   - **Status:** ✅ Exists but rarely used

### Intended Pattern:
```typescript
// 1. Auth
const { firebaseId } = await verifyAuth(request)

// 2. Load WorkMe
const workMe = await loadWorkMe(firebaseId)
const { id: workMeId, companyUnit, companyDivision } = workMe

// 3. (Optional) Load membership if needed
const membership = await loadMembership(workMeId, companyUnit)
```

---

## 🚨 CRITICAL ISSUES

### Issue 1: Broken Imports Everywhere
**35 files** are importing from `@/lib/auth/getWorkContext` which doesn't exist.

**Fix:** Replace with:
```typescript
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Then in code:
const { firebaseId } = await verifyAuth(request)
const workMe = await loadWorkMe(firebaseId)
const { id: workMeId, companyUnit, companyDivision } = workMe
```

### Issue 2: Missing Client Functions
**6 client files** need `getWorkContexts()` and `getWorkContext()` functions.

**Options:**
1. Create new server actions to replace them
2. Refactor client code to use different approach
3. Use `getCompanyX` directly (but it's not a server action)

### Issue 3: Naming Confusion
- `getWorkContext` was used for TWO different things:
  - Identity loading (what we deleted)
  - CompanyX model fetching (what `getCompanyX` does)

---

## 📋 CLEANUP PLAN

### Phase 1: Fix Broken Imports (35 files)
Replace all `getWorkContext` imports with `loadWorkMe` pattern

### Phase 2: Fix Client Imports (6 files)
Create replacement functions or refactor

### Phase 3: Clean Up Comments
Update all "WorkContext" references in comments to "CompanyX"

### Phase 4: Rename Variables
Rename `workContext` variables to `companyX` for clarity

---

## 📁 FILE BREAKDOWN

### API Routes Needing Fix: 30 files
All importing from deleted `getWorkContext`

### Server Actions Needing Fix: 1 file
- `lib/actions/companyx-actions.ts` (8 functions)

### Client Pages Needing Fix: 6 files
- `app/mywork/page.tsx`
- `app/workforce-comms/[productId]/drafts/new/page.tsx`
- `app/workforce-comms/[productId]/drafts/[draftId]/page.tsx`
- `app/mywork/context/[contextId]/success/page.tsx`
- `app/mywork/context/[contextId]/page.tsx`
- `components/events/EventTemplatePicker.tsx`

### Documentation Files: ~20 files
Non-breaking, but should be updated for accuracy

---

## ✅ WHAT'S WORKING

1. ✅ `verifyAuth` - Pure Firebase auth
2. ✅ `loadWorkMe` - Identity loading
3. ✅ `loadMembership` - Membership checking
4. ✅ `getCompanyX` - CompanyX model fetching (renamed from get-work-context)

---

## ❌ WHAT'S BROKEN

1. ❌ 35 files importing deleted `getWorkContext`
2. ❌ 6 client files importing deleted `work-context.ts` functions
3. ❌ Confusing naming throughout codebase

---

## 🎯 RECOMMENDATIONS

1. **Immediate:** Fix all 35 broken imports using `loadWorkMe` pattern
2. **Next:** Create replacement server actions for client-side `getWorkContexts()`
3. **Then:** Update all comments and variable names
4. **Finally:** Update documentation

---

**Status:** System is currently broken due to deleted files. Need systematic fix.

