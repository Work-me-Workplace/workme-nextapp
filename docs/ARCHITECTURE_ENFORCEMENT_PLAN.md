# Architecture Enforcement Plan

**Date:** 2025-11-26  
**Goal:** Enforce canonical architecture per ARCHITECTURE_PRODUCTS_AND_OUTPUTS.md

---

## 🔍 AUDIT RESULTS

### Files Using Legacy Models

**WorkOutput references:**
- `lib/actions/work-output.ts` - **REWRITE** to use WorkCommsProduct
- `app/mywork/outputs/*` - **RENAME** to `/mywork/products`
- `app/api/output-standalone/*` - Uses WorkOutputStandalone (legacy, keep for now)
- Scripts - Migration/audit scripts (can keep for historical reference)

**WorkEventRouter references:**
- Scripts only (migration/audit scripts)
- `app/api/workforce-comms/generate/route.ts` - Already updated to use CompanyWorkLink

**WorkSupport references:**
- Documentation only (already deleted from code)

**PromotionalWorkItem references:**
- `lib/actions/promotional-work-item.ts` - Already migrated to EventItem ✅

**eventRouterIds references:**
- `app/api/workforce-comms/generate/route.ts` - Has fallback, needs cleanup
- `lib/actions/workforce-comms.ts` - Needs review
- `app/workforce-comms/*/drafts/*` - Needs review

---

## ✅ EXECUTION PLAN

### Phase 1: Rewrite work-output.ts
- Convert all functions to use WorkCommsProduct
- Map old outputType to WorkCommsProductType
- Create CompanyWorkLink for linking

### Phase 2: Rename outputs → products
- Rename `/mywork/outputs` to `/mywork/products`
- Update all imports and routes

### Phase 3: Clean Prisma Schema
- Verify WorkOutput, WorkSupport, WorkEventRouter, PromotionalWorkItem are deleted
- Ensure WorkCommsProduct and CompanyWorkLink are correct

### Phase 4: Fix WorkforceComms
- Remove eventRouterIds usage
- Ensure it uses CompanyWorkLink

### Phase 5: Build & Fix Errors
- Run npm run build
- Fix all TypeScript errors
- Verify no legacy model references

---

**Status:** Starting execution...

