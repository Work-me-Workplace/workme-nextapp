# CompanyRole & CompanyUnitRole Audit Report
**Date:** 2025-01-30  
**Scope:** Full repository read-only audit  
**Status:** READ-ONLY - No changes made

---

## Executive Summary

**CRITICAL FINDING:** There is a **naming conflict** in the Prisma schema:
- **Prisma ENUM** `CompanyRole` (lines 97-101) - Used for role values (MEMBER, MANAGER, ADMIN)
- **Prisma MODEL** `CompanyRole` (lines 263-274) - Junction table linking Workplace to roles

**CompanyUnitRole:** ❌ **DOES NOT EXIST** - No occurrences found in the repository.

---

## Detailed Findings

### 1. Prisma ENUM: `CompanyRole`

**Location:** `prisma/schema.prisma`  
**Lines:** 97-101  
**Type:** Prisma Enum  
**Status:** ✅ ACTIVE - Currently in use

```prisma
enum CompanyRole {
  MEMBER
  MANAGER
  ADMIN
}
```

**Usage:**
- Used in `CompanyUnitMembers` model (line 232): `role CompanyRole @default(MEMBER)`
- Used in `Workplace` model (line 255): `roles CompanyRole[]`
- Imported in TypeScript: `lib/auth/loadMembership.ts` (line 12)

**Purpose:** Defines role values for membership permissions (MEMBER, MANAGER, ADMIN)

---

### 2. Prisma MODEL: `CompanyRole`

**Location:** `prisma/schema.prisma`  
**Lines:** 262-274  
**Type:** Prisma Model (Junction Table)  
**Status:** ⚠️ CONFLICT - Same name as enum above

```prisma
// CompanyRole: Defines permissions inside a company or unit
model CompanyRole {
  id          String   @id @default(cuid())
  workplaceId String
  role        String   // ⚠️ NOTE: Uses String, not the enum!
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workplace Workplace @relation(fields: [workplaceId], references: [id], onDelete: Cascade)

  @@index([workplaceId])
  @@index([role])
}
```

**Key Observations:**
- This is a **junction table** linking `Workplace` to role strings
- The `role` field is **String**, NOT the `CompanyRole` enum
- Part of WorkWorld architecture (links to Workplace model)
- Referenced in documentation as part of WorkWorld structure

**Purpose:** Stores role assignments for Workplace relationships (legacy WorkWorld architecture)

---

### 3. TypeScript Usage: `CompanyRole` (from Prisma Client)

**Location:** `lib/auth/loadMembership.ts`  
**Lines:** 12, 18, 61, 66  
**Type:** TypeScript type (imported from `@prisma/client`)  
**Status:** ✅ ACTIVE - Uses the enum

```typescript
import { CompanyRole } from '@prisma/client'

export interface Membership {
  role: CompanyRole  // Line 18
  // ...
}

export async function hasRole(
  requiredRole: CompanyRole  // Line 61
): Promise<boolean> {
  const roleHierarchy: Record<CompanyRole, number> = {  // Line 66
    MEMBER: 1,
    MANAGER: 2,
    ADMIN: 3,
  }
  // ...
}
```

**Purpose:** Type-safe role checking for CompanyUnitMembers

---

### 4. Documentation References

#### `docs/COMPANY_MODELS_ARCHITECTURE_AUDIT.md`
- **Line 11:** Mentions `CompanyRole` as one of 4 non-content models (referring to the MODEL)
- **Line 61:** Section header "CompanyRole (WorkWorld Architecture)" - refers to the MODEL

#### `docs/ARCHITECTURE_MAP_REPORT.md`
- **Line 299:** Workplace model has `roles CompanyRole[]` (referring to the ENUM array)
- **Line 300:** CompanyRole model table (referring to the MODEL)
- **Line 368:** Lists CompanyRole as WorkWorld model (referring to the MODEL)

#### `docs/WorkWorldArchitecture.md`
- **Line 33:** "CompanyRole: Defines permissions inside a company or unit" (referring to the MODEL)

---

## Conflict Analysis

### Naming Conflict: `CompanyRole`

**Problem:** The same identifier `CompanyRole` is used for:
1. **Prisma ENUM** - Defines role values (MEMBER, MANAGER, ADMIN)
2. **Prisma MODEL** - Junction table for Workplace roles

**Impact:**
- Prisma will generate conflicting types
- TypeScript imports will be ambiguous
- Code readability is reduced
- Potential runtime errors if wrong type is used

**Current State:**
- The enum is actively used in `CompanyUnitMembers` and `Workplace` models
- The model is part of legacy WorkWorld architecture
- The model's `role` field uses `String`, not the enum (inconsistent!)

---

## Usage Analysis

### Which is the "Real" Intended Role?

**Answer: The ENUM `CompanyRole` is the intended role system.**

**Evidence:**
1. ✅ **Active Usage:** The enum is used in the NEW `CompanyUnitMembers` junction table (line 232)
2. ✅ **Type Safety:** TypeScript code imports and uses the enum type
3. ✅ **Consistent Values:** Defines clear role hierarchy (MEMBER, MANAGER, ADMIN)
4. ✅ **Recent Addition:** Added in recent refactor (Step 1 of identity architecture)

**The MODEL `CompanyRole` appears to be:**
- ⚠️ **Legacy:** Part of old WorkWorld architecture
- ⚠️ **Inconsistent:** Uses `String` for role field instead of enum
- ⚠️ **Unused:** No TypeScript code references this model
- ⚠️ **Conflicting:** Same name causes ambiguity

---

## Recommendations

### Immediate Actions Required:

1. **Rename the MODEL** to avoid conflict:
   - Option A: `WorkplaceRole` (describes its purpose)
   - Option B: `CompanyRoleAssignment` (more descriptive)
   - Option C: `WorkplaceRoleAssignment` (clearest)

2. **Update the MODEL's role field** to use the enum:
   - Change `role String` to `role CompanyRole`
   - Ensures type safety and consistency

3. **Update documentation** to clarify:
   - `CompanyRole` enum = role values
   - `WorkplaceRole` model = role assignments (or chosen name)

4. **Consider deprecation:**
   - If `Workplace` model is legacy/unused, consider removing both `Workplace` and `CompanyRole` model
   - Keep only the enum for the new `CompanyUnitMembers` system

---

## Summary Table

| Identifier | Type | Location | Status | Usage |
|------------|------|----------|--------|-------|
| `CompanyRole` | Prisma Enum | `prisma/schema.prisma:97` | ✅ Active | Used in CompanyUnitMembers, Workplace |
| `CompanyRole` | Prisma Model | `prisma/schema.prisma:263` | ⚠️ Conflict | Legacy WorkWorld, unused in TS |
| `CompanyRole` | TS Type | `lib/auth/loadMembership.ts:12` | ✅ Active | Imported from Prisma enum |
| `CompanyUnitRole` | N/A | ❌ Not Found | N/A | Does not exist |

---

## Files Modified (NONE - Read-Only Audit)

✅ No files were modified during this audit.  
✅ All findings are diagnostic only.  
⏳ Awaiting instructions for next steps.

---

**End of Report**

