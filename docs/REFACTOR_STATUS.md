# Work.me Architecture Refactor - Status Report

**Last Updated:** 2025-11-26  
**Refactor Goal:** Replace WorkContext with CompanyX models, remove WorkSupport/WorkEventRouter, normalize Work layer

---

## ✅ COMPLETED

### 1. Prisma Schema Refactor
- ✅ Renamed all `WorkContext*` models to `CompanyX` models:
  - `WorkContextCampaign` → `CompanyCampaign`
  - `WorkContextImpactEvent` → `CompanyImpactEvent`
  - `WorkContextTraining` → `CompanyTraining`
  - `WorkEvent` → `CompanyEvent`
  - `WorkContextCommunity` → `CompanyCommunity`
  - `WorkContextBenefits` → `CompanyBenefits`
  - `WorkContextCareer` → `CompanyCareer`
  - `WorkContextEmployeeCause` → `CompanyEmployeeCause`
- ✅ Deleted obsolete models:
  - `WorkSupport` (deleted)
  - `WorkOutput` (deleted)
  - `WorkEventRouter` (deleted)
  - `PromotionalWorkItem` (deleted)
- ✅ Created new models:
  - `CompanyWorkLink` (junction table linking CompanyX to WorkCommsProduct)
  - `WorkCommsProduct` (normalized wrapper for work outputs)
- ✅ Updated all relations in `WorkMe` and `Company` models
- ✅ Schema validated with `prisma format`

### 2. Core Library Files
- ✅ `lib/server/context-factory.ts` - Updated to work directly with CompanyX models (no router)
- ✅ `lib/actions/typed-contexts.ts` - All create/update functions use CompanyX models directly
- ✅ `lib/actions/work-context.ts` - Updated to query CompanyX models directly
- ✅ `lib/server/get-work-context.ts` - Replaced `getWorkEventRouter()` with `getCompanyX()`

### 3. File Deletions
- ✅ Deleted all WorkSupport routes:
  - `app/api/worksupport/route.ts`
  - `app/api/worksupport/[id]/route.ts`
  - `app/(authenticated)/worksupport/page.tsx`
  - `app/(authenticated)/worksupport/[workSupportId]/page.tsx`
  - `app/(authenticated)/worksupport/layout.tsx`

---

## 🚧 IN PROGRESS / PARTIALLY COMPLETE

### Core Library Files (Needs Review)
- ⚠️ `lib/actions/work-event-router.ts` - **NEEDS DELETION** (obsolete)
- ⚠️ `lib/actions/work-support.ts` - **NEEDS DELETION** (obsolete)
- ⚠️ `lib/actions/work-output.ts` - **NEEDS REFACTOR** (references WorkOutput model)
- ⚠️ `lib/server/migrate-context-type.ts` - **NEEDS REVIEW** (may be obsolete)
- ⚠️ `lib/hooks/useEventHydration.ts` - **NEEDS UPDATE** (references WorkEventRouter)

---

## ❌ NOT STARTED

### API Routes (22 files need updating)

#### Critical API Routes (WorkContext/WorkEventRouter references):
1. **`app/api/context/route.ts`** - GET endpoint still uses `workEventRouter.findMany()`
2. **`app/api/context/[contextId]/route.ts`** - GET/PUT still use `getWorkEventRouter()`
3. **`app/api/context/create/[type]/route.ts`** - Uses factory (should be OK, but verify)
4. **`app/api/events/hydrate/route.ts`** - Uses `workEventRouter.findMany()` and `workEvent.findMany()`
5. **`app/api/ingest/event/save/route.ts`** - Likely creates WorkEventRouter
6. **`app/api/workforce-comms/generate/route.ts`** - References `eventRouterIds` (deprecated field)

#### Other API Routes (may need updates):
- `app/api/events/*` - Various event-related endpoints
- `app/api/ingest/*` - Event ingestion endpoints
- Any other routes that reference WorkContext/WorkEventRouter

### Pages (22+ files need updating)

#### MyWork Pages (Context Management):
1. **`app/mywork/page.tsx`** - Main hub, likely uses `getWorkContexts()`
2. **`app/mywork/context/new/page.tsx`** - Context type selector
3. **`app/mywork/context/new/campaign/page.tsx`** - Create campaign
4. **`app/mywork/context/new/impact-event/page.tsx`** - Create impact event
5. **`app/mywork/context/new/training/page.tsx`** - Create training
6. **`app/mywork/context/new/community/page.tsx`** - Create community
7. **`app/mywork/context/new/benefits/page.tsx`** - Create benefits
8. **`app/mywork/context/new/career/page.tsx`** - Create career
9. **`app/mywork/context/new/employee-cause/page.tsx`** - Create employee cause
10. **`app/mywork/context/[contextId]/page.tsx`** - View/edit context
11. **`app/mywork/context/[contextId]/success/page.tsx`** - Success page

#### MyWork Support Pages (Should be deleted):
12. **`app/mywork/support/[routerId]/page.tsx`** - **DELETE** (WorkSupport removed)
13. **`app/mywork/support/[routerId]/setup/page.tsx`** - **DELETE** (WorkSupport removed)

#### Other Pages:
14. **`app/attention/events/[eventId]/view/page.tsx`** - Event view page
15. **`app/career/page.tsx`** - Career page
16. **`app/workforce-comms/[productId]/drafts/[draftId]/page.tsx`** - Draft page
17. **`app/workforce-comms/[productId]/drafts/new/page.tsx`** - New draft page

### Components (2+ files need updating)
1. **`components/events/EventTemplatePicker.tsx`** - References WorkContext
2. **`components/events/EventManualForm.tsx`** - May reference WorkContext
3. Any other components in `components/mywork/` or `components/events/`

---

## 🔥 CRITICAL BREAKING CHANGES

### Function Signature Changes

#### `getWorkContext()` - **BREAKING CHANGE**
**Before:**
```typescript
getWorkContext(id: string, clientWorkMeId?: string | null)
```

**After:**
```typescript
getWorkContext(id: string, type: ContextType, clientWorkMeId?: string | null)
```
**Impact:** All callers must now provide `type` parameter.

#### `deleteWorkContext()` - **BREAKING CHANGE**
**Before:**
```typescript
deleteWorkContext(id: string)
```

**After:**
```typescript
deleteWorkContext(id: string, type: ContextType)
```
**Impact:** All callers must now provide `type` parameter.

#### `getTypedContext()` - **BREAKING CHANGE**
**Before:**
```typescript
getTypedContext(workContext: { type: string; typeRefId: string })
```

**After:**
```typescript
getTypedContext(type: string, companyXId: string)
```
**Impact:** Function signature completely changed.

#### `getWorkEventRouter()` - **DEPRECATED**
**Replaced by:**
```typescript
getCompanyX(id: string, type: ContextType, companyId: string)
```
**Impact:** Legacy alias exists but should migrate to new function.

---

## 📋 MIGRATION CHECKLIST

### Phase 1: API Routes (HIGH PRIORITY)
- [ ] Update `app/api/context/route.ts` to query CompanyX models directly
- [ ] Update `app/api/context/[contextId]/route.ts` to use `getCompanyX()`
- [ ] Update `app/api/events/hydrate/route.ts` to query `CompanyEvent` directly
- [ ] Update `app/api/ingest/event/save/route.ts` to create `CompanyEvent` directly
- [ ] Update `app/api/workforce-comms/generate/route.ts` to use CompanyWorkLink instead of eventRouterIds
- [ ] Review and update all other API routes that reference WorkContext/WorkEventRouter

### Phase 2: Pages (HIGH PRIORITY)
- [ ] Update `app/mywork/page.tsx` to use new `getWorkContexts()` signature
- [ ] Update all `app/mywork/context/new/*` pages to work with CompanyX models
- [ ] Update `app/mywork/context/[contextId]/page.tsx` to require type parameter
- [ ] **DELETE** `app/mywork/support/*` pages (WorkSupport removed)
- [ ] Update `app/attention/events/[eventId]/view/page.tsx` to use CompanyEvent
- [ ] Update other pages that reference WorkContext

### Phase 3: Components (MEDIUM PRIORITY)
- [ ] Update `components/events/EventTemplatePicker.tsx`
- [ ] Update `components/events/EventManualForm.tsx`
- [ ] Review and update all components in `components/mywork/`

### Phase 4: Cleanup (LOW PRIORITY)
- [ ] Delete `lib/actions/work-event-router.ts`
- [ ] Delete `lib/actions/work-support.ts`
- [ ] Refactor `lib/actions/work-output.ts` to use WorkCommsProduct
- [ ] Review `lib/server/migrate-context-type.ts` (may be obsolete)
- [ ] Update `lib/hooks/useEventHydration.ts`

### Phase 5: Database Migration
- [ ] Run `npx prisma migrate dev --name refactor_workcontext_to_companyx`
- [ ] Verify all data migrated correctly
- [ ] Test all endpoints after migration

---

## 🎯 ARCHITECTURE SUMMARY

### New Architecture

```
CompanyX Models (Direct)
├── CompanyCampaign
├── CompanyImpactEvent
├── CompanyTraining
├── CompanyEvent
├── CompanyCommunity
├── CompanyBenefits
├── CompanyCareer
└── CompanyEmployeeCause

CompanyWorkLink (Junction Table)
├── Links CompanyX models to WorkCommsProduct
└── Replaces all previous linking mechanisms

WorkCommsProduct (Normalized Output Layer)
├── Wrapper for all work outputs
├── Links to CompanyX via CompanyWorkLink
└── Specific product tables (PosterProduct, NtkProduct, etc.) remain unchanged
```

### Removed Architecture

```
❌ WorkEventRouter (deleted)
❌ WorkSupport (deleted)
❌ WorkOutput (deleted)
❌ PromotionalWorkItem (deleted)
```

### Key Principles

1. **Direct Model Access**: CompanyX models are accessed directly, no router abstraction
2. **Type Required**: All functions that work with CompanyX require explicit `type` parameter
3. **Junction Table**: `CompanyWorkLink` is the only way to link CompanyX to WorkCommsProduct
4. **Backward Compatibility**: Legacy aliases exist but should be migrated

---

## 🚨 KNOWN ISSUES

1. **API Routes Broken**: All `/api/context/*` routes still reference WorkEventRouter
2. **Pages Broken**: All `/mywork/context/*` pages likely broken due to function signature changes
3. **Support Pages**: `/mywork/support/*` pages should be deleted but still exist
4. **Database Migration**: Not yet run - schema changes not applied to database
5. **Type Safety**: Many places still use `any` type for dynamic model access

---

## 📝 NOTES

- The refactor is **structural only** - no new features added
- All CompanyX models maintain the same fields as their WorkContext predecessors
- The `WorkforceComms` 3-layer system is preserved (backward compatibility)
- `WorkOutputStandalone` is preserved (backward compatibility)
- `NTK` and `NTKEdition` models are unchanged

---

## 🔄 NEXT STEPS

1. **Immediate**: Update API routes to use CompanyX models
2. **Immediate**: Update pages to handle new function signatures
3. **Short-term**: Delete obsolete files (work-event-router.ts, work-support.ts, support pages)
4. **Short-term**: Run database migration
5. **Medium-term**: Update all components
6. **Long-term**: Remove legacy aliases and clean up type safety

---

**Status**: ~30% Complete  
**Estimated Remaining Work**: 50+ files need updates  
**Risk Level**: HIGH - Many breaking changes, extensive testing required

