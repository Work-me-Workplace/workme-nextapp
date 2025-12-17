# CompanyEmployee Model Analysis

**Date:** 2025-01-XX  
**Purpose:** Comprehensive analysis of `CompanyEmployee` model and its role as the single source of truth for all people in the company  
**Status:** 🔴 **SIGNIFICANT FORK** - Architectural decision point

---

## Executive Summary

`CompanyEmployee` is positioned as the **single source of truth** for all people within a company context. The question is: **Should ALL people (directors, senior leaders, regular employees) use this model, or are there legitimate separate models?**

**Current State:**
- ✅ `CompanyEmployee` is used for: Employee Highlights, Senior Leader Emails
- ⚠️ Other people models exist: `MyTeamDirectorProfile`, `MyTeamDeputyProfile`, `EcosystemPerson`
- ❓ No unified employee directory/browse page
- ❓ Inconsistent lookup patterns across features

---

## Model Structure

### CompanyEmployee Schema

```prisma
model CompanyEmployee {
  id       String  @id @default(cuid())
  fullName String
  title    String?  // e.g., "SES", "Director", "Deputy Director", "Engineer"
  email    String?
  phone    String?
  photoUrl String?

  // Organizational context (employee-first architecture)
  companyId       String // Authoritative organizational FK (required)
  workMeCompanyId String // Silent background tag for tenant partitioning
  companyUnit     String? // Optional string label ("SEA 05", "NAVSEA HQ")
  division        String? // Optional string label (ignored by app logic)

  // Audit trail
  createdByWorkMeId String @db.Uuid

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  highlights         CompanyEmployeeHighlight[]
  seniorLeaderEmails ProductSeniorLeaderEmailContent[]
  company            Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdBy          WorkMe @relation("CompanyEmployeeCreator", fields: [createdByWorkMeId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([workMeCompanyId])
  @@index([companyUnit])
  @@index([fullName])
  @@index([email])
}
```

**Key Characteristics:**
- **Simple identity fields:** `fullName`, `title`, `email`, `phone`, `photoUrl`
- **No role enum** - `title` is free text (can be "SES", "Director", "Engineer", etc.)
- **Company-scoped:** Always belongs to a `companyId`
- **Tenant-partitioned:** `workMeCompanyId` for multi-tenant isolation
- **Auditable:** `createdByWorkMeId` tracks creator

---

## Current Usage Patterns

### 1. Employee Highlights

**Flow:**
1. Search/Select Employee (`/api/employee/search?q=query`)
2. Create employee inline if not found (`/api/employee/create`)
3. Create highlight with `employeeId` FK

**Model Reference:**
```prisma
model CompanyEmployeeHighlight {
  employeeId String // Direct FK to CompanyEmployee
  employee   CompanyEmployee @relation(...)
}
```

**Status:** ✅ **Working well** - Clean pattern

### 2. Senior Leader Emails

**Flow:**
1. Select role enum (SES, DIRECTOR, etc.)
2. Lookup employees by role (`/api/employee/lookup-by-role?role=DIRECTOR`)
3. Select employee
4. Create email with `companyEmployeeId` FK

**Model Reference:**
```prisma
model ProductSeniorLeaderEmailContent {
  role            SeniorLeaderRole // Enum
  companyEmployeeId String?        // FK to CompanyEmployee
  companyEmployee   CompanyEmployee? @relation(...)
}
```

**Status:** ⚠️ **Partially implemented** - Uses role enum + employee FK

### 3. Dashboard Hydration

**Query:**
```typescript
prisma.companyEmployee.findMany({
  where: { companyId },
  orderBy: { createdAt: 'desc' },
  take: 100,
})
```

**Status:** ✅ **Simple list** - No filtering by role/title

---

## Lookup/Search Patterns

### Current API Endpoints

#### 1. `/api/employee/search?q=query`
- **Purpose:** Search by name (case-insensitive)
- **Service:** `lib/employee/service.ts::searchEmployees()`
- **Limitation:** Returns empty array if query is empty
- **Use Case:** Employee Highlights, inline employee creation

#### 2. `/api/employee/lookup-by-role?role=DIRECTOR`
- **Purpose:** Filter employees by role enum (matches `title` field)
- **Pattern Matching:** Maps role enum to title search patterns
  - `DIRECTOR` → searches for "director" in title
  - `DEPUTY_DIRECTOR` → searches for "deputy director" in title
- **Use Case:** Senior Leader Email creation
- **Limitation:** Fuzzy matching on `title` field (not enum)

#### 3. `/api/employee/search-by-role?role=DIRECTOR`
- **Purpose:** Similar to lookup-by-role (duplicate?)
- **Status:** ⚠️ **Duplicate endpoint?**

#### 4. `/api/employee/enrich-from-apollo`
- **Purpose:** Create/update employee from Apollo data
- **Flow:** Search Apollo → Find person → Create/update `CompanyEmployee`
- **Use Case:** Enrichment when person not in system

### Search Service Limitations

**Current `searchEmployees()` function:**
```typescript
// Returns empty array if query is empty
if (!query || query.trim().length === 0) {
  return []
}
```

**Impact:** Cannot list all employees without a search query

---

## Create Patterns

### 1. Inline Creation (Employee Highlights Pattern)

**Location:** `app/mycompany/highlights/new/page.tsx`

**Flow:**
- User searches for employee
- If not found, shows "Create New Employee" form inline
- Creates via `/api/employee/create`
- Immediately selects created employee

**Fields:**
- `fullName` (required)
- `title` (optional)
- `email` (optional)
- `companyUnit` (optional)

**Status:** ✅ **Good UX pattern**

### 2. Dedicated Creation Page

**Location:** `app/mycompany/senior-leaders/new/page.tsx`

**Flow:**
- Separate page for creating employee
- Includes Apollo enrichment option
- More fields (phone, role category)

**Status:** ⚠️ **Inconsistent** - Different from highlights pattern

### 3. Apollo Enrichment

**Location:** `app/api/employee/enrich-from-apollo/route.ts`

**Flow:**
- Search Apollo by name
- Find matching person
- Create/update `CompanyEmployee` with Apollo data
- Returns employee + Apollo metadata

**Status:** ✅ **Useful enrichment pattern**

---

## Models That Reference CompanyEmployee

### Direct Foreign Keys

1. **`CompanyEmployeeHighlight.employeeId`**
   - Required FK
   - One highlight → one employee
   - ✅ Clean relationship

2. **`ProductSeniorLeaderEmailContent.companyEmployeeId`**
   - Optional FK
   - One email → one employee (optional)
   - ⚠️ Optional - allows emails without employee?

### Reverse Relations

```prisma
model CompanyEmployee {
  highlights         CompanyEmployeeHighlight[]
  seniorLeaderEmails ProductSeniorLeaderEmailContent[]
}
```

**Status:** ✅ **Clean reverse relations**

---

## Other People Models in System

### 1. MyTeam Models (Personal Intelligence)

**Models:**
- `MyTeamDirectorProfile`
- `MyTeamDeputyProfile`
- `MyTeamPeerProfile`
- `MyTeamSubordinateProfile`

**Purpose:** Personal relationship intelligence (user's perception of their team)
- Attributes: `friendlinessScale`, `strictnessScale`, `isSupervisor`, etc.
- **Scope:** Personal to each WorkMe (not company-wide)
- **Relation:** Belongs to `MyTeamContainer` → `WorkMe`

**Key Difference:**
- `CompanyEmployee` = **Company-wide truth** (everyone sees same person)
- `MyTeam*Profile` = **Personal perception** (each user has their own view)

**Question:** Should these reference `CompanyEmployee` via FK, or remain separate?

### 2. EcosystemPerson (External Contacts)

**Model:** `EcosystemPerson`

**Purpose:** External ecosystem contacts (not company employees)
- X/Twitter handles, LinkedIn profiles
- External to company
- Can be followed/tracked by WorkMe users

**Key Difference:**
- `CompanyEmployee` = **Internal company people**
- `EcosystemPerson` = **External ecosystem people**

**Status:** ✅ **Legitimately separate** - Different domain

---

## Current Gaps & Inconsistencies

### 1. No Unified Employee Directory

**Current State:**
- ❌ No `/mycompany/employees` page
- ❌ No way to browse all employees
- ⚠️ Separate `/mycompany/senior-leaders` page (should be unified?)

**Impact:**
- Users can't see all company employees in one place
- No employee management interface
- Inconsistent navigation

### 2. Search Limitations

**Issues:**
- `searchEmployees()` returns empty if query is empty
- No way to list all employees without search query
- No pagination
- Limited to 20 results

**Impact:**
- Cannot build employee directory
- Cannot browse all employees

### 3. Role/Title Handling

**Current:**
- `title` is free text (no enum)
- Role filtering uses fuzzy matching on `title` field
- `SeniorLeaderRole` enum exists but not stored on employee

**Questions:**
- Should `title` remain free text?
- Should we add `roleCategory` enum field?
- How to handle multiple roles per person?

### 4. Inconsistent Creation Patterns

**Patterns:**
1. Inline creation (highlights) - ✅ Good
2. Dedicated page (senior-leaders) - ⚠️ Inconsistent
3. Apollo enrichment - ✅ Useful

**Question:** Should all features use inline creation pattern?

### 5. Missing Employee Management

**Current:**
- ✅ Can create employees
- ❌ Cannot edit employees
- ❌ Cannot delete employees
- ❌ Cannot view employee details
- ❌ No employee profile page

---

## Architectural Questions

### 1. Should ALL People Use CompanyEmployee?

**Option A: Unified Model (Current Direction)**
- ✅ All company people = `CompanyEmployee`
- ✅ Directors, senior leaders, regular employees all same model
- ✅ Differentiated by `title` field
- ✅ Single source of truth

**Option B: Separate Models**
- ❌ `SeniorLeader` model
- ❌ `Director` model
- ❌ `CompanyEmployee` for regular employees
- ❌ Multiple sources of truth

**Recommendation:** ✅ **Option A** - Unified model is cleaner

### 2. Should MyTeam Models Reference CompanyEmployee?

**Current:** Separate models, no FK relationship

**Option A: Reference CompanyEmployee**
```prisma
model MyTeamDirectorProfile {
  employeeId String? // FK to CompanyEmployee
  employee   CompanyEmployee? @relation(...)
  // ... personal attributes
}
```

**Benefits:**
- Link personal perception to company truth
- Can enrich MyTeam data from CompanyEmployee
- Single source of truth for identity

**Drawbacks:**
- MyTeam might reference people not in CompanyEmployee
- External contacts, former employees, etc.

**Option B: Keep Separate**
- MyTeam = personal intelligence only
- No link to company data
- More flexible

**Question:** Should MyTeam models have optional FK to CompanyEmployee?

### 3. Employee Directory Structure

**Option A: Unified Directory**
- `/mycompany/employees` - Browse all employees
- Filter by role/title
- Search by name
- View employee details
- Edit/delete employees

**Option B: Feature-Specific Lists**
- `/mycompany/highlights` - Shows employees with highlights
- `/mycompany/senior-leaders` - Shows senior leaders only
- No unified view

**Recommendation:** ✅ **Option A** - Unified directory + feature-specific views

### 4. Role Enum vs Free Text Title

**Current:**
- `title` = free text
- `SeniorLeaderRole` enum exists but not on employee

**Option A: Add Role Category**
```prisma
model CompanyEmployee {
  title        String?           // Free text: "Deputy Director, SEA 05"
  roleCategory SeniorLeaderRole? // Enum: DIRECTOR, SES, etc.
}
```

**Option B: Keep Title Only**
- Use fuzzy matching on `title` field
- No enum storage

**Option C: Replace Title with Enum**
- ❌ Too restrictive - loses detail

**Recommendation:** ✅ **Option A** - Both fields (category for filtering, title for detail)

---

## Proposed Architecture

### Unified Employee Model

**Principle:** `CompanyEmployee` is the single source of truth for all company people

**All People Types:**
- Regular employees
- Directors
- Senior leaders (SES, etc.)
- Chiefs, Commanders
- All differentiated by `title` field

**No Separate Models:**
- ❌ No `SeniorLeader` model
- ❌ No `Director` model
- ✅ Everything is `CompanyEmployee`

### Employee Directory

**New Page:** `/mycompany/employees`

**Features:**
- Browse all employees
- Search by name, email
- Filter by role category (if added)
- Filter by company unit
- View employee details
- Edit employee
- See related data (highlights, emails, etc.)

**API Endpoint:** `GET /api/employee/list` (new)
- Returns all employees (paginated)
- Supports filtering
- Supports sorting

### Consistent Lookup Pattern

**All Features Use Same Pattern:**
1. Search employees (`/api/employee/search`)
2. Create inline if not found (`/api/employee/create`)
3. Select employee
4. Create feature-specific record with `employeeId` FK

**Features:**
- Employee Highlights ✅ (already uses this)
- Senior Leader Emails ⚠️ (should use this)
- Future features → use this pattern

### Optional Enhancements

1. **Role Category Field**
   ```prisma
   roleCategory SeniorLeaderRole? // Optional enum for filtering
   ```

2. **Employee Profile Page**
   - `/mycompany/employees/[id]`
   - Shows all related data
   - Edit employee details

3. **MyTeam → CompanyEmployee Link**
   ```prisma
   model MyTeamDirectorProfile {
     employeeId String? // Optional FK
     employee   CompanyEmployee? @relation(...)
   }
   ```

---

## Migration Considerations

### If Adding Role Category

**Migration:**
1. Add `roleCategory` field (nullable)
2. Backfill from `title` field using fuzzy matching
3. Update UI to set both fields

### If Creating Employee Directory

**New Endpoints:**
- `GET /api/employee/list` - List all (paginated, filterable)
- `GET /api/employee/[id]` - Get employee details
- `PUT /api/employee/[id]` - Update employee
- `DELETE /api/employee/[id]` - Delete employee (soft delete?)

### If Linking MyTeam Models

**Migration:**
1. Add optional `employeeId` FK to MyTeam models
2. Match by name (fuzzy) to link existing records
3. Update creation flows to optionally link

---

## Decision Points

### 🔴 Critical Decisions

1. **Unified Model vs Separate Models**
   - ✅ **Recommendation:** Unified `CompanyEmployee` for all company people
   - **Impact:** High - affects all future features

2. **Employee Directory**
   - ✅ **Recommendation:** Create unified `/mycompany/employees` directory
   - **Impact:** Medium - improves UX, enables management

3. **Role Category Field**
   - ❓ **Question:** Add `roleCategory` enum field or keep title-only?
   - **Impact:** Medium - affects filtering/search

4. **MyTeam → CompanyEmployee Link**
   - ❓ **Question:** Should MyTeam models reference CompanyEmployee?
   - **Impact:** Low - optional enhancement

### 🟡 Secondary Decisions

5. **Employee Management**
   - Edit/delete capabilities
   - Employee profile pages
   - **Impact:** Low - nice to have

6. **Search Improvements**
   - List all employees (empty query)
   - Pagination
   - Advanced filtering
   - **Impact:** Medium - enables directory

---

## Current File Locations

### Models
- **Schema:** `prisma/schema.prisma` (lines 708-739)
- **Service:** `lib/employee/service.ts`

### API Routes
- **Search:** `app/api/employee/search/route.ts`
- **Create:** `app/api/employee/create/route.ts`
- **Lookup by Role:** `app/api/employee/lookup-by-role/route.ts`
- **Search by Role:** `app/api/employee/search-by-role/route.ts` (duplicate?)
- **Apollo Enrich:** `app/api/employee/enrich-from-apollo/route.ts`

### UI Pages
- **Highlights (with employee search):** `app/mycompany/highlights/new/page.tsx`
- **Senior Leaders List:** `app/mycompany/senior-leaders/page.tsx` (new)
- **Senior Leaders Create:** `app/mycompany/senior-leaders/new/page.tsx` (new)
- **Senior Leader Email:** `app/mywork/seniorleader/build/page.tsx`

### Documentation
- **Employee-First Architecture:** `docs/EMPLOYEE_FIRST_ARCHITECTURE.md`
- **Employee Highlights:** `docs/EMPLOYEE_HIGHLIGHTS_MODULE.md`

---

## Next Steps

1. **Decide on unified model approach** ✅ (seems clear - unified is better)
2. **Create employee directory page** (if unified approach)
3. **Standardize lookup pattern** across all features
4. **Remove duplicate endpoints** (`lookup-by-role` vs `search-by-role`)
5. **Add employee management** (edit, delete, profile pages)
6. **Consider role category field** (if needed for filtering)
7. **Link MyTeam models** (optional enhancement)

---

## Questions for Discussion

1. **Should we have a unified employee directory?**
   - If yes, what features should it have?
   - Should it replace `/mycompany/senior-leaders`?

2. **Should `title` remain free text or add `roleCategory` enum?**
   - Free text = flexible but harder to filter
   - Enum = structured but less flexible

3. **Should MyTeam models reference CompanyEmployee?**
   - Pros: Link personal intelligence to company truth
   - Cons: MyTeam might include external people

4. **Should we support employee editing/deletion?**
   - Or keep employees immutable (audit trail)?

5. **How should we handle employees who leave?**
   - Soft delete?
   - `archivedAt` field?
   - Keep active forever?

---

**This is a significant architectural fork. The decision will affect:**
- How all future people-related features are built
- Whether we maintain separate models or unify
- The UX patterns for employee lookup/selection
- The employee management capabilities


