# Employee-First Architecture

## 🔵 Core Principle

**Employees belong to:**
- ✔️ `companyId` (authoritative org key)
- ✔️ `workMeCompanyId` (silent background tag)
- ✔️ `createdByWorkMeId` (audit trail)

**And NOTHING else.**

- ❌ No unit foreign keys
- ❌ No division models
- ❌ No junction tables except highlight linking

**Simple. Powerful. Clean.**

---

## 🧱 The Correct Employee Model

```prisma
model CompanyEmployee {
  id       String  @id @default(cuid())
  fullName String
  title    String?
  email    String?
  phone    String?
  photoUrl String?

  // Organizational context (employee-first architecture)
  companyId       String  // Authoritative organizational FK (required)
  workMeCompanyId String  // Silent background tag for tenant partitioning
  companyUnit     String? // Optional string label ("SEA 05", "NAVSEA HQ")
  division        String? // Optional string label (ignored by app logic)

  // Audit trail
  createdByWorkMeId String @db.Uuid // Who created this employee record

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  highlights CompanyEmployeeHighlightLink[]
  company    Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdBy  WorkMe  @relation("CompanyEmployeeCreator", fields: [createdByWorkMeId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([workMeCompanyId])
  @@index([companyUnit])
  @@index([fullName])
  @@index([email])
}
```

---

## 🟣 The Route Pattern

### POST /api/company/[companyId]/employees/upsert

**Request does NOT include `companyId`** - server assigns it from WorkMe context.

#### Upsert Payload:
```json
{
  "fullName": "John Doe",
  "title": "Deputy Director",
  "email": "john.doe@navy.mil",
  "companyUnit": "SEA 05",
  "photoUrl": null
}
```

#### Server Logic:
```typescript
const workme = await getWorkMeContext(request)
// gives us { workMeId, companyId, workMeCompanyId }

// Validate companyId matches route param
if (workme.companyId !== params.companyId) {
  return 403 // Unauthorized
}

// Upsert by email (case-insensitive) or fullName
const employee = await prisma.companyEmployee.upsert({
  where: { email: body.email?.toLowerCase() },
  update: {
    fullName: body.fullName,
    title: body.title,
    companyUnit: body.companyUnit || null,
    division: body.division || null,
  },
  create: {
    fullName: body.fullName,
    title: body.title,
    email: body.email?.toLowerCase() || null,
    companyUnit: body.companyUnit || null,
    division: body.division || null,
    companyId: workme.companyId,        // Authoritative org FK
    workMeCompanyId: workme.workMeCompanyId, // Silent tenant tag
    createdByWorkMeId: workme.workMeId, // Audit trail
  },
})
```

**This guarantees all employees sit under the correct company.**

---

## 🟩 The Correct Employee Query Route

### GET /api/company/[companyId]/employees

**Server:**
```typescript
const { companyId, workMeCompanyId } = await getWorkMeContext(request)

// Validate companyId matches route param
if (companyId !== params.companyId) {
  return 403 // Unauthorized
}

const employees = await prisma.companyEmployee.findMany({
  where: { 
    companyId,
    workMeCompanyId,
  },
  include: {
    highlights: {
      include: {
        highlight: true,
      },
    },
  },
  orderBy: { fullName: "asc" },
})
```

**No unit filtering. No division filtering. No conversion lookup. No secondary WorkMe calls.**

---

## 🟠 Highlight Flow (Now Simple)

### Step 1 — Choose or create employee
```typescript
// Use upsert route
const employee = await upsertEmployee({
  fullName: "John Doe",
  email: "john.doe@navy.mil",
  companyUnit: "SEA 05",
})
```

### Step 2 — Create highlight under companyId
```typescript
const highlight = await prisma.companyEmployeeHighlight.create({
  data: {
    citationText: "...",
    achievement: "...",
    createdByWorkMeId: workme.workMeId,
    companyUnitLabel: workme.companyUnit || employee.companyUnit,
  },
})
```

### Step 3 — Link them via junction table
```typescript
await prisma.companyEmployeeHighlightLink.create({
  data: {
    employeeId: employee.id,
    highlightId: highlight.id,
  },
})
```

---

## 🎯 Benefits

1. **Simple**: No complex unit lookups or conversions
2. **Authoritative**: `companyId` is the single source of truth
3. **Clean**: No unnecessary junction tables
4. **Auditable**: `createdByWorkMeId` tracks who created each employee
5. **Scalable**: `workMeCompanyId` enables multi-tenant partitioning

---

## 🔄 Migration Notes

When migrating existing employees:
- Set `companyId` from employee's current company relationship
- Set `workMeCompanyId` from WorkMe's `workMeCompanyId`
- Set `createdByWorkMeId` to a system user or the first WorkMe who created them
- Keep `companyUnit` and `division` as strings (no conversion needed)

