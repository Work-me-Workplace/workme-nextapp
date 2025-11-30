# companyId Audit Report

**Date:** 2025-01-28  
**Purpose:** Complete audit of all `companyId` usage before refactoring to `companyUnit` + `companyDivision`  
**Status:** ✅ Audit Complete - Ready for Refactoring

---

## Executive Summary

This audit found **951 instances** of `companyId` usage across the codebase. All instances must be either:
- **Removed** (from User/WorkMe model)
- **Replaced with `companyUnit`** (required routing identity)
- **Replaced with `companyUnit` + `companyDivision`** (optional grouping)

---

## 1. PRISMA SCHEMA

### 1.1 WorkMe Model
**File:** `prisma/schema.prisma`  
**Lines:** 21-22 (already updated in previous refactor)

**Current State:**
- ✅ `companyId` removed
- ✅ `companyUnit` added (String?)
- ✅ `companyDivision` added (String?)
- ✅ `company` relation removed

**Action Required:** ✅ COMPLETE

---

### 1.2 CompanyX Models (WorkContext)
**File:** `prisma/schema.prisma`

#### CompanyCampaign (Line 397)
- **Line 397:** `companyId String`
- **Line 398:** `company Company @relation(...)`
- **Line 402:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for campaigns
- **Action:** Replace with `companyUnit` + `companyDivision`, remove Company relation, update index

#### CompanyImpactEvent (Line 418)
- **Line 418:** `companyId String`
- **Line 419:** `company Company @relation(...)`
- **Line 423:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for impact events
- **Action:** Replace with `companyUnit` + `companyDivision`, remove Company relation, update index

#### CompanyTraining (Line 461)
- **Line 461:** `companyId String`
- **Line 462:** `company Company @relation(...)`
- **Line 466:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for trainings
- **Action:** Replace with `companyUnit` + `companyDivision`, remove Company relation, update index

#### CompanyEvent (Line 506)
- **Line 506:** `companyId String`
- **Line 507:** `company Company @relation(...)`
- **Line 513:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for events
- **Action:** Replace with `companyUnit` + `companyDivision`, remove Company relation, update index

#### CompanyCommunity (Line 545)
- **Line 545:** `companyId String`
- **Line 546:** `company Company @relation(...)`
- **Line 550:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for communities
- **Action:** Replace with `companyUnit` + `companyDivision`, remove Company relation, update index

#### CompanyBenefits (Line 571)
- **Line 571:** `companyId String`
- **Line 572:** `company Company @relation(...)`
- **Line 576:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for benefits
- **Action:** Replace with `companyUnit` + `companyDivision`, remove Company relation, update index

#### CompanyCareer (Line 620)
- **Line 620:** `companyId String`
- **Line 621:** `company Company @relation(...)`
- **Line 624:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for careers
- **Action:** Replace with `companyUnit` + `companyDivision`, remove Company relation, update index

#### CompanyEmployeeCause (Line 645)
- **Line 645:** `companyId String`
- **Line 646:** `company Company @relation(...)`
- **Line 650:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for employee causes
- **Action:** Replace with `companyUnit` + `companyDivision`, remove Company relation, update index

---

### 1.3 Legacy Work Models

#### CommsOutput (Line 297)
- **Line 297:** `companyId String`
- **Line 298:** `company Company @relation(...)`
- **Line 313:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping (deprecated model)
- **Action:** Replace with `companyUnit` + `companyDivision`

#### Objective (Line 320)
- **Line 320:** `companyId String`
- **Line 321:** `company Company @relation(...)`
- **Line 334:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping (deprecated model)
- **Action:** Replace with `companyUnit` + `companyDivision`

#### Achievement (Line 341)
- **Line 341:** `companyId String`
- **Line 342:** `company Company @relation(...)`
- **Line 368:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping (deprecated model)
- **Action:** Replace with `companyUnit` + `companyDivision`

#### WorkOutputStandalone (Line 732)
- **Line 732:** `companyId String`
- **Line 733:** `company Company @relation(...)`
- **Purpose:** Multi-tenant scoping for standalone outputs
- **Action:** Replace with `companyUnit` + `companyDivision`

#### NTK (Line 761)
- **Line 761:** `companyId String`
- **Line 762:** `company Company @relation(...)`
- **Purpose:** Multi-tenant scoping for NTK documents
- **Action:** Replace with `companyUnit` + `companyDivision`

#### NTKEdition (Line 791)
- **Line 791:** `companyId String`
- **Line 792:** `company Company @relation(...)`
- **Line 796:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for NTK editions
- **Action:** Replace with `companyUnit` + `companyDivision`

#### WorkCommsProduct (Line 847)
- **Line 847:** `companyId String`
- **Line 848:** `company Company @relation(...)`
- **Line 853:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for work comms products
- **Action:** Replace with `companyUnit` + `companyDivision`

#### WorkforceComms (Line 873)
- **Line 873:** `companyId String`
- **Line 874:** `company Company @relation(...)`
- **Line 881:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for workforce comms
- **Action:** Replace with `companyUnit` + `companyDivision`

#### WorkforceCommsDraft (Line 904)
- **Line 904:** `companyId String`
- **Line 905:** `company Company @relation(...)`
- **Line 909:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for workforce comms drafts
- **Action:** Replace with `companyUnit` + `companyDivision`

#### WorkforceCommsEdition (Line 928)
- **Line 928:** `companyId String`
- **Line 929:** `company Company @relation(...)`
- **Purpose:** Multi-tenant scoping for workforce comms editions
- **Action:** Replace with `companyUnit` + `companyDivision`

#### CompanyWorkLink (Line 686)
- **Line 686:** `companyId String`
- **Line 687:** `company Company @relation(...)`
- **Line 700:** `@@index([companyId])`
- **Purpose:** Multi-tenant scoping for work links
- **Action:** Replace with `companyUnit` + `companyDivision`

---

### 1.4 WorkWorld Architecture Models

#### CompanyUnit (Line 217)
- **Line 217:** `companyId String` (references CompanyRegistry, NOT Company)
- **Purpose:** Part of WorkWorld architecture - references CompanyRegistry
- **Action:** ⚠️ KEEP AS IS - This is a different `companyId` (references CompanyRegistry)

#### Workplace (Line 235)
- **Line 235:** `companyId String` (references CompanyRegistry, NOT Company)
- **Purpose:** Part of WorkWorld architecture - references CompanyRegistry
- **Action:** ⚠️ KEEP AS IS - This is a different `companyId` (references CompanyRegistry)

---

## 2. SERVER-SIDE AUTHENTICATION & VERIFICATION

### 2.1 verifyAuth Function
**File:** `lib/server/verifyAuth.ts`

#### Line 5 (Comment)
- **Usage:** Comment: "Returns authenticated user's workMeId and companyId"
- **Action:** Update comment to reference `companyUnit`

#### Line 17 (Interface)
- **Usage:** `companyId: string // Required - user must belong to a company`
- **Purpose:** TypeScript interface for verified auth
- **Action:** Replace with `companyUnit: string | null` and `companyDivision: string | null`

#### Line 60-70 (Prisma Query)
- **Usage:** `include: { company: { select: { id: true, name: true } } }`
- **Purpose:** Fetches Company relation for user
- **Action:** Remove Company include, fetch `companyUnit` and `companyDivision` directly

#### Line 77-80 (Validation)
- **Usage:** `if (!workMe.companyId) { throw new Error('User must belong to a company') }`
- **Purpose:** Enforces company membership
- **Action:** Replace with `if (!workMe.companyUnit) { throw new Error('User must set a companyUnit') }`

#### Line 84 (Return Value)
- **Usage:** `companyId: workMe.companyId`
- **Purpose:** Returns companyId in VerifiedAuth
- **Action:** Replace with `companyUnit: workMe.companyUnit, companyDivision: workMe.companyDivision`

#### Line 85 (Return Value)
- **Usage:** `companyName: workMe.company?.name || null`
- **Purpose:** Returns company name
- **Action:** Remove - no longer needed

---

### 2.2 Hydration Route
**File:** `app/api/workme/hydrate/route.ts`

#### Line 11 (Comment)
- **Usage:** Comment: "Returns: - company: Company record (if user belongs to one)"
- **Action:** Update comment

#### Line 23 (Destructuring)
- **Usage:** `const { workMeId, companyId, firebaseId } = await verifyAuth(request)`
- **Purpose:** Extracts companyId from verifyAuth
- **Action:** Replace with `companyUnit` and `companyDivision`

#### Line 27 (Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace with `companyUnit, companyDivision`

#### Line 34-42 (Prisma Query)
- **Usage:** `include: { company: { select: { id: true, name: true, industry: true } } }`
- **Purpose:** Fetches Company relation
- **Action:** Remove Company include

#### Line 57-59 (Validation)
- **Usage:** `if (!workMe.companyId) { console.warn(...) }`
- **Purpose:** Warns if companyId missing
- **Action:** Replace with `if (!workMe.companyUnit) { console.warn(...) }`

#### Line 63 (Logging)
- **Usage:** `companyId: workMe.companyId,`
- **Action:** Replace with `companyUnit: workMe.companyUnit`

#### Line 76 (Response)
- **Usage:** `companyId: workMe.companyId,` in response
- **Action:** Replace with `companyUnit: workMe.companyUnit, companyDivision: workMe.companyDivision`

#### Line 84 (Response)
- **Usage:** `company: workMe.company,` in response
- **Action:** Remove - no longer needed

---

## 3. CONTEXT FACTORY (WorkContext Creation)

### 3.1 createTypedContext
**File:** `lib/server/context-factory.ts`

#### Line 27 (Comment)
- **Usage:** Comment: "@param companyId - The authenticated user's Company ID (required for multi-tenant)"
- **Action:** Update to reference `companyUnit`

#### Line 33 (Parameter)
- **Usage:** `companyId: string` function parameter
- **Action:** Replace with `companyUnit: string | null, companyDivision: string | null`

#### Line 39 (Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace with `companyUnit, companyDivision`

#### Line 47-50 (Validation)
- **Usage:** `if (!companyId) { throw new Error("User must belong to a company") }`
- **Action:** Replace with `if (!companyUnit) { throw new Error("User must set a companyUnit before creating work items") }`

#### Line 64 (Data Assignment)
- **Usage:** `companyId,` in Prisma create data
- **Action:** Replace with `companyUnit, companyDivision`

#### Line 72 (Logging)
- **Usage:** `companyId,` in success log
- **Action:** Replace with `companyUnit, companyDivision`

#### Line 80 (Logging)
- **Usage:** `companyId,` in error log
- **Action:** Replace with `companyUnit, companyDivision`

---

### 3.2 updateTypedContext
**File:** `lib/server/context-factory.ts`

#### Line 96 (Comment)
- **Usage:** Comment: "@param companyId - The authenticated user's Company ID (required for multi-tenant)"
- **Action:** Update comment

#### Line 103 (Parameter)
- **Usage:** `companyId: string` function parameter
- **Action:** Replace with `companyUnit` and `companyDivision`

#### Line 110 (Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace

#### Line 118 (Validation)
- **Usage:** `if (!companyId) { throw new Error("User must belong to a company") }`
- **Action:** Replace validation

#### Line 135 (Where Clause)
- **Usage:** `companyId, // Multi-tenant: ensure same company` in Prisma where
- **Action:** Replace with `companyUnit` filter

#### Line 145 (Logging)
- **Usage:** `companyId,` in success log
- **Action:** Replace

#### Line 154 (Logging)
- **Usage:** `companyId,` in error log
- **Action:** Replace

---

### 3.3 getTypedContext
**File:** `lib/server/context-factory.ts`

#### Line 164 (Comment)
- **Usage:** Comment: "Filters by companyId for multi-tenant security"
- **Action:** Update comment

#### Line 168 (Comment)
- **Usage:** Comment: "@param companyId - The company ID to scope the query (required for multi-tenant)"
- **Action:** Update comment

#### Line 173 (Parameter)
- **Usage:** `companyId: string` function parameter
- **Action:** Replace with `companyUnit`

#### Line 178 (Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace

#### Line 181 (Validation)
- **Usage:** `if (!companyId) { throw new Error("User must belong to a company") }`
- **Action:** Replace validation

#### Line 197 (Where Clause)
- **Usage:** `companyId, // Multi-tenant: ensure same company` in Prisma where
- **Action:** Replace with `companyUnit` filter

#### Line 204 (Logging)
- **Usage:** `companyId,` in success log
- **Action:** Replace

#### Line 214 (Logging)
- **Usage:** `companyId,` in error log
- **Action:** Replace

---

### 3.4 deleteTypedContext
**File:** `lib/server/context-factory.ts`

#### Line 229 (Comment)
- **Usage:** Comment: "@param companyId - The authenticated user's Company ID (required for multi-tenant)"
- **Action:** Update comment

#### Line 235 (Parameter)
- **Usage:** `companyId: string` function parameter
- **Action:** Replace with `companyUnit`

#### Line 241 (Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace

#### Line 249 (Validation)
- **Usage:** `if (!companyId) { throw new Error("User must belong to a company") }`
- **Action:** Replace validation

#### Line 269 (Where Clause)
- **Usage:** `companyId, // Multi-tenant: ensure same company` in Prisma where
- **Action:** Replace with `companyUnit` filter

#### Line 277 (Logging)
- **Usage:** `companyId,` in success log
- **Action:** Replace

#### Line 286 (Logging)
- **Usage:** `companyId,` in error log
- **Action:** Replace

---

## 4. API ROUTES

### 4.1 Context Creation Route
**File:** `app/api/context/create/[type]/route.ts`

#### Line 39 (Destructuring)
- **Usage:** `const { workMeId, companyId } = await verifyAuth(request)`
- **Purpose:** Extracts companyId from auth
- **Action:** Replace with `companyUnit` and `companyDivision`

#### Line 48 (Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace

#### Line 83 (Function Call)
- **Usage:** `await createTypedContext(type as ContextType, cleanData, workMeId, companyId)`
- **Action:** Replace with `companyUnit` and `companyDivision`

---

### 4.2 Context List Route
**File:** `app/api/context/route.ts`

#### Line 16 (Destructuring)
- **Usage:** `const { workMeId, companyId } = await verifyAuth(request)`
- **Action:** Replace with `companyUnit` and `companyDivision`

#### Line 20 (Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace

#### Lines 26, 30, 34, 38, 42, 46, 50, 54 (Prisma Queries)
- **Usage:** `where: { companyId }` in all CompanyX findMany queries
- **Purpose:** Multi-tenant filtering
- **Action:** Replace all with `where: { companyUnit }` (and optionally `companyDivision`)

#### Line 87 (Logging)
- **Usage:** `companyId,` in success log
- **Action:** Replace

---

### 4.3 Context Detail Route
**File:** `app/api/context/[contextId]/route.ts`

#### Line 22 (GET - Destructuring)
- **Usage:** `const { workMeId, companyId } = await verifyAuth(request)`
- **Action:** Replace

#### Line 29 (GET - Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace

#### Line 60 (GET - Where Clause)
- **Usage:** `companyId, // Multi-tenant security` in Prisma where
- **Action:** Replace with `companyUnit`

#### Line 81 (GET - Function Call)
- **Usage:** `await getCompanyX(contextId, foundType, companyId)`
- **Action:** Replace with `companyUnit`

#### Line 120 (PUT - Destructuring)
- **Usage:** `const { workMeId, companyId } = await verifyAuth(request)`
- **Action:** Replace

#### Line 129 (PUT - Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace

#### Line 158 (PUT - Where Clause)
- **Usage:** `companyId, // Multi-tenant security` in Prisma where
- **Action:** Replace with `companyUnit`

---

### 4.4 Events Hydrate Route
**File:** `app/api/events/hydrate/route.ts`

#### Line 14 (Comment)
- **Usage:** Comment: "- companyId: Company ID to hydrate events for"
- **Action:** Update comment

#### Line 18 (Destructuring)
- **Usage:** `const { workMeId, companyId } = await verifyAuth(request)`
- **Action:** Replace

#### Line 20 (Query Param)
- **Usage:** `const requestedCompanyId = searchParams.get('companyId')`
- **Action:** Replace with `requestedCompanyUnit`

#### Line 23 (Variable)
- **Usage:** `const targetCompanyId = requestedCompanyId || companyId`
- **Action:** Replace with `targetCompanyUnit`

#### Line 25 (Validation)
- **Usage:** `if (!targetCompanyId) { return error }`
- **Action:** Replace with `targetCompanyUnit`

#### Line 36 (Prisma Query)
- **Usage:** `select: { companyId: true }` to verify access
- **Action:** Replace with `select: { companyUnit: true }`

#### Line 39 (Validation)
- **Usage:** `if (!workMe || workMe.companyId !== targetCompanyId)`
- **Action:** Replace with `workMe.companyUnit !== targetCompanyUnit`

#### Line 49 (Prisma Query)
- **Usage:** `where: { companyId: targetCompanyId }` in findMany
- **Action:** Replace with `where: { companyUnit: targetCompanyUnit }`

#### Line 83 (Logging)
- **Usage:** `companyId: targetCompanyId,` in success log
- **Action:** Replace

---

### 4.5 WorkStuff Ingest Routes
**Files:** Multiple files in `app/api/workstuff/ingest/`

#### `app/api/workstuff/ingest/type-infer/route.ts` (Line 18)
- **Usage:** `if (!auth.workMeId || !auth.companyId)`
- **Action:** Replace with `companyUnit`

#### `app/api/workstuff/ingest/create-training/route.ts` (Lines 18, 25, 59, 76)
- **Usage:** Multiple `companyId` references
- **Action:** Replace all with `companyUnit`

#### `app/api/workstuff/ingest/career-hydrate/route.ts` (Lines 19, 26, 38)
- **Usage:** Validation and Prisma queries
- **Action:** Replace with `companyUnit`

#### `app/api/workstuff/ingest/career-save/route.ts` (Lines 39, 46, 60)
- **Usage:** Validation and Prisma create
- **Action:** Replace with `companyUnit`

#### `app/api/workstuff/ingest/training-save/route.ts` (Lines 39, 46, 60)
- **Usage:** Validation and Prisma create
- **Action:** Replace with `companyUnit`

#### `app/api/workstuff/ingest/training-hydrate/route.ts` (Lines 19, 26, 40)
- **Usage:** Validation and Prisma query
- **Action:** Replace with `companyUnit`

---

### 4.6 Workforce Stuff Routes
**Files:** Multiple files in `app/api/workforcestuff/`

#### `app/api/workforcestuff/career/[careerId]/route.ts` (Lines 18, 25, 31)
- **Usage:** Validation and Prisma query
- **Action:** Replace with `companyUnit`

#### `app/api/workforcestuff/training/[trainingId]/route.ts` (Lines 18, 25, 31)
- **Usage:** Validation and Prisma query
- **Action:** Replace with `companyUnit`

#### `app/api/workforcestuff/route.ts` (Lines 18, 25, 31, 36, 41, 46, 51, 56, 61)
- **Usage:** Multiple `where: { companyId }` clauses
- **Action:** Replace all with `companyUnit`

---

## 5. SERVER ACTIONS

### 5.1 Work Context Actions
**File:** `lib/actions/work-context.ts`

#### Line 19 (Prisma Query)
- **Usage:** `select: { companyId: true }` to get user's companyId
- **Action:** Replace with `select: { companyUnit: true, companyDivision: true }`

#### Line 22 (Validation)
- **Usage:** `if (!workMe?.companyId) return companyX`
- **Action:** Replace with `if (!workMe?.companyUnit) return companyX`

#### Line 24 (Function Call)
- **Usage:** `await getTypedContext(type, companyX.id, workMe.companyId)`
- **Action:** Replace with `workMe.companyUnit`

#### Line 45 (Prisma Query)
- **Usage:** `select: { companyId: true }` to get user's companyId
- **Action:** Replace

#### Line 48 (Validation)
- **Usage:** `if (!workMe?.companyId) { return error }`
- **Action:** Replace with `companyUnit` validation

#### Line 72 (Data Assignment)
- **Usage:** `companyId: workMe.companyId,` in Prisma create
- **Action:** Replace with `companyUnit` and `companyDivision`

#### Line 94 (Prisma Query)
- **Usage:** `select: { companyId: true }` to get user's companyId
- **Action:** Replace

#### Line 97 (Validation)
- **Usage:** `if (!workMe?.companyId) { return error }`
- **Action:** Replace

#### Lines 104, 108, 112, 116, 120, 124, 128, 132 (Prisma Queries)
- **Usage:** Multiple `where: { companyId: workMe.companyId }` clauses
- **Action:** Replace all with `where: { companyUnit: workMe.companyUnit }`

#### Line 194 (Prisma Query)
- **Usage:** `select: { companyId: true }` to get user's companyId
- **Action:** Replace

#### Line 197 (Validation)
- **Usage:** `if (!workMe?.companyId) { return error }`
- **Action:** Replace

#### Line 222 (Where Clause)
- **Usage:** `companyId: workMe.companyId, // Multi-tenant security`
- **Action:** Replace with `companyUnit`

---

### 5.2 CompanyX Actions
**File:** `lib/actions/companyx-actions.ts`

#### Lines 15, 33, 51, 69, 87, 105, 123, 141 (Multiple Functions)
- **Usage:** `const { workMeId, companyId } = await verifyAuth()`
- **Usage:** `if (!workMeId || !companyId) { return error }`
- **Usage:** `await createTypedContext(..., workMeId, companyId)`
- **Action:** Replace all with `companyUnit` and `companyDivision`

---

### 5.3 Get Work Context Utility
**File:** `lib/server/get-work-context.ts`

#### Line 7 (Comment)
- **Usage:** Comment: "Filters by companyId for multi-tenant security"
- **Action:** Update comment

#### Line 15 (Comment)
- **Usage:** Comment: "@param companyId - The company ID to scope the query"
- **Action:** Update comment

#### Line 20 (Parameter)
- **Usage:** `companyId: string` function parameter
- **Action:** Replace with `companyUnit: string | null`

#### Line 25 (Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace

#### Line 29 (Validation)
- **Usage:** `if (!companyId) { return null }`
- **Action:** Replace with `companyUnit` validation

#### Line 69 (Where Clause)
- **Usage:** `companyId, // Multi-tenant: ensure same company` in Prisma where
- **Action:** Replace with `companyUnit`

#### Line 87 (Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace

#### Line 102 (Logging)
- **Usage:** `companyId,` in console.log
- **Action:** Replace

---

## 6. CLIENT-SIDE COMPONENTS

### 6.1 AuthProvider
**File:** `lib/providers/AuthProvider.tsx`

#### Line 16 (Interface)
- **Usage:** `companyId: string | null` in Session interface
- **Action:** Replace with `companyUnit: string | null, companyDivision: string | null`

#### Line 34 (Initial State)
- **Usage:** `companyId: null,` in initial session
- **Action:** Replace

#### Line 57 (Initial State)
- **Usage:** `companyId: null,` in initial session
- **Action:** Replace

#### Line 91 (Session Assignment)
- **Usage:** `companyId: workMe.companyId,` from hydration response
- **Action:** Replace with `companyUnit` and `companyDivision`

#### Lines 104-105 (localStorage)
- **Usage:** `if (newSession.companyId) { localStorage.setItem('companyId', newSession.companyId) }`
- **Action:** Replace with `companyUnit` and `companyDivision` storage

#### Line 114 (Logging)
- **Usage:** `companyId: newSession.companyId,` in console.log
- **Action:** Replace

#### Line 126 (Error State)
- **Usage:** `companyId: null,` in error state
- **Action:** Replace

#### Line 137 (Cleanup)
- **Usage:** `localStorage.removeItem('companyId')`
- **Action:** Replace with `companyUnit` and `companyDivision` removal

#### Line 153 (Logout State)
- **Usage:** `companyId: null,` in logout state
- **Action:** Replace

#### Line 164 (Cleanup)
- **Usage:** `localStorage.removeItem('companyId')`
- **Action:** Replace

---

### 6.2 Event Components
**File:** `components/events/EventManualForm.tsx`

#### Lines 106-107
- **Usage:** `const companyId = localStorage.getItem('companyId')` and `if (companyId) { ... }`
- **Purpose:** Gets companyId from localStorage for API calls
- **Action:** Replace with `companyUnit` from localStorage

---

### 6.3 MyWork Pages
**File:** `app/mywork/page.tsx`

#### Line 83 (State)
- **Usage:** `const [companyId, setCompanyId] = useState<string | null>(null)`
- **Action:** Replace with `companyUnit`

#### Line 88 (Hook)
- **Usage:** `useEventHydration(companyId)` hook call
- **Action:** Replace with `companyUnit`

#### Line 93 (localStorage)
- **Usage:** `const storedCompanyId = localStorage.getItem('companyId')`
- **Action:** Replace with `companyUnit`

#### Line 99 (State Setter)
- **Usage:** `setCompanyId(storedCompanyId)`
- **Action:** Replace with `setCompanyUnit`

#### Lines 107-111 (useEffect)
- **Usage:** `if (companyId && !eventsHydrated) { refreshEvents() }`
- **Action:** Replace with `companyUnit`

#### Lines 116-120 (useEffect)
- **Usage:** `if (companyId) { refreshEvents(); loadContexts() }`
- **Action:** Replace with `companyUnit`

---

**File:** `app/mywork/events/page.tsx`

#### Line 14 (State)
- **Usage:** `const [companyId, setCompanyId] = useState<string | null>(null)`
- **Action:** Replace with `companyUnit`

#### Line 17 (Hook)
- **Usage:** `useEventHydration(companyId)` hook call
- **Action:** Replace

#### Line 22 (localStorage)
- **Usage:** `const storedCompanyId = localStorage.getItem('companyId')`
- **Action:** Replace

#### Line 28 (State Setter)
- **Usage:** `setCompanyId(storedCompanyId)`
- **Action:** Replace

#### Lines 35-39 (useEffect)
- **Usage:** `if (companyId && !hydrated && !eventsLoading) { refreshEvents() }`
- **Action:** Replace

#### Lines 44-50 (useEffect)
- **Usage:** `if (companyId) { refreshEvents() }`
- **Action:** Replace

---

**File:** `app/attention/events/[eventId]/view/page.tsx`

#### Line 16 (Comment)
- **Usage:** Comment: "Get companyId from localStorage (hydrated by AuthProvider)"
- **Action:** Update comment

#### Line 17 (State)
- **Usage:** `const [companyId, setCompanyId] = useState<string | null>(null)`
- **Action:** Replace

#### Line 24 (Hook)
- **Usage:** `useEventHydration(companyId)` hook call
- **Action:** Replace

#### Line 28 (localStorage)
- **Usage:** `const storedCompanyId = localStorage.getItem('companyId')`
- **Action:** Replace

#### Line 30 (State Setter)
- **Usage:** `setCompanyId(storedCompanyId)`
- **Action:** Replace

---

### 6.4 Event Hydration Hook
**File:** `lib/hooks/useEventHydration.ts`

#### Line 22 (Comment)
- **Usage:** Comment: "@param {string} companyId - Company ID to hydrate events for"
- **Action:** Update comment

#### Line 25 (Parameter)
- **Usage:** `companyId: string | null` function parameter
- **Action:** Replace with `companyUnit: string | null`

#### Line 42 (Validation)
- **Usage:** `if (!companyId) { setLoading(false); return }`
- **Action:** Replace with `companyUnit`

#### Line 48 (localStorage Key)
- **Usage:** `localStorage.getItem(`eventHydration_${companyId}`)`
- **Action:** Replace with `eventHydration_${companyUnit}`

#### Line 65 (Validation)
- **Usage:** `if (!companyId) { setError('companyId is required') }`
- **Action:** Replace with `companyUnit`

#### Line 75 (API Call)
- **Usage:** `api.get(`/api/events/hydrate?companyId=${companyId}`)`
- **Action:** Replace with `companyUnit` query param

#### Line 101 (localStorage Key)
- **Usage:** `localStorage.setItem(`eventHydration_${companyId}`, ...)`
- **Action:** Replace with `companyUnit`

---

## 7. SCRIPTS

### 7.1 User Management Scripts
**Files:** `scripts/delete-user.ts`, `scripts/restore-user.ts`, `scripts/upsert-user.ts`, `scripts/list-all-users.ts`, `scripts/lookup-user.ts`

**Usage:** All scripts reference `companyId` in:
- Prisma queries with `include: { company: { ... } }`
- Console.log statements showing `companyId`
- Comments referencing companyId

**Action:** Update all scripts to:
- Remove Company relation includes
- Show `companyUnit` and `companyDivision` instead
- Update comments

---

## 8. DOCUMENTATION

### 8.1 Documentation Files
**Files:** Multiple `.md` files in `docs/`

**Usage:** Documentation references `companyId` in:
- Architecture descriptions
- Model definitions
- API route documentation
- Migration guides

**Action:** Update all documentation to reference `companyUnit` and `companyDivision`

**Key Files:**
- `docs/USER_DELETION_INVESTIGATION.md`
- `docs/COMPANY_MODEL_INSPECTION.md`
- `docs/ARCHITECTURE_MAP_REPORT.md`
- `docs/archive/SYSTEM_AUDIT_REPORT.md`
- `docs/archive/WORKCONTEXT_AUDIT_REPORT.md`
- `docs/TRAINING_MODEL_CURRENT_STATE.md`
- `docs/COMPANY_CAREER_MODEL.md`

---

## 9. REDIS KEYS

### 9.1 Redis Usage
**File:** `lib/redis.ts`

**Status:** ✅ No `companyId` found in Redis keys

**Action:** When implementing Redis keys for companyUnit:
- Use format: `workme:context:${companyUnit}`
- Use format: `workme:signals:${companyUnit}`
- Use format: `workme:ntk:${companyUnit}`
- If division used: `workme:context:${companyUnit}:${companyDivision}`

---

## 10. MIGRATION SUMMARY

### 10.1 Prisma Schema Changes Required

1. **WorkMe Model:** ✅ Already updated
2. **All CompanyX Models:** Replace `companyId` with `companyUnit` + `companyDivision`
3. **All Legacy Work Models:** Replace `companyId` with `companyUnit` + `companyDivision`
4. **Remove all Company relations** from work models
5. **Update all indexes** from `@@index([companyId])` to `@@index([companyUnit])`

### 10.2 Code Changes Required

1. **verifyAuth:** Return `companyUnit` + `companyDivision` instead of `companyId`
2. **All API Routes:** Use `companyUnit` for filtering instead of `companyId`
3. **All Server Actions:** Use `companyUnit` for validation and queries
4. **All Client Components:** Use `companyUnit` from localStorage instead of `companyId`
5. **All Hooks:** Accept `companyUnit` parameter instead of `companyId`

### 10.3 Validation Changes Required

1. **Replace:** `if (!companyId)` → `if (!companyUnit)`
2. **Replace:** `where: { companyId }` → `where: { companyUnit }`
3. **Replace:** Error messages referencing "company" → "companyUnit"

### 10.4 localStorage Changes Required

1. **Replace:** `localStorage.getItem('companyId')` → `localStorage.getItem('companyUnit')`
2. **Replace:** `localStorage.setItem('companyId', ...)` → `localStorage.setItem('companyUnit', ...)`
3. **Add:** `localStorage.setItem('companyDivision', ...)` for optional division

---

## 11. PRIORITY ORDER FOR REFACTORING

1. **Phase 1: Prisma Schema** (Foundation)
   - Update all CompanyX models
   - Update all legacy work models
   - Create migration

2. **Phase 2: Core Server Functions** (Authentication)
   - Update `verifyAuth`
   - Update `createTypedContext`
   - Update `updateTypedContext`
   - Update `getTypedContext`
   - Update `deleteTypedContext`

3. **Phase 3: API Routes** (Endpoints)
   - Update hydration routes
   - Update context routes
   - Update event routes
   - Update workstuff routes

4. **Phase 4: Server Actions** (Business Logic)
   - Update work-context actions
   - Update companyx-actions
   - Update all Prisma queries

5. **Phase 5: Client Components** (UI)
   - Update AuthProvider
   - Update all pages using companyId
   - Update all hooks
   - Update localStorage usage

6. **Phase 6: Scripts & Documentation** (Cleanup)
   - Update all scripts
   - Update all documentation

---

## 12. TESTING CHECKLIST

After refactoring, verify:

- [ ] User can sign up without companyId
- [ ] User is redirected to `/setup/unit` if `companyUnit` is missing
- [ ] User can set `companyUnit` and `companyDivision` in setup flow
- [ ] WorkContext creation requires `companyUnit`
- [ ] All API routes filter by `companyUnit` correctly
- [ ] All Prisma queries use `companyUnit` instead of `companyId`
- [ ] localStorage stores `companyUnit` instead of `companyId`
- [ ] Hydration works with `companyUnit`
- [ ] Event hydration works with `companyUnit`
- [ ] No references to `companyId` remain (except CompanyRegistry models)

---

**END OF AUDIT REPORT**

