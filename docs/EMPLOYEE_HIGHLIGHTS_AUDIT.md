# Employee Highlights Architecture Audit

## 🔴 Critical Issue: CompanyUnitId Disconnect

### Problem Summary
When implementing `employeehighlights`, a disconnect was introduced between:
- **User (WorkMe)** needs `companyUnitId` (UUID) for creating/updating employees
- **loadWorkMe()** only returns `companyUnit` (string name)
- **Routes** inconsistently handle the conversion between string names and UUID IDs

---

## 📊 Schema Analysis

### WorkMe Model
```prisma
model WorkMe {
  id         String   @id @default(uuid())
  companyUnitId String?  // UUID foreign key to CompanyUnit.id
  companyUnit   CompanyUnit? @relation("WorkMeCompanyUnit", fields: [companyUnitId], references: [id])
  // ...
}
```
- **Has**: `companyUnitId` (UUID FK) ✅
- **Also has**: `companyUnitMemberships` via junction table ✅

### CompanyEmployee Model
```prisma
model CompanyEmployee {
  id            String  @id @default(cuid())
  companyUnitId String? // UUID foreign key to CompanyUnit.id
  companyUnit   CompanyUnit? @relation(fields: [companyUnitId], references: [id])
  // ...
}
```
- **Requires**: `companyUnitId` (UUID FK) for proper organization linking ✅

### CompanyEmployeeHighlightUnit (Junction Table)
```prisma
model CompanyEmployeeHighlightUnit {
  id          String @id @default(cuid())
  highlightId String
  companyUnit String // ⚠️ STRING NAME, not UUID ID
  // ...
}
```
- **Uses**: `companyUnit` as **string name** (e.g., "SEA 05") ⚠️

---

## 🚨 Core Disconnect

### What `loadWorkMe()` Returns
**File**: `lib/auth/loadWorkMe.ts`

```typescript
export interface WorkMeIdentity {
  id: string
  companyUnit: string | null  // ⚠️ STRING NAME only
  companyDivision: string | null
  // NO companyUnitId ❌
}
```

**Current Implementation**:
- Gets `companyUnit` from `CompanyUnitMemberships[0].unit.name` (string)
- **Does NOT return `companyUnitId`** (UUID)
- Routes must manually convert string → UUID if needed

### What Routes Need

Routes that create/update `CompanyEmployee` records need:
1. `companyUnitId` (UUID) - to set on employee record
2. `companyUnit` (string) - for authorization and junction table

**Current Problem**: Routes only get the string name, then must:
- Lookup CompanyUnit by name to get ID
- Handle cases where lookup fails
- Duplicate lookup logic across multiple routes

---

## 📁 Route Architecture

### Primary Routes (Canonical)
**Location**: `/app/api/company/highlights/`

1. **`POST /api/company/highlights/create`**
   - File: `app/api/company/highlights/create/route.ts`
   - Status: ✅ Simple - doesn't create employees
   - Gets: `companyUnit` (string) from `loadWorkMe()`
   - Uses: String for validation only

2. **`POST /api/company/highlights/ingest`**
   - File: `app/api/company/highlights/ingest/route.ts`
   - Status: ⚠️ **PROBLEMATIC** - creates employees
   - Gets: `companyUnit` (string) from `loadWorkMe()`
   - **Must convert**: String → UUID to create employees
   - **Workaround**: Looks up `CompanyUnitMembers` to get `companyId`, then finds `CompanyUnit` by name
   - **Line 69-99**: Complex lookup logic that could fail

3. **`POST /api/company/highlights/save`**
   - File: `app/api/company/highlights/save/route.ts`
   - Status: ⚠️ **PROBLEMATIC** - updates employees
   - Gets: `companyUnit` (string) from `loadWorkMe()`
   - **Must convert**: String → UUID
   - **Line 82-89**: Looks up CompanyUnit by name to get ID
   - **Accepts**: `companyUnitId` in request body (optional, from frontend)

4. **`GET /api/company/highlights`**
   - File: `app/api/company/highlights/route.ts`
   - Status: ✅ Works - uses string for filtering
   - Uses: `listHighlights(companyUnit)` which converts string → UUID internally

### Secondary Routes (Alternative/Conflicting?)
**Location**: `/app/api/highlights/`

5. **`POST /api/highlights/create`**
   - File: `app/api/highlights/create/route.ts`
   - Status: ⚠️ **INCONSISTENT** - different pattern
   - **Expects**: `companyUnitId` in request body from frontend
   - **Problem**: Frontend must have `companyUnitId` - where does it get it?
   - **Line 27**: Schema expects `companyUnitId: z.string().optional().nullable()`
   - Creates employees with provided `companyUnitId` directly

6. **`GET /api/highlights`**
   - File: `app/api/highlights/route.ts`
   - Status: ⚠️ **DIFFERENT FILTERING** - uses junction table
   - Filters by: `CompanyEmployeeHighlightUnit.companyUnit` (string)
   - Different from `/api/company/highlights` which filters by employee's `companyUnitId`

---

## 🔍 Specific Issues

### Issue 1: Missing companyUnitId in loadWorkMe()

**Location**: `lib/auth/loadWorkMe.ts:34-79`

**Problem**:
```typescript
// Returns only string name
const companyUnit = primaryMembership?.unit?.name || null

return {
  // ...
  companyUnit,  // ⚠️ Only string
  // ❌ No companyUnitId
}
```

**Impact**: Every route that needs UUID must do manual lookup

**Fix Required**: Return both string and UUID
```typescript
return {
  // ...
  companyUnit: primaryMembership?.unit?.name || null,
  companyUnitId: primaryMembership?.companyUnitId || null,  // ✅ Add this
}
```

---

### Issue 2: Inconsistent Employee Creation

**Location**: `app/api/company/highlights/ingest/route.ts:68-122`

**Problem**:
- Must lookup `CompanyUnitMembers` to find user's membership
- Then lookup `CompanyUnit` by name to get `companyId`
- Then call `upsertEmployee()` which may or may not get `companyUnitId` set correctly
- **Line 120**: Passes `companyUnitId: null` - relies on `upsertEmployee()` normalization

**Complex Lookup Chain**:
```typescript
// 1. Get membership
const userMembership = await prisma.companyUnitMembers.findFirst({
  where: { workMeId },
  include: { unit: { ... } }
})

// 2. Get companyId from membership
let companyId = userMembership?.unit?.companyId || null

// 3. Fallback: lookup by name
if (!companyId && companyUnit) {
  const companyUnitRecord = await prisma.companyUnit.findFirst({
    where: { name: { equals: companyUnit, mode: 'insensitive' } }
  })
  companyId = companyUnitRecord?.companyId || null
}
```

**Problem**: This is fragile and error-prone

---

### Issue 3: Two Different Filtering Patterns

**Pattern A**: `/api/company/highlights` (via `listHighlights()`)
- Filters by: `employee.companyUnitId` (UUID)
- **File**: `lib/server/company/highlights.ts:169-210`
- Converts string name → UUID, then filters employees

**Pattern B**: `/api/highlights`
- Filters by: `CompanyEmployeeHighlightUnit.companyUnit` (string)
- **File**: `app/api/highlights/route.ts:32-35`
- Uses junction table with string names

**Problem**: Two different ways to filter highlights can return different results!

---

### Issue 4: Frontend Must Provide companyUnitId

**Location**: `app/api/highlights/create/route.ts:27`

**Problem**:
```typescript
const createHighlightSchema = z.object({
  // ...
  employees: z.array(z.object({
    // ...
    companyUnitId: z.string().optional().nullable(),  // ⚠️ Expected from frontend
  }))
})
```

**Question**: Where does the frontend get `companyUnitId`?
- Frontend calls `loadWorkMe()` via `/api/workme/me`?
- Does that route return `companyUnitId`? (Need to check)
- If not, frontend can't create highlights properly

---

## 🔧 Recommended Fixes

### Fix 1: Update `loadWorkMe()` to Return companyUnitId

**File**: `lib/auth/loadWorkMe.ts`

```typescript
export interface WorkMeIdentity {
  id: string
  firebaseId: string | null
  email: string
  firstName: string | null
  lastName: string | null
  photoUrl: string | null
  companyUnit: string | null      // Keep for backward compatibility
  companyUnitId: string | null    // ✅ ADD THIS
  companyDivision: string | null
  companyDivisionId: string | null // ✅ ADD THIS (future-proof)
}
```

**Update Query**:
```typescript
const workMe = await prisma.workMe.findUnique({
  where: { firebaseId },
  select: {
    id: true,
    firebaseId: true,
    email: true,
    companyUnitMemberships: {
      take: 1,
      include: {
        unit: {
          select: {
            id: true,        // ✅ ADD
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    },
  },
})

const primaryMembership = workMe.companyUnitMemberships[0]
const companyUnit = primaryMembership?.unit?.name || null
const companyUnitId = primaryMembership?.companyUnitId || null  // ✅ ADD

return {
  // ...
  companyUnit,
  companyUnitId,  // ✅ ADD
  companyDivision: null,
  companyDivisionId: null,  // ✅ ADD
}
```

---

### Fix 2: Update All Highlight Routes to Use companyUnitId

**Files to Update**:
1. `app/api/company/highlights/ingest/route.ts`
   - Remove complex lookup logic (lines 68-109)
   - Use `workMe.companyUnitId` directly

2. `app/api/company/highlights/save/route.ts`
   - Remove lookup (lines 82-89)
   - Use `workMe.companyUnitId` directly

3. `app/api/highlights/create/route.ts`
   - Make `companyUnitId` optional from request body
   - Fallback to `workMe.companyUnitId` if not provided

---

### Fix 3: Standardize Filtering Pattern

**Decision Needed**: Which pattern to use?

**Option A**: Filter by Employee's `companyUnitId` (UUID-based)
- ✅ More relational/clean
- ✅ Employee is source of truth
- ❌ Requires join through employee

**Option B**: Filter by `CompanyEmployeeHighlightUnit.companyUnit` (string-based)
- ✅ Simpler query
- ✅ Direct junction table
- ❌ Uses strings, not relational

**Recommendation**: **Option A** (UUID-based via employee)
- Employees are the canonical org structure
- Highlights inherit from employees
- More consistent with schema design

**Action**: Update `/api/highlights/route.ts` to use employee filtering pattern

---

### Fix 4: Update `/api/workme/me` to Return companyUnitId

**File**: `app/api/workme/me/route.ts` (if exists)

Ensure it returns both `companyUnit` and `companyUnitId` so frontend can:
- Display company unit name
- Send `companyUnitId` in API requests

---

## 📋 Route Summary Table

| Route | Status | Gets companyUnitId? | Creates Employees? | Filter Pattern |
|-------|--------|---------------------|-------------------|----------------|
| `POST /api/company/highlights/create` | ✅ OK | No (not needed) | No | N/A |
| `POST /api/company/highlights/ingest` | ⚠️ BROKEN | No (must lookup) | Yes | N/A |
| `POST /api/company/highlights/save` | ⚠️ BROKEN | No (must lookup) | Yes | N/A |
| `GET /api/company/highlights` | ✅ OK | No (converts internally) | No | Employee UUID |
| `POST /api/highlights/create` | ⚠️ BROKEN | From request body | Yes | N/A |
| `GET /api/highlights` | ⚠️ INCONSISTENT | No | No | Junction String |

---

## 🎯 Priority Actions

1. **HIGH**: Update `loadWorkMe()` to return `companyUnitId`
2. **HIGH**: Update `/api/company/highlights/ingest` to use `companyUnitId`
3. **HIGH**: Update `/api/company/highlights/save` to use `companyUnitId`
4. **MEDIUM**: Standardize filtering pattern (choose UUID or string)
5. **MEDIUM**: Update `/api/highlights/create` to use `workMe.companyUnitId` as fallback
6. **LOW**: Update `/api/workme/me` to return `companyUnitId` (if needed for frontend)

---

## ❓ Questions to Resolve

1. **Which routes are actually being used?**
   - `/api/company/highlights/*` (canonical?)
   - `/api/highlights/*` (alternative/legacy?)

2. **Should we deprecate one set of routes?**
   - Having two sets creates confusion
   - Consolidate to single pattern

3. **Frontend dependency:**
   - Does frontend currently send `companyUnitId`?
   - If so, where does it get it from?

4. **Schema question:**
   - Why does `CompanyEmployeeHighlightUnit` use string names?
   - Should it use UUID FK instead for consistency?

---

## 📝 Testing Checklist

After fixes:
- [ ] `loadWorkMe()` returns both `companyUnit` and `companyUnitId`
- [ ] `/api/company/highlights/ingest` creates employees with correct `companyUnitId`
- [ ] `/api/company/highlights/save` updates employees with correct `companyUnitId`
- [ ] Both list routes return consistent results
- [ ] Frontend can create highlights without providing `companyUnitId` in body
- [ ] All routes handle missing `companyUnitId` gracefully

