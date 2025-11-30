# CompanyUnit Ingestion Migration Checklist

**Date:** 2025-01-28  
**Purpose:** Complete checklist for migrating company-level ingestion from `companyId` to `companyUnit` + `companyDivision`  
**Status:** 🔄 In Progress

---

## Executive Summary

This checklist covers the migration of ingestion routes for **Events**, **Training**, and **Career** from `companyId` to `companyUnit` + `companyDivision`. The Prisma schema already has `companyUnit` and `companyDivision` fields, but the ingestion code still uses `companyId`.

**Affected Domains:**
1. **Event Ingestion** - `/api/ingest/event/*`
2. **Training Ingestion** - `/api/workstuff/ingest/training-*`
3. **Career Ingestion** - `/api/workstuff/ingest/career-*`

---

## Prisma Schema Status

### ✅ Already Updated

All three models already have `companyUnit` and `companyDivision` fields:

- **CompanyEvent** (Line 486-487): `companyUnit String?`, `companyDivision String?`
- **CompanyTraining** (Line 441-442): `companyUnit String?`, `companyDivision String?`
- **CompanyCareer** (Line 600-601): `companyUnit String?`, `companyDivision String?`

**Action Required:** ✅ Schema is ready - no migration needed

---

## 1. EVENT INGESTION

### 1.1 Event AI Route
**File:** `app/api/ingest/event/ai/route.ts`

#### Line 36 (verifyAuth)
- **Current:** `const { workMeId, companyId } = await verifyAuth(request)`
- **Action:** Replace with `const { workMeId, companyUnit, companyDivision } = await verifyAuth(request)`

#### Line 40 (Logging)
- **Current:** `companyId,` in console.log
- **Action:** Replace with `companyUnit, companyDivision`

#### Line 209 (Logging)
- **Current:** `companyId,` in console.log
- **Action:** Replace with `companyUnit, companyDivision`

**Status:** ⬜ TODO

---

### 1.2 Event Save Route
**File:** `app/api/ingest/event/save/route.ts`

#### Line 20 (verifyAuth)
- **Current:** `const { workMeId, companyId } = await verifyAuth(request)`
- **Action:** Replace with `const { workMeId, companyUnit, companyDivision } = await verifyAuth(request)`

#### Line 26 (Logging)
- **Current:** `companyId,` in console.log
- **Action:** Replace with `companyUnit, companyDivision`

#### Line 34 (normalizeGPTIngestionOutput)
- **Current:** `normalizeGPTIngestionOutput(body, companyId, workMeId)`
- **Action:** Replace with `normalizeGPTIngestionOutput(body, companyUnit, companyDivision, workMeId)`

**Status:** ⬜ TODO

---

### 1.3 GPT JSON Mapper Service
**File:** `lib/server/gptJsonMapperService.ts`

#### Line 59 (Interface)
- **Current:** `companyId: string` in `NormalizedEventData`
- **Action:** Replace with `companyUnit: string | null, companyDivision: string | null`

#### Line 289 (Function Parameter)
- **Current:** `companyId: string,` in `normalizeGPTIngestionOutput`
- **Action:** Replace with `companyUnit: string | null, companyDivision: string | null,`

#### Line 315 (Data Assignment)
- **Current:** `companyId,` in eventData
- **Action:** Replace with `companyUnit, companyDivision`

**Status:** ⬜ TODO

---

### 1.4 Event Ingestion Server Action
**File:** `lib/actions/event-ingestion.ts`

#### Line 19 (verifyAuth)
- **Current:** `const { workMeId, companyId } = await verifyAuth()`
- **Action:** Replace with `const { workMeId, companyUnit, companyDivision } = await verifyAuth()`

#### Line 21 (Validation)
- **Current:** `if (!workMeId || !companyId)`
- **Action:** Replace with `if (!workMeId || !companyUnit)`

#### Line 30 (Logging)
- **Current:** `companyId,` in console.log
- **Action:** Replace with `companyUnit, companyDivision`

#### Line 38 (normalizeGPTIngestionOutput)
- **Current:** `normalizeGPTIngestionOutput(ingestionData, companyId, workMeId)`
- **Action:** Replace with `normalizeGPTIngestionOutput(ingestionData, companyUnit, companyDivision, workMeId)`

**Status:** ⬜ TODO

---

### 1.5 Promotional AI Route
**File:** `app/api/ingest/promotional/ai/route.ts`

#### Line 66 (verifyAuth)
- **Current:** `const { workMeId, companyId } = await verifyAuth(request)`
- **Action:** Replace with `const { workMeId, companyUnit, companyDivision } = await verifyAuth(request)`

#### Line 70, 204 (Logging)
- **Current:** `companyId,` in console.log
- **Action:** Replace with `companyUnit, companyDivision`

**Status:** ⬜ TODO

---

## 2. TRAINING INGESTION

### 2.1 Create Training Route
**File:** `app/api/workstuff/ingest/create-training/route.ts`

#### Line 18 (Validation)
- **Current:** `if (!auth.workMeId || !auth.companyId)`
- **Action:** Replace with `if (!auth.workMeId || !auth.companyUnit)`

#### Line 25 (Destructuring)
- **Current:** `const { companyId } = auth`
- **Action:** Replace with `const { companyUnit, companyDivision } = auth`

#### Line 59 (Prisma Create - Training)
- **Current:** `companyId,` in `companyTraining.create`
- **Action:** Replace with `companyUnit, companyDivision`

**Status:** ⬜ TODO

---

### 2.2 Training Hydrate Route
**File:** `app/api/workstuff/ingest/training-hydrate/route.ts`

#### Line 19 (Validation)
- **Current:** `if (!auth.workMeId || !auth.companyId)`
- **Action:** Replace with `if (!auth.workMeId || !auth.companyUnit)`

#### Line 26 (Destructuring)
- **Current:** `const { companyId } = auth`
- **Action:** Replace with `const { companyUnit, companyDivision } = auth`

#### Line 40 (Prisma Where Clause)
- **Current:** `where: { id: trainingId, companyId }`
- **Action:** Replace with `where: { id: trainingId, companyUnit }`

**Status:** ⬜ TODO

---

### 2.3 Training Save Route
**File:** `app/api/workstuff/ingest/training-save/route.ts`

#### Line 39 (Validation)
- **Current:** `if (!auth.workMeId || !auth.companyId)`
- **Action:** Replace with `if (!auth.workMeId || !auth.companyUnit)`

#### Line 46 (Destructuring)
- **Current:** `const { companyId } = auth`
- **Action:** Replace with `const { companyUnit, companyDivision } = auth`

#### Line 60 (Prisma Where Clause)
- **Current:** `where: { id: data.trainingId, companyId }`
- **Action:** Replace with `where: { id: data.trainingId, companyUnit }`

**Status:** ⬜ TODO

---

## 3. CAREER INGESTION

### 3.1 Create Training Route (Career Branch)
**File:** `app/api/workstuff/ingest/create-training/route.ts`

#### Line 76 (Prisma Create - Career)
- **Current:** `companyId,` in `companyCareer.create`
- **Action:** Replace with `companyUnit, companyDivision`

**Status:** ⬜ TODO

---

### 3.2 Career Hydrate Route
**File:** `app/api/workstuff/ingest/career-hydrate/route.ts`

#### Line 19 (Validation)
- **Current:** `if (!auth.workMeId || !auth.companyId)`
- **Action:** Replace with `if (!auth.workMeId || !auth.companyUnit)`

#### Line 26 (Destructuring)
- **Current:** `const { companyId } = auth`
- **Action:** Replace with `const { companyUnit, companyDivision } = auth`

#### Line 38 (Prisma Where Clause)
- **Current:** `where: { id: careerId, companyId }`
- **Action:** Replace with `where: { id: careerId, companyUnit }`

**Status:** ⬜ TODO

---

### 3.3 Career Save Route
**File:** `app/api/workstuff/ingest/career-save/route.ts`

#### Line 39 (Validation)
- **Current:** `if (!auth.workMeId || !auth.companyId)`
- **Action:** Replace with `if (!auth.workMeId || !auth.companyUnit)`

#### Line 46 (Destructuring)
- **Current:** `const { companyId } = auth`
- **Action:** Replace with `const { companyUnit, companyDivision } = auth`

#### Line 60 (Prisma Where Clause)
- **Current:** `where: { id: data.careerId, companyId }`
- **Action:** Replace with `where: { id: data.careerId, companyUnit }`

**Status:** ⬜ TODO

---

## 4. SHARED INGESTION ROUTES

### 4.1 Type Infer Route
**File:** `app/api/workstuff/ingest/type-infer/route.ts`

#### Line 18 (Validation)
- **Current:** `if (!auth.workMeId || !auth.companyId)`
- **Action:** Replace with `if (!auth.workMeId || !auth.companyUnit)`

**Status:** ⬜ TODO

---

## 5. MIGRATION SUMMARY

### 5.1 Files Requiring Changes

**Event Ingestion (4 files):**
- ⬜ `app/api/ingest/event/ai/route.ts`
- ⬜ `app/api/ingest/event/save/route.ts`
- ⬜ `lib/server/gptJsonMapperService.ts`
- ⬜ `lib/actions/event-ingestion.ts`
- ⬜ `app/api/ingest/promotional/ai/route.ts`

**Training Ingestion (3 files):**
- ⬜ `app/api/workstuff/ingest/create-training/route.ts`
- ⬜ `app/api/workstuff/ingest/training-hydrate/route.ts`
- ⬜ `app/api/workstuff/ingest/training-save/route.ts`

**Career Ingestion (3 files):**
- ⬜ `app/api/workstuff/ingest/create-training/route.ts` (career branch)
- ⬜ `app/api/workstuff/ingest/career-hydrate/route.ts`
- ⬜ `app/api/workstuff/ingest/career-save/route.ts`

**Shared (1 file):**
- ⬜ `app/api/workstuff/ingest/type-infer/route.ts`

**Total:** 12 files

---

### 5.2 Change Patterns

#### Pattern 1: verifyAuth Destructuring
```typescript
// BEFORE
const { workMeId, companyId } = await verifyAuth(request)

// AFTER
const { workMeId, companyUnit, companyDivision } = await verifyAuth(request)
```

#### Pattern 2: Validation Checks
```typescript
// BEFORE
if (!auth.workMeId || !auth.companyId)

// AFTER
if (!auth.workMeId || !auth.companyUnit)
```

#### Pattern 3: Prisma Where Clauses
```typescript
// BEFORE
where: { id: trainingId, companyId }

// AFTER
where: { id: trainingId, companyUnit }
```

#### Pattern 4: Prisma Create Data
```typescript
// BEFORE
data: {
  companyId,
  // ... other fields
}

// AFTER
data: {
  companyUnit,
  companyDivision,
  // ... other fields
}
```

#### Pattern 5: Function Parameters
```typescript
// BEFORE
function normalizeGPTIngestionOutput(
  gptOutput: GPTIngestionOutput,
  companyId: string,
  originatorId: string
)

// AFTER
function normalizeGPTIngestionOutput(
  gptOutput: GPTIngestionOutput,
  companyUnit: string | null,
  companyDivision: string | null,
  originatorId: string
)
```

#### Pattern 6: Interface Definitions
```typescript
// BEFORE
interface NormalizedEventData {
  companyId: string
  // ... other fields
}

// AFTER
interface NormalizedEventData {
  companyUnit: string | null
  companyDivision: string | null
  // ... other fields
}
```

---

## 6. TESTING CHECKLIST

After migration, verify:

### Event Ingestion
- [ ] Event AI parsing works with `companyUnit`
- [ ] Event save creates records with `companyUnit` and `companyDivision`
- [ ] Events are filtered correctly by `companyUnit` in queries
- [ ] Event ingestion server action works correctly

### Training Ingestion
- [ ] Create training route accepts `companyUnit`
- [ ] Training hydrate filters by `companyUnit`
- [ ] Training save validates `companyUnit` ownership
- [ ] Training records have `companyUnit` and `companyDivision` set

### Career Ingestion
- [ ] Create career route accepts `companyUnit`
- [ ] Career hydrate filters by `companyUnit`
- [ ] Career save validates `companyUnit` ownership
- [ ] Career records have `companyUnit` and `companyDivision` set

### Shared Routes
- [ ] Type inference works without `companyId` requirement

---

## 7. PRIORITY ORDER

1. **Phase 1: Core Service** (Foundation)
   - Update `lib/server/gptJsonMapperService.ts` (normalizeGPTIngestionOutput)
   - This is used by all event ingestion routes

2. **Phase 2: Event Ingestion** (Most Complex)
   - Update `app/api/ingest/event/ai/route.ts`
   - Update `app/api/ingest/event/save/route.ts`
   - Update `lib/actions/event-ingestion.ts`
   - Update `app/api/ingest/promotional/ai/route.ts`

3. **Phase 3: Training Ingestion** (Standard Pattern)
   - Update `app/api/workstuff/ingest/create-training/route.ts` (training branch)
   - Update `app/api/workstuff/ingest/training-hydrate/route.ts`
   - Update `app/api/workstuff/ingest/training-save/route.ts`

4. **Phase 4: Career Ingestion** (Standard Pattern)
   - Update `app/api/workstuff/ingest/create-training/route.ts` (career branch)
   - Update `app/api/workstuff/ingest/career-hydrate/route.ts`
   - Update `app/api/workstuff/ingest/career-save/route.ts`

5. **Phase 5: Shared Routes** (Simple)
   - Update `app/api/workstuff/ingest/type-infer/route.ts`

---

## 8. NOTES

- **Schema Ready:** All Prisma models already have `companyUnit` and `companyDivision` fields
- **No Migration Needed:** Database schema is already updated
- **verifyAuth Dependency:** This migration depends on `verifyAuth()` returning `companyUnit` and `companyDivision` instead of `companyId`
- **Backward Compatibility:** Ensure `companyDivision` is optional (can be `null`)
- **Validation:** Only `companyUnit` is required for multi-tenant scoping; `companyDivision` is optional

---

## 9. RELATED DOCUMENTATION

- `docs/COMPANYID_AUDIT_REPORT.md` - Complete audit of all `companyId` usage
- `docs/NTK_IMPLEMENTATION_ARCHITECTURE.md` - Example of comprehensive implementation documentation
- `docs/COMPANY_CAREER_MODEL.md` - Career model documentation
- `docs/EVENT_AI_INGESTION.md` - Event ingestion architecture

---

**END OF CHECKLIST**

