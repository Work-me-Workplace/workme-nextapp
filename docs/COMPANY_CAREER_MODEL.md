# CompanyCareer Model - Implementation Guide

**Last Updated:** 2025-01-28  
**Status:** Ready for Implementation

---

## 📋 PRISMA MODEL: CompanyCareer

```prisma
model CompanyCareer {
  id             String   @id @default(cuid())
  createdAt      DateTime @default(now())
  
  // Core
  title          String
  description    String?
  
  // Deadlines (JSON array)
  deadlines      Json? // Array of {label: string, date: DateTime}
  
  // Supervisor & Resources
  supervisorName String?
  resourceLink   String?
  
  // Point of Contact
  pocFirstName   String?
  pocLastName    String?
  pocEmail       String?
  pocPhone       String?
  pocDepartment  String?
  
  // Relations
  companyId    String
  company      Company @relation("CompanyCareerCompany", fields: [companyId], references: [id], onDelete: Cascade)
  links        CompanyWorkLink[]  // Links to WorkCommsProduct via CompanyWorkLink
  
  @@index([companyId])
}
```

---

## 🎯 KEY DIFFERENCES FROM CompanyTraining

| Aspect | CompanyTraining | CompanyCareer |
|--------|----------------|---------------|
| **Date Fields** | `trainingDate`, `startTime`, `endTime` | `deadlines` (JSON array) |
| **Ingest Fields** | ✅ Has `ingestRawText`, `ingestType`, `ingestStatus` | ❌ **NOT YET** - needs to be added |
| **Mandatory Flag** | ✅ Has `mandatory` boolean | ❌ No mandatory flag |
| **Topic** | ✅ Has `topic` field | ❌ No topic field |
| **Location/Format** | ✅ Has `location`, `format` | ❌ No location/format |
| **POC Structure** | ✅ Has `pocRankOrTitle` | ✅ Has `pocDepartment` instead |
| **Supervisor** | ❌ No supervisor | ✅ Has `supervisorName` |
| **Resource Link** | ❌ No resource link | ✅ Has `resourceLink` |

---

## 🎨 PROPOSED TYPESCRIPT INTERFACE: CareerModel (UI)

```typescript
interface CareerModel {
  title: string | null
  description: string | null
  deadlines: Array<{
    label: string
    date: string // ISO date string
  }> | null
  supervisorName: string | null
  resourceLink: string | null
  poc: {
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    department: string | null
  }
}
```

---

## 🔄 FIELD MAPPING: UI → Prisma

| UI Field (CareerModel) | Prisma Field (CompanyCareer) | Notes |
|------------------------|------------------------------|-------|
| `title` | `title` | Direct mapping |
| `description` | `description` | Direct mapping |
| `deadlines` | `deadlines` | JSON array, stored as-is |
| `supervisorName` | `supervisorName` | Direct mapping |
| `resourceLink` | `resourceLink` | Direct mapping |
| `poc.firstName` | `pocFirstName` | Direct mapping |
| `poc.lastName` | `pocLastName` | Direct mapping |
| `poc.email` | `pocEmail` | Direct mapping |
| `poc.phone` | `pocPhone` | Direct mapping |
| `poc.department` | `pocDepartment` | Direct mapping |

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Add Ingest Fields to Prisma Schema

**Required Migration:**
```prisma
model CompanyCareer {
  // ... existing fields ...
  
  // Stage 1 Ingest Snapshot (NEW)
  ingestRawText    String?
  ingestType       String?
  ingestStatus     String? @default("pending")
  ingestCreatedAt  DateTime? @default(now())
}
```

**Migration Command:**
```bash
npx prisma migrate dev --name add_career_ingest_fields
```

---

### Phase 2: Create API Routes (Following Training Pattern)

#### 2.1 `/api/workstuff/ingest/create-career` (POST)

**Purpose:** Stage 1 - Create CompanyCareer with ingest snapshot

**Input:**
```json
{
  "rawText": "string",
  "selectedType": "career"
}
```

**Output:**
```json
{
  "success": true,
  "careerId": "string",
  "redirectTo": "/mycompany/workforcestuff/career/ingest/{careerId}",
  "career": { ... }
}
```

**Logic:**
- Creates `CompanyCareer` with ONLY ingest fields populated
- Sets `ingestRawText`, `ingestType: "career"`, `ingestStatus: "pending"`
- All "real" fields remain `null`
- Returns `careerId` and redirect path

---

#### 2.2 `/api/workstuff/ingest/career-hydrate` (POST)

**Purpose:** Stage 2 - Hydrate Career model from raw text using GPT

**Input:**
```json
{
  "careerId": "string"
}
```

**Output:**
```json
{
  "success": true,
  "model": {
    "title": "string | null",
    "description": "string | null",
    "deadlines": [
      { "label": "Application Deadline", "date": "2025-02-15" },
      { "label": "Interview Window", "date": "2025-02-20" }
    ] | null,
    "supervisorName": "string | null",
    "resourceLink": "string | null",
    "poc": {
      "firstName": "string | null",
      "lastName": "string | null",
      "email": "string | null",
      "phone": "string | null",
      "department": "string | null"
    }
  }
}
```

**Logic:**
- Loads `CompanyCareer` by `careerId`
- Reads `ingestRawText`
- Calls GPT to extract structured fields
- Returns hydrated `CareerModel` (no DB writes)

**GPT Prompt:**
```
Extract structured career opportunity information from the following NAVSEA workforce announcement.

Extract:
- title: The job title or opportunity name
- description: Full description of the opportunity
- deadlines: Array of {label: string, date: YYYY-MM-DD} for all deadlines mentioned
- supervisorName: Name of supervisor or hiring manager
- resourceLink: First URL that appears to be an application or resource link
- poc: { firstName, lastName, email, phone, department }

Return as JSON. If a field is not mentioned, set it to null.
```

---

#### 2.3 `/api/workstuff/ingest/career-save` (POST)

**Purpose:** Stage 2 Save - Finalize Career Entry

**Input:**
```json
{
  "careerId": "string",
  "title": "string | null",
  "description": "string | null",
  "deadlines": [
    { "label": "Application Deadline", "date": "2025-02-15" }
  ] | null,
  "supervisorName": "string | null",
  "resourceLink": "string | null",
  "poc": {
    "firstName": "string | null",
    "lastName": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "department": "string | null"
  }
}
```

**Output:**
```json
{
  "success": true,
  "careerId": "string",
  "career": { ... }
}
```

**Logic:**
- Updates ALL real career fields in `CompanyCareer` row
- Sets `ingestStatus = "saved"`
- Does NOT overwrite ingest fields (`ingestRawText`, `ingestType`, `ingestCreatedAt`)
- Converts `deadlines` array to JSON for storage

---

### Phase 3: Create UI Components

#### 3.1 `/app/mycompany/workforcestuff/career/ingest/[careerId]/page.tsx`

**Purpose:** Stage 2 - Career Model Builder UI

**Features:**
- Left pane: Raw text (from `ingestRawText`)
- Right pane: Editable form fields:
  - Title (required)
  - Description
  - Deadlines (dynamic list):
    - Add/remove deadline entries
    - Each entry: Label + Date picker
  - Supervisor Name
  - Resource Link (URL)
  - POC:
    - First Name
    - Last Name
    - Email
    - Phone
    - Department

**Flow:**
1. On load: POST `/api/workstuff/ingest/career-hydrate`
2. Populate form with hydrated model
3. User edits fields
4. On "Save": POST `/api/workstuff/ingest/career-save`
5. Redirect to `/mycompany/workforcestuff/career/[careerId]`

---

#### 3.2 `/app/mycompany/workforcestuff/career/[careerId]/page.tsx`

**Purpose:** Career Detail View (similar to Training detail page)

**Features:**
- Display all career fields
- Show deadlines as a list with labels
- Show POC information
- Show supervisor name
- Show resource link (clickable)
- Display ingest status badge

---

### Phase 4: Update Type Inference Service

**File:** `lib/services/companyx-topic-inference.ts`

**Add Career Keywords:**
```typescript
const KEYWORDS: Record<CompanyXType, string[]> = {
  // ... existing ...
  career: [
    "career",
    "professional development",
    "fellowship",
    "leadership program",
    "ccas",
    "assessment cycle",
    "promotion",
    "nominations are open",
    "application package",
    "job opening",
    "position available",
    "hiring",
    "opportunity",
    "career advancement"
  ],
}
```

---

### Phase 5: Update Ingest Flow

**File:** `app/api/workstuff/ingest/create-training/route.ts`

**Add Career Support:**
```typescript
if (selectedType === 'career') {
  const career = await prisma.companyCareer.create({
    data: {
      ingestRawText: rawText,
      ingestType: selectedType,
      ingestStatus: 'pending',
      ingestCreatedAt: new Date(),
      companyId,
      // All real fields remain null
    },
  })
  
  return NextResponse.json({
    success: true,
    careerId: career.id,
    redirectTo: `/mycompany/workforcestuff/career/ingest/${career.id}`,
    career,
  })
}
```

---

### Phase 6: Update Workforce Stuff Dashboard

**File:** `app/api/workforcestuff/route.ts`

**Already includes Career normalization** ✅

**File:** `app/mycompany/workforcestuff/page.tsx`

**Already includes Career in category filter** ✅

**Add Career Detail Route:**
- Create `/app/mycompany/workforcestuff/career/[careerId]/page.tsx`
- Similar to training detail page
- Display deadlines as a list

---

## 🔗 RELATIONSHIPS

### CompanyWorkLink

Career can be linked to WorkCommsProduct via:

```prisma
model CompanyWorkLink {
  companyCareerId String?
  companyCareer   CompanyCareer? @relation(...)
  workCommsProductId String
  workCommsProduct   WorkCommsProduct @relation(...)
  ...
}
```

**Usage:**
- When a product (poster, NTK, etc.) is created for a career opportunity
- Create a `CompanyWorkLink` connecting them
- Products show up in MyWork → WorkComms, grouped by career

---

## 📝 SPECIAL CONSIDERATIONS

### Deadlines JSON Structure

**Storage Format:**
```json
[
  { "label": "Application Deadline", "date": "2025-02-15T00:00:00.000Z" },
  { "label": "Interview Window", "date": "2025-02-20T00:00:00.000Z" }
]
```

**TypeScript Type:**
```typescript
type Deadline = {
  label: string
  date: string // ISO date string
}
```

**Prisma Handling:**
- Prisma stores JSON as-is
- No validation on structure (client must ensure correct format)
- Dates stored as ISO strings in JSON (not DateTime objects)

---

### POC Department vs Rank/Title

**Training:** Uses `pocRankOrTitle` (e.g., "CDR", "Mr.", "Ms.")  
**Career:** Uses `pocDepartment` (e.g., "HR", "Talent Management")

**Rationale:**
- Career opportunities typically have department contacts
- Training often has rank-based contacts (military context)

---

## 🎯 INFERENCE INTEGRATION

Career type is inferred via `/lib/services/companyx-topic-inference.ts`:

**Keywords:**
- "career", "professional development", "fellowship"
- "leadership program", "ccas", "assessment cycle"
- "promotion", "nominations are open", "application package"
- "job opening", "position available", "hiring", "opportunity"

**Confidence:** 0.9 if 2+ keyword matches, else LLM fallback

---

## 📚 RELATED DOCUMENTATION

- `docs/ARCHITECTURE_PRODUCTS_AND_OUTPUTS.md` - Overall architecture
- `docs/TRAINING_MODEL_CURRENT_STATE.md` - Training implementation (reference)
- `lib/services/companyx-topic-inference.ts` - Type inference service
- `app/api/workstuff/ingest/create-training/route.ts` - Training Stage 1 (reference)
- `app/api/workstuff/ingest/training-hydrate/route.ts` - Training Stage 2 Hydrate (reference)
- `app/api/workstuff/ingest/training-save/route.ts` - Training Stage 2 Save (reference)

---

## ✅ CHECKLIST FOR IMPLEMENTATION

### Prisma Schema
- [ ] Add ingest fields to `CompanyCareer` model
- [ ] Run migration: `npx prisma migrate dev --name add_career_ingest_fields`

### API Routes
- [ ] Create `/api/workstuff/ingest/create-career` (POST)
- [ ] Create `/api/workstuff/ingest/career-hydrate` (POST)
- [ ] Create `/api/workstuff/ingest/career-save` (POST)
- [ ] Create `/api/workforcestuff/career/[careerId]/route.ts` (GET)
- [ ] Update `/api/workstuff/ingest/create-training/route.ts` to support "career" type

### Services
- [ ] Create `lib/services/career-parser-service.ts` (similar to `training-parser-service.ts`)
- [ ] Update `lib/services/companyx-topic-inference.ts` with career keywords

### UI Components
- [ ] Create `/app/mycompany/workforcestuff/career/ingest/[careerId]/page.tsx`
- [ ] Create `/app/mycompany/workforcestuff/career/[careerId]/page.tsx`
- [ ] Update `/app/mycompany/workforcestuff/ingest/page.tsx` to support career type selection

### Testing
- [ ] Test Stage 1: Create career with ingest snapshot
- [ ] Test Stage 2: Hydrate career from raw text
- [ ] Test Stage 2: Save career with all fields
- [ ] Test Career appears in Workforce Stuff dashboard
- [ ] Test Career detail page displays correctly
- [ ] Test Deadlines JSON parsing and display

---

## 🚨 KNOWN LIMITATIONS

1. **No Ingest Fields Yet:** CompanyCareer model doesn't have ingest snapshot fields (needs migration)
2. **Deadlines JSON:** No validation on JSON structure (client must ensure correct format)
3. **No Date Range:** Unlike Training, Career uses multiple deadlines instead of a date range
4. **No Location/Format:** Career doesn't have location or format fields (unlike Training)

---

## 🔄 MIGRATION NOTES

**Old Model:** `WorkContextCareer` (if it existed, now deleted)  
**New Model:** `CompanyCareer` (current)

**Changes:**
- Uses `CompanyWorkLink` instead of `WorkEventRouter`
- Multi-tenant via `companyId` (no `originatorId` needed)
- Deadlines stored as JSON array (flexible structure)

---

**End of Document**

