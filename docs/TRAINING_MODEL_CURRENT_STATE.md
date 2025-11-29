# Training Model - Current State

**Last Updated:** 2025-01-XX  
**Status:** Active Implementation

---

## 📋 PRISMA MODEL: CompanyTraining

```prisma
model CompanyTraining {
  id               String    @id @default(cuid())
  createdAt        DateTime  @default(now())
  title            String
  description      String?
  trainingDate     DateTime?  // Maps from "startDate" in UI
  deadline         DateTime?  // Maps from "endDate" in UI
  link             String?    // First link from links array
  mandatory        Boolean   @default(false)
  sponsoringOffice String?
  pocFirstName     String?    // Split from poc.name
  pocLastName      String?   // Split from poc.name
  pocEmail         String?
  pocPhone         String?

  companyId    String
  company      Company @relation("CompanyTrainingCompany", fields: [companyId], references: [id], onDelete: Cascade)
  originatorId String
  originator   WorkMe  @relation("CompanyTrainingOriginator", fields: [originatorId], references: [id], onDelete: Cascade)

  links CompanyWorkLink[]  // Links to WorkCommsProduct via CompanyWorkLink

  @@index([companyId])
  @@index([originatorId])
}
```

---

## 🎨 TYPESCRIPT INTERFACE: TrainingModel (UI)

**LEGACY - REMOVED:** The mapper-based ingestion system has been removed. See new Stage 1 → Stage 2 ingest system.

```typescript
interface TrainingModel {
  title: string
  description: string
  startDate: string | null        // ISO date string
  endDate: string | null          // ISO date string
  poc: {
    name: string | null
    email: string | null
    phone: string | null
  }
  links: string[]                 // Array of URLs
  metadata: {
    location?: string | null
    format?: string | null        // "in-person" | "virtual" | "hybrid"
    duration?: string | null
    cost?: string | null
    prerequisites?: string | null
  }
}
```

---

## 🔄 FIELD MAPPING: UI → Prisma

| UI Field (TrainingModel) | Prisma Field (CompanyTraining) | Notes |
|---------------------------|--------------------------------|-------|
| `title` | `title` | Direct mapping |
| `description` | `description` | Direct mapping |
| `startDate` | `trainingDate` | Converted to `Date` |
| `endDate` | `deadline` | Converted to `Date` |
| `links[0]` | `link` | Only first link stored |
| `poc.name` | `pocFirstName` + `pocLastName` | Split on space |
| `poc.email` | `pocEmail` | Direct mapping |
| `poc.phone` | `pocPhone` | Direct mapping |
| `metadata.*` | ❌ **NOT STORED** | Lost on save (no JSON field) |

---

## 🚀 API ROUTES

**⚠️ LEGACY SYSTEM REMOVED:** The following routes have been deleted as part of the legacy ingestion system cleanup:
- `/api/workstuff/hydrate` (POST) - **DELETED**
- `/api/workstuff/save-training` (POST) - **DELETED**

**NEW SYSTEM:** See Stage 1 → Stage 2 ingest system:
- `/api/workstuff/ingest/type-infer` (POST)
- `/api/workstuff/ingest/create-training` (POST)
- `/api/workstuff/ingest/training-hydrate` (POST)
- `/api/workstuff/ingest/training-save` (POST)

---

### 1. `/api/workstuff/hydrate` (POST) - **DELETED**

**Purpose:** Generate Training model from raw section text using GPT

**Input:**
```json
{
  "sectionId": "string"
}
```

**Output:**
```json
{
  "success": true,
  "model": {
    "title": "string",
    "description": "string",
    "startDate": "ISO string | null",
    "endDate": "ISO string | null",
    "poc": { "name": "string | null", "email": "string | null", "phone": "string | null" },
    "links": ["string"],
    "metadata": { "location": "string | null", "format": "string | null", ... }
  },
  "sectionId": "string"
}
```

**Logic:**
- Gets section from Redis (`getSections()`)
- Checks if `section.type === 'training'`
- If not training → returns `{ modelStatus: 'coming_soon' }`
- If training → calls GPT to extract structured data
- Stores hydrated model in Redis (`storeHydratedModel()`)
- Returns structured TrainingModel

**GPT Prompt:**
```
Extract structured training information from this text and return as JSON:
- title
- description
- startDate (ISO string)
- endDate (ISO string)
- poc: { name, email, phone }
- links: [array of URLs]
- metadata: { location, format, duration, cost, prerequisites }
```

---

### 2. `/api/workstuff/save-training` (POST) - **DELETED**

**Purpose:** Save Training model to Prisma as CompanyTraining

**Input:**
```json
{
  "sectionId": "string",
  "training": {
    "title": "string",
    "description": "string",
    "startDate": "ISO string | null",
    "endDate": "ISO string | null",
    "poc": { "name": "string | null", "email": "string | null", "phone": "string | null" },
    "links": ["string"],
    "metadata": { ... }
  }
}
```

**Output:**
```json
{
  "success": true,
  "training": {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "trainingDate": "DateTime | null",
    "deadline": "DateTime | null",
    ...
  }
}
```

**Logic:**
- Gets section from Redis for reference
- Creates new `CompanyTraining` (always creates, no upsert)
- Maps UI fields to Prisma fields:
  - `startDate` → `trainingDate` (converted to Date)
  - `endDate` → `deadline` (converted to Date)
  - `links[0]` → `link`
  - `poc.name` → split into `pocFirstName` + `pocLastName`
  - `metadata.*` → **LOST** (not stored in schema)
- Sets `companyId` and `originatorId` from auth

**⚠️ LIMITATIONS:**
- Only first link is stored (`link` field)
- Metadata is lost (no JSON field in schema)
- Multiple links beyond first are discarded

---

## 🎨 UI COMPONENTS

### `/app/mycompany/workforcestuff/mapper/[sectionId]/page.tsx` - **DELETED**

**Purpose:** Training Model Builder UI (Legacy - removed)

**Features:**
- Left pane: Raw section text
- Right pane: Editable form fields
  - Title (required)
  - Description
  - Start Date / End Date
  - POC: Name, Email, Phone
  - Links (textarea, one per line)
  - Metadata: Location, Format, Duration

**Flow:**
1. Load section from `/api/workstuff/map`
2. If `type !== 'training'` → show "coming soon" message
3. If `type === 'training'` → call `/api/workstuff/hydrate`
4. Populate form with hydrated model
5. User edits fields
6. On "Save" → call `/api/workstuff/save-training`
7. Redirect to `/mycompany/workforcestuff/{trainingId}`

---

## 🔗 RELATIONSHIPS

### CompanyWorkLink

Training can be linked to WorkCommsProduct via:

```prisma
model CompanyWorkLink {
  companyTrainingId String?
  companyTraining   CompanyTraining? @relation(...)
  workCommsProductId String
  workCommsProduct   WorkCommsProduct @relation(...)
  ...
}
```

**Usage:**
- When a product (poster, NTK, etc.) is created for a training
- Create a `CompanyWorkLink` connecting them
- Products show up in MyWork → WorkComms, grouped by training

---

## 📝 CURRENT LIMITATIONS

1. **Metadata Loss:** `metadata` object from UI is not stored in Prisma schema
2. **Single Link:** Only first link stored, rest discarded
3. **No Upsert:** Always creates new training, no update logic
4. **POC Name Split:** Simple space-based split may fail for complex names
5. **Redis Dependency:** Currently uses Redis for section storage (being refactored)

---

## 🎯 INFERENCE INTEGRATION

Training type is inferred via `/lib/services/companyx-topic-inference.ts`:

**Keywords:**
- "training", "mandatory training", "all hands training"
- "course", "learning", "session", "workshop"
- "briefing", "livestream", "run-hide-fight"
- "certification", "certificate", "required training"

**Confidence:** 0.9 if 2+ keyword matches, else LLM fallback

---

## 📚 RELATED DOCUMENTATION

- `docs/ARCHITECTURE_PRODUCTS_AND_OUTPUTS.md` - Overall architecture
- `docs/ARCHITECTURE_ENFORCEMENT_COMPLETE.md` - Refactor status
- `lib/services/companyx-topic-inference.ts` - Type inference service

---

## 🔄 MIGRATION NOTES

**Old Model:** `WorkContextTraining` (deleted)  
**New Model:** `CompanyTraining` (current)

**Changes:**
- Renamed from `WorkContextTraining` → `CompanyTraining`
- Same field structure maintained
- Now uses `CompanyWorkLink` instead of `WorkEventRouter`

