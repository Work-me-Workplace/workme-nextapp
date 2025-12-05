# WorkMe Company Architecture

## Overview

The WorkMe company architecture uses a **clean separation** between personal identity (`WorkMe`), employment context (`CompanyAffiliation`), and company registries (`CompanyUnit`, `DivisionUnit`, `CompanyRegistry`).

---

## Core Principle

**WorkMe does NOT store company data directly.** All company affiliation is stored in the `CompanyAffiliation` model, which acts as a junction table linking `WorkMe` to company registries.

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

  // ONE-TO-ONE relationship with CompanyAffiliation
  companyAffiliation CompanyAffiliation?
  
  // Other bolt-on modules...
  workProfile        WorkProfile?
  workSkills         WorkSkills?
  workEntries        WorkEntry[]
  // ...
}
```

**Key Points:**
- ✅ `WorkMe` has **ONE** `CompanyAffiliation` record (one-to-one via `workMeId`)
- ❌ `WorkMe` does **NOT** have direct foreign keys to `CompanyUnit` or `DivisionUnit`
- ❌ `WorkMe` does **NOT** store company names or division names directly

---

### 2. CompanyAffiliation (Employment Context)

```prisma
model CompanyAffiliation {
  id             String  @id @default(uuid())
  workMeId       String  @unique  // Foreign key to WorkMe
  companyUnitId  String? // Foreign key to CompanyUnit (optional)
  divisionUnitId String? // Foreign key to DivisionUnit (optional)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  workMe   WorkMe        @relation(fields: [workMeId], references: [id], onDelete: Cascade)
  company  CompanyUnit?  @relation(fields: [companyUnitId], references: [id])
  division DivisionUnit? @relation(fields: [divisionUnitId], references: [id])
}
```

**Key Points:**
- ✅ **ONE** `CompanyAffiliation` per `WorkMe` (enforced by `workMeId @unique`)
- ✅ Stores **optional** foreign keys to `CompanyUnit` and `DivisionUnit`
- ✅ This is the **ONLY** place where `WorkMe` links to company data
- ✅ All company affiliation queries go through `CompanyAffiliation`, not `WorkMe`

**Relationship Flow:**
```
WorkMe → CompanyAffiliation → CompanyUnit
                              DivisionUnit
```

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
  members   CompanyAffiliation[] // All WorkMe users affiliated with this company
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
  company CompanyUnit          @relation(fields: [companyUnitId], references: [id], onDelete: Cascade)
  members CompanyAffiliation[] // All WorkMe users in this division

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

**WorkMe does NOT get company data directly.** All access flows through `CompanyAffiliation`:

```typescript
// ✅ CORRECT: Query via CompanyAffiliation
const workMe = await prisma.workMe.findUnique({
  where: { id: workMeId },
  include: {
    companyAffiliation: {
      include: {
        company: true,  // CompanyUnit
        division: true, // DivisionUnit
      },
    },
  },
})

// Access company data:
const companyName = workMe.companyAffiliation?.company?.name
const divisionName = workMe.companyAffiliation?.division?.name
```

```typescript
// ❌ WRONG: WorkMe has no direct company fields
const workMe = await prisma.workMe.findUnique({
  where: { id: workMeId },
})
// workMe.companyName ❌ Does not exist!
// workMe.companyUnitId ❌ Does not exist!
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
4. Upsert `CompanyAffiliation` with resolved IDs:
   ```typescript
   await prisma.companyAffiliation.upsert({
     where: { workMeId },
     create: {
       workMeId,
       companyUnitId: companyUnit.id,
       divisionUnitId: divisionUnit?.id || null,
     },
     update: {
       companyUnitId: companyUnit.id,
       divisionUnitId: divisionUnit?.id || null,
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
| **WorkMe** | `companyAffiliation` (relation only) | No direct company FKs |
| **CompanyAffiliation** | `workMeId` (required, unique)<br>`companyUnitId` (optional)<br>`divisionUnitId` (optional) | Junction table |
| **CompanyUnit** | None | Registry (standalone) |
| **DivisionUnit** | `companyUnitId` (required) | Belongs to CompanyUnit |
| **CompanyRegistry** | None | WorkWorld architecture (separate) |

---

## Query Examples

### Get WorkMe with Company Affiliation

```typescript
const profile = await prisma.workMe.findUnique({
  where: { id: workMeId },
  include: {
    companyAffiliation: {
      include: {
        company: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
      },
    },
  },
})

// Access:
const companyName = profile.companyAffiliation?.company?.name
const divisionName = profile.companyAffiliation?.division?.name
```

### Get All Employees of a Company

```typescript
const company = await prisma.companyUnit.findUnique({
  where: { id: companyUnitId },
  include: {
    members: {
      include: {
        workMe: {
          select: { id: true, email: true, handle: true },
        },
      },
    },
  },
})

// Access:
const employees = company.members.map(m => m.workMe)
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

1. ✅ **Always query company data via `CompanyAffiliation`**
2. ✅ **Never add company fields directly to `WorkMe`**
3. ✅ **Use registry pattern** - search before create for `CompanyUnit` and `DivisionUnit`
4. ✅ **One `CompanyAffiliation` per `WorkMe`** (enforced by unique constraint)
5. ✅ **Optional company affiliation** - `companyUnitId` and `divisionUnitId` can be null
6. ⚠️ **`CompanyRegistry` is separate** - currently used for HQ but not linked to `CompanyAffiliation` yet

---

## Future Considerations

### Potential Enhancement: Link CompanyRegistry to CompanyAffiliation

Currently, `CompanyRegistry` (Company HQ) is created but not stored in `CompanyAffiliation`. Future enhancement:

```prisma
model CompanyAffiliation {
  // ... existing fields
  companyRegistryId String? // Add FK to CompanyRegistry (HQ)
  companyRegistry   CompanyRegistry? @relation(...)
}
```

This would allow tracking:
- **Company HQ** (`CompanyRegistry`) - Top-level company
- **Company Unit** (`CompanyUnit`) - Business unit/division
- **Division** (`DivisionUnit`) - Sub-division within unit

---

## Summary

**WorkMe → CompanyAffiliation → CompanyUnit/DivisionUnit**

- `WorkMe` has **ONE** `CompanyAffiliation` (one-to-one)
- `CompanyAffiliation` has **optional** FKs to `CompanyUnit` and `DivisionUnit`
- `WorkMe` does **NOT** have direct company foreign keys
- All company queries go through `CompanyAffiliation`
- Registry pattern ensures reusable, searchable company data

