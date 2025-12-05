# WorkMe Company Architecture

## Overview

The WorkMe company architecture uses **direct foreign keys** on `WorkMe` to link to company registries. Each registry (`CompanyRegistry`, `CompanyUnit`, `DivisionUnit`) is searchable and reusable.

---

## Core Principle

**WorkMe has direct foreign keys to company registries.** No container model needed - each registry is a standalone entity that `WorkMe` references directly.

---

## Model Relationships

### 1. WorkMe (Core Identity)

```prisma
model WorkMe {
  id         String   @id @default(uuid())
  firebaseId String?  @unique
  email      String   @unique
  createdAt  DateTime @default(now())

  // Simple public-facing profile fields
  headline    String?
  handle      String? @unique
  title       String?
  linkedinUrl String?

  // Direct foreign keys to company registries
  companyId     String? // Foreign key to CompanyRegistry (Company HQ)
  companyUnitId String? // Foreign key to CompanyUnit
  divisionId    String? // Foreign key to DivisionUnit

  // Company registry relations
  company     CompanyRegistry? @relation(fields: [companyId], references: [id])
  companyUnit CompanyUnit?    @relation(fields: [companyUnitId], references: [id])
  division    DivisionUnit?   @relation(fields: [divisionId], references: [id])
  
  // Other bolt-on modules...
  workProfile        WorkProfile?
  workSkills         WorkSkills?
  workEntries        WorkEntry[]
  // ...
}
```

**Key Points:**
- ✅ `WorkMe` has **direct foreign keys** to all three registries
- ✅ `companyId` → `CompanyRegistry` (Company HQ)
- ✅ `companyUnitId` → `CompanyUnit` (Company Unit)
- ✅ `divisionId` → `DivisionUnit` (Division)
- ✅ All foreign keys are **optional** (can be null)

---

### 2. Company Registries (Direct Relations)

**Relationship Flow:**
```
WorkMe → CompanyRegistry (Company HQ)
      → CompanyUnit (Company Unit)
      → DivisionUnit (Division)
```

**Key Points:**
- ✅ `WorkMe` has **direct foreign keys** to all three registries
- ✅ No container model needed - simple and direct
- ✅ Each registry is **optional** (can be null)
- ✅ All registries are **reusable** (many `WorkMe` records can reference the same registry entry)

---

### 3. CompanyUnit (Registry)

```prisma
model CompanyUnit {
  id        String   @id @default(uuid())
  name      String   @unique // Company name (unique globally)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Reverse relations
  divisions DivisionUnit[]
  members   WorkMe[] // All WorkMe users affiliated with this company
}
```

**Key Points:**
- ✅ **Registry pattern** - searchable, reusable, unique by name
- ✅ **Many-to-many** relationship with `WorkMe` via `CompanyAffiliation`
- ✅ One `CompanyUnit` can have many `CompanyAffiliation` records (many employees)
- ✅ One `WorkMe` can have one `CompanyAffiliation` pointing to one `CompanyUnit`

---

### 4. DivisionUnit (Registry)

```prisma
model DivisionUnit {
  id            String   @id @default(uuid())
  name          String
  companyUnitId String   // Foreign key to CompanyUnit (required)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  company CompanyUnit @relation(fields: [companyUnitId], references: [id], onDelete: Cascade)
  members WorkMe[]    // All WorkMe users in this division

  @@unique([name, companyUnitId]) // Unique per company
}
```

**Key Points:**
- ✅ **Registry pattern** - searchable, reusable
- ✅ **Hierarchical** - belongs to a `CompanyUnit` (required)
- ✅ **Unique constraint** - `(name, companyUnitId)` ensures no duplicate divisions per company
- ✅ **Many-to-many** relationship with `WorkMe` via `CompanyAffiliation`

---

### 5. CompanyRegistry (WorkWorld Architecture - Separate)

```prisma
model CompanyRegistry {
  id        String   @id @default(cuid())
  name      String
  domain    String? // Optional for domain matching
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // WorkWorld/WorkConnect relations
  units      CompanyUnitHierarchy[]
  workplaces Workplace[]
  members    WorkMe[] // All WorkMe users with this Company HQ
}
```

**Key Points:**
- ⚠️ **Separate architecture** - used for WorkWorld/WorkConnect hierarchical org structure
- ⚠️ **NOT currently linked** to `CompanyAffiliation` (may be added later)
- ✅ Used for **Company HQ** in the new 3-field form (`companyName`, `unitName`, `divisionName`)
- ✅ Future: May link `CompanyAffiliation` to `CompanyRegistry` for HQ tracking

---

## Data Flow

### How WorkMe Gets Company Data

**WorkMe has direct foreign keys to company registries:**

```typescript
// ✅ CORRECT: Query WorkMe with company relations
const workMe = await prisma.workMe.findUnique({
  where: { id: workMeId },
  include: {
    company: true,     // CompanyRegistry (Company HQ)
    companyUnit: true, // CompanyUnit
    division: true,    // DivisionUnit
  },
})

// Access company data directly:
const companyHQName = workMe.company?.name
const companyUnitName = workMe.companyUnit?.name
const divisionName = workMe.division?.name
```

```typescript
// ✅ Also works: Access foreign key IDs directly
const workMe = await prisma.workMe.findUnique({
  where: { id: workMeId },
  select: {
    companyId: true,
    companyUnitId: true,
    divisionId: true,
  },
})
```

---

## API Route Pattern

### Saving Company Affiliation

**Current Implementation (3-field format):**

```typescript
POST /api/company-affiliation/save
Body: {
  companyName: string,    // Creates/searches CompanyRegistry (HQ)
  unitName: string,       // Creates/searches CompanyUnit
  divisionName: string    // Creates/searches DivisionUnit (requires unitName)
}
```

**Flow:**
1. Search or create `CompanyRegistry` (HQ) from `companyName`
2. Search or create `CompanyUnit` from `unitName`
3. Search or create `DivisionUnit` from `divisionName` (requires `companyUnitId`)
4. Update `WorkMe` directly with resolved IDs:
   ```typescript
   await prisma.workMe.update({
     where: { id: workMeId },
     data: {
       companyId: companyHQ.id,
       companyUnitId: companyUnit.id,
       divisionId: divisionUnit?.id || null,
     },
   })
   ```

**Legacy Implementation (ID-based format):**

```typescript
POST /api/company-affiliation/save
Body: {
  companyUnitId: string,
  divisionUnitId: string | null
}
```

---

## Foreign Key Summary

| Model | Foreign Keys | Notes |
|-------|-------------|-------|
| **WorkMe** | `companyId` (optional)<br>`companyUnitId` (optional)<br>`divisionId` (optional) | Direct FKs to all registries |
| **CompanyUnit** | None | Registry (standalone) |
| **DivisionUnit** | `companyUnitId` (required) | Belongs to CompanyUnit |
| **CompanyRegistry** | None | Registry (standalone, Company HQ) |

---

## Query Examples

### Get WorkMe with Company Data

```typescript
const profile = await prisma.workMe.findUnique({
  where: { id: workMeId },
  include: {
    company: { select: { id: true, name: true } },     // CompanyRegistry (HQ)
    companyUnit: { select: { id: true, name: true } }, // CompanyUnit
    division: { select: { id: true, name: true } },    // DivisionUnit
  },
})

// Access directly:
const companyHQName = profile.company?.name
const companyUnitName = profile.companyUnit?.name
const divisionName = profile.division?.name
```

### Get All Employees of a Company

```typescript
const company = await prisma.companyUnit.findUnique({
  where: { id: companyUnitId },
  include: {
    members: {
      select: { id: true, email: true, handle: true },
    },
  },
})

// Access directly:
const employees = company.members
```

### Get All Divisions in a Company

```typescript
const company = await prisma.companyUnit.findUnique({
  where: { id: companyUnitId },
  include: {
    divisions: {
      select: { id: true, name: true },
    },
  },
})
```

---

## Important Rules

1. ✅ **WorkMe has direct foreign keys** to all three registries
2. ✅ **No container model needed** - simple and direct relationships
3. ✅ **Use registry pattern** - search before create for all registries
4. ✅ **All foreign keys are optional** - `companyId`, `companyUnitId`, `divisionId` can be null
5. ✅ **Registries are reusable** - many `WorkMe` records can reference the same registry entry
6. ✅ **Direct queries** - query `WorkMe` with `include` to get company data

---

## Summary

**WorkMe → CompanyRegistry/CompanyUnit/DivisionUnit (Direct Foreign Keys)**

- `WorkMe` has **direct foreign keys** to all three registries:
  - `companyId` → `CompanyRegistry` (Company HQ)
  - `companyUnitId` → `CompanyUnit` (Company Unit)
  - `divisionId` → `DivisionUnit` (Division)
- **No container model** - simple and direct relationships
- All foreign keys are **optional** (can be null)
- Registry pattern ensures reusable, searchable company data
- Direct queries - no need to go through a junction table

