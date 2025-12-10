# NTK (Need to Know) Implementation Architecture

**Last Updated:** 2024  
**Purpose:** Comprehensive documentation of the NTK (Need to Know) system implementation in workme-nextapp

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Models](#database-models)
4. [API Routes](#api-routes)
5. [Frontend Pages](#frontend-pages)
6. [Components](#components)
7. [Services & Libraries](#services--libraries)
8. [Workflows](#workflows)
9. [Key Features](#key-features)
10. [Integration Points](#integration-points)

---

## Overview

The **NTK (Need to Know)** system is a comprehensive solution for generating structured internal communications in NAVSEA format. It supports both single-document generation and batch processing of multiple items from CSV files.

### Core Capabilities

- **Single NTK Generation**: Convert unstructured text into NAVSEA-formatted NTK documents
- **CSV Batch Processing**: Upload CSV files to create editions with multiple NTK items
- **AI-Powered Generation**: Uses OpenAI GPT-4o-mini to generate structured content
- **Field Extraction**: Parser extracts structured fields from raw communication text
- **Iterative Refinement**: Support for feedback and regeneration of content
- **Status Workflow**: Track items through PENDING → VALIDATED → GENERATED → REVIEWED → FINAL

### NAVSEA Format

NTK documents follow a specific NAVSEA (Naval Sea Systems Command) format:
- **Header**: `[TITLE IN ALL CAPS] – [MONTH] [DAY]`
- **POC**: `*POC: [name & email]*` (in markdown italics)
- **Summary**: 2-4 sentence summary in plain language, action-oriented, present-tense

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  /ntk                    │  /ntk/new         │  /ntk/parse  │
│  /ntk/[id]               │  /ntk/editions    │  /ntk/items   │
└──────────────┬───────────┴────────┬──────────┴──────────────┘
               │                     │
               ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (/api/ntk)                    │
├─────────────────────────────────────────────────────────────┤
│  GET    /api/ntk                    │  List all NTKs        │
│  POST   /api/ntk/generate           │  Generate NTK          │
│  POST   /api/ntk/parse               │  Parse text            │
│  GET    /api/ntk/[ntkId]             │  Get single NTK        │
│  PUT    /api/ntk/[ntkId]             │  Update NTK            │
│  DELETE /api/ntk/[ntkId]             │  Delete NTK            │
│  POST   /api/ntk/editions            │  Create edition        │
│  GET    /api/ntk/editions/[id]       │  Get edition           │
│  POST   /api/ntk/items/[id]/regenerate │ Regenerate item    │
│  PATCH  /api/ntk/items/[id]/mark-final │ Mark item final    │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Server Actions & Services                  │
├─────────────────────────────────────────────────────────────┤
│  lib/server/ntk.ts          │  CRUD operations for NTK       │
│  lib/server/ntk-edition.ts   │  Edition management           │
│  lib/services/ntk-generator.ts │ GPT generation              │
│  lib/ntk/ntkParser.ts        │  Field extraction            │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (Prisma)                        │
├─────────────────────────────────────────────────────────────┤
│  NTK          │  Single NTK documents                      │
│  NTKEdition   │  Batch processing containers                │
│  NTKItem      │  Individual items within editions           │
└─────────────────────────────────────────────────────────────┘
```

### Two Implementation Paths

The system has **two parallel implementations**:

1. **Legacy Single NTK Path** (`NTK` model)
   - Direct generation from text/CSV
   - Simple create → view → edit workflow
   - Stored in `NTK` table

2. **New Batch Processing Path** (`NTKEdition` + `NTKItem` models)
   - CSV upload → preview → edition creation
   - Multiple items per edition
   - Status workflow per item
   - Support for regeneration with feedback

---

## Database Models

### NTK Model (Legacy Single Document)

```prisma
model NTK {
  ntkId       String   @id @default(cuid()) @map("id")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // NAVSEA Structure
  header      String   // [TITLE IN ALL CAPS] – [MONTH] [DAY]
  poc         String   // *POC: [name & email]*
  summary     String   // 2-4 sentence summary
  sourceText  String?  // Original source text
  draftContent Json?   // Full NTK structure
  metadata    Json?    // Additional metadata (isCSV, generatedAt)

  // Multi-tenant scoping
  companyId   String
  company     Company  @relation("NTKCompany", ...)
  originatorId String
  originator  WorkMe   @relation("NTKOriginator", ...)

  @@index([originatorId])
  @@index([createdAt])
  @@map("ntk")
}
```

**Use Case**: Single document generation from manual text input or CSV content.

### NTKEdition Model (Batch Processing Container)

```prisma
model NTKEdition {
  id          String    @id @default(uuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  date        DateTime? // Edition date
  title       String?   // Edition title

  originatorId String
  originator   WorkMe   @relation("NTKEditionOriginator", ...)
  companyId    String
  company      Company  @relation("NTKEditionCompany", ...)

  items       NTKItem[] // One-to-many relationship

  @@index([companyId])
  @@index([originatorId])
  @@index([createdAt])
  @@map("ntk_editions")
}
```

**Use Case**: Container for batch processing multiple NTK items from CSV uploads.

### NTKItem Model (Individual Items in Edition)

```prisma
enum NTKStatus {
  PENDING
  VALIDATED
  GENERATED
  REVIEWED
  FINAL
}

model NTKItem {
  id           String     @id @default(uuid())
  editionId    String
  edition      NTKEdition @relation(...)

  inputId      String     // Stable per-row identifier (e.g., "ntk_${uuid}")
  rawFields    Json       // Store uploaded CSV row as JSON
  validated    Boolean    @default(false)

  plainLanguage String?   // GPT output (plain text)
  feedback      String?   // For regenerating with user feedback
  status        NTKStatus @default(PENDING)

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([editionId])
  @@index([inputId])
  @@index([status])
  @@map("ntk_items")
}
```

**Use Case**: Individual items within an edition, each with its own status and generation workflow.

---

## API Routes

### Core NTK Routes

#### `GET /api/ntk`
List all NTKs for the authenticated user's company.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ntkId": "clx...",
      "header": "TRAINING UPDATE – DECEMBER 15",
      "summary": "...",
      "createdAt": "2024-12-15T10:00:00Z",
      "updatedAt": "2024-12-15T10:00:00Z"
    }
  ]
}
```

#### `POST /api/ntk/generate`
Generate structured NTK from raw text.

**Request:**
```json
{
  "sourceText": "Raw text input...",
  "isCSV": false,
  "save": false
}
```

**Response:**
```json
{
  "success": true,
  "ntk": {
    "header": "TITLE – DECEMBER 15",
    "poc": "*POC: John Doe & john@example.com*",
    "summary": "2-4 sentence summary...",
    "title": "Original title",
    "deadline": "12/31/2024",
    "contactInfo": { ... },
    "relatedLinks": [ ... ],
    "tags": [ ... ]
  },
  "ntkId": "clx..." // if save=true
}
```

#### `GET /api/ntk/[ntkId]`
Get a single NTK by ID.

#### `PUT /api/ntk/[ntkId]`
Update an existing NTK.

#### `DELETE /api/ntk/[ntkId]`
Delete an NTK (requires ownership).

### Parser Route

#### `POST /api/ntk/parse`
Extract structured fields from raw text (extraction-only, no generation).

**Request:**
```json
{
  "text": "Raw communication text..."
}
```

**Response:**
```json
{
  "title": "Event Title",
  "description": "...",
  "location": "...",
  "start_date": "2024-12-20",
  "start_time": "10:00 AM",
  "deadlines": ["12/15/2024"],
  "poc_name": "John Doe",
  "poc_email": "john@example.com",
  "links": ["https://..."],
  "urgency": "high",
  "missing": ["end_date", "poc_phone"]
}
```

### Edition Routes

#### `GET /api/ntk/editions`
List all editions for the company.

#### `POST /api/ntk/editions`
Create a new edition from preview rows.

**Request:**
```json
{
  "previewRows": [
    {
      "inputId": "ntk_uuid1",
      "rawFields": { "title": "...", "description": "..." }
    }
  ],
  "title": "December 2024 Edition",
  "date": "2024-12-15T00:00:00Z"
}
```

#### `GET /api/ntk/editions/[editionId]`
Get a single edition with all items.

### Item Routes

#### `GET /api/ntk/items/[itemId]`
Get a single NTK item.

#### `POST /api/ntk/items/[itemId]/regenerate`
Regenerate plain language for an item (with optional feedback).

**Request:**
```json
{
  "feedback": "Make it more concise and action-oriented"
}
```

#### `PATCH /api/ntk/items/[itemId]/mark-final`
Mark an item as FINAL (cannot be undone).

---

## Frontend Pages

### `/ntk` - NTK Library
**File:** `app/ntk/page.tsx`

Main listing page showing all NTK documents for the company.

**Features:**
- List all NTKs with header, summary, and dates
- Create new NTK button
- View individual NTK
- Delete NTK (with confirmation)

### `/ntk/new` - Create New NTK
**File:** `app/ntk/new/page.tsx`

Create a new NTK document with three input modes:

1. **Manual Input**: Paste or type text directly
2. **Upload CSV**: Upload a CSV file
3. **Reuse Previous**: Reuse source text from previous NTK

**Workflow:**
1. Select input method
2. Enter/upload content
3. Click "Generate NTK" → Preview generated NTK
4. Review preview
5. Click "Save NTK" → Redirects to detail page

### `/ntk/[id]` - NTK Detail Page
**File:** `app/ntk/[id]/page.tsx`

View and edit a single NTK document.

**Features:**
- Display NTK in NAVSEA format
- Show source text (collapsible)
- Edit and save changes
- Back to list navigation

### `/ntk/parse` - NTK Parser MVP
**File:** `app/ntk/parse/page.tsx`

Standalone parser page for field extraction (no generation).

**Workflow:**
1. Paste raw communication text
2. Click "Parse Need-to-Know"
3. View extracted fields in structured format
4. See missing fields highlighted

### `/ntk/editions/[editionId]` - Edition View
**File:** `app/ntk/editions/[editionId]/page.tsx`

View an edition with all its items.

**Features:**
- Display edition metadata (title, date, creator)
- List all items with status badges
- Navigate to individual item pages
- Generate/regenerate buttons per item

### `/ntk/items/[itemId]` - Item Edit Page
**File:** `app/ntk/items/[itemId]/page.tsx`

Edit and manage a single NTK item.

**Features:**
- View raw fields from CSV
- Display generated plain language
- Provide feedback for regeneration
- Regenerate with feedback
- Mark as FINAL
- Status badge display

---

## Components

### `NTKPreview`
**File:** `components/ntk/NTKPreview.tsx`

Displays a structured NTK document in NAVSEA format.

**Props:**
```typescript
{
  ntk: NTKStructure
  sourceText?: string
  onSave?: () => void
  onEdit?: () => void
  isLoading?: boolean
}
```

**Displays:**
- Header (NAVSEA format)
- POC (markdown italics)
- Summary
- Key Points (if available)
- Action Items (if available)
- Deadline (highlighted)
- Contact Information
- Related Links
- Tags
- Source Text (collapsible)

### `CSVUpload`
**File:** `components/ntk/CSVUpload.tsx`

File upload component for CSV files with drag-and-drop support.

**Props:**
```typescript
{
  onFileContent: (content: string) => void
  onError?: (error: string) => void
}
```

**Features:**
- Drag and drop support
- Click to upload
- File validation (.csv only)
- Visual feedback

### `NtkInputForm`
**File:** `app/ntk/components/NtkInputForm.tsx`

Form for pasting text and triggering parser.

**Features:**
- Large textarea for input
- Parse button
- Loading state
- Error handling

### `NtkParsedPreview`
**File:** `app/ntk/components/NtkParsedPreview.tsx`

Displays parsed fields in structured sections.

**Sections:**
- Basic Information (title, description, location)
- Dates & Deadlines
- Point of Contact
- Intent & Call to Action
- Urgency (color-coded badge)
- Links
- Missing Fields (highlighted)
- Raw JSON view (collapsible)

---

## Services & Libraries

### `lib/services/ntk-generator.ts`
**Purpose:** Generate structured NTK from raw text using OpenAI.

**Function:**
```typescript
async function generateNTK(
  sourceText: string,
  feedback?: string
): Promise<NTKStructure>
```

**Process:**
1. Validates input text
2. Builds prompt with optional feedback
3. Calls OpenAI GPT-4o-mini
4. Parses JSON response
5. Validates NAVSEA structure (header, poc, summary required)
6. Returns structured NTK

**Model:** `gpt-4o-mini`  
**Temperature:** `0.3` (for consistency)  
**Response Format:** `json_object`

### `lib/ntk/ntkParser.ts`
**Purpose:** Extract structured fields from raw text (extraction-only, no rewriting).

**Function:**
```typescript
async function parseNTKBlob(blob: string): Promise<ParsedNTKInput>
```

**Extracted Fields:**
- `title`, `description`, `location`
- `start_date`, `start_time`, `end_date`, `end_time`
- `deadlines[]`
- `poc_name`, `poc_email`, `poc_phone`
- `links[]`
- `intent_phrase`, `cta`
- `urgency`: "low" | "moderate" | "high" | "deadline-critical"
- `missing[]`: Fields not found in source

**Rules:**
- **NO rewriting** or summarization
- **NO inference** of missing details
- Extract **only explicitly stated** information
- All missing fields listed in `missing` array

**Model:** `gpt-4o-mini`  
**Temperature:** `0.1` (very low for consistent extraction)

### `lib/server/ntk.ts`
**Purpose:** Server actions for NTK CRUD operations.

**Functions:**
- `createNTK()` - Create new NTK
- `updateNTK()` - Update existing NTK
- `getNTK()` - Get single NTK
- `listNTKs()` - List all NTKs for company
- `deleteNTK()` - Delete NTK (with ownership check)

**Authentication:** All functions require `workMeId` and `companyId` from `verifyAuth()`.

**Multi-tenant:** All queries scoped by `companyId`.

### `lib/server/ntk-edition.ts`
**Purpose:** Server actions for edition and item management.

**Functions:**
- `createEdition()` - Create edition from preview rows
- `listEditions()` - List all editions
- `getEdition()` - Get edition with items
- `regenerateItem()` - Regenerate plain language for item
- `markItemFinal()` - Mark item as FINAL

---

## Workflows

### Workflow 1: Single NTK Generation (Legacy Path)

```
User → /ntk/new
  ↓
Select Input Method (Manual/CSV)
  ↓
Enter/Upload Content
  ↓
Click "Generate NTK"
  ↓
POST /api/ntk/generate
  ↓
OpenAI generates NTK structure
  ↓
Preview displayed
  ↓
User reviews
  ↓
Click "Save NTK"
  ↓
POST /api/ntk/generate (save=true)
  ↓
NTK saved to database
  ↓
Redirect to /ntk/[id]
```

### Workflow 2: Batch Processing (New Path)

```
User → CSV Upload
  ↓
POST /api/ntk/csv-preview
  ↓
CSV parsed, rows validated
  ↓
Preview rows displayed
  ↓
User validates/edits rows
  ↓
Click "Create Edition"
  ↓
POST /api/ntk/editions
  ↓
Edition created, items saved (status: PENDING)
  ↓
Redirect to /ntk/editions/[id]
  ↓
For each item:
  ↓
Click "Generate" on item
  ↓
POST /api/ntk/items/[id]/regenerate
  ↓
OpenAI generates plain language
  ↓
Status → GENERATED
  ↓
User reviews, provides feedback (optional)
  ↓
Regenerate with feedback (optional)
  ↓
Click "Mark as Final"
  ↓
PATCH /api/ntk/items/[id]/mark-final
  ↓
Status → FINAL
```

### Workflow 3: Field Extraction (Parser Only)

```
User → /ntk/parse
  ↓
Paste raw text
  ↓
Click "Parse Need-to-Know"
  ↓
POST /api/ntk/parse
  ↓
OpenAI extracts fields (no generation)
  ↓
Display structured fields
  ↓
Show missing fields
```

---

## Key Features

### 1. Multi-Input Support
- **Manual Text**: Direct paste/type
- **CSV Upload**: Batch processing
- **Reuse Previous**: Reuse source from existing NTK

### 2. AI-Powered Generation
- Uses OpenAI GPT-4o-mini for cost efficiency
- Structured JSON output
- NAVSEA format compliance
- Feedback loop for refinement

### 3. Status Workflow
Items progress through states:
- `PENDING` → Initial state after CSV upload
- `VALIDATED` → User validated the row
- `GENERATED` → Plain language generated
- `REVIEWED` → User reviewed content
- `FINAL` → Approved, cannot be changed

### 4. Field Extraction
Parser extracts:
- Dates and deadlines
- Contact information
- Links and references
- Intent phrases and CTAs
- Urgency level
- Missing fields tracking

### 5. Multi-Tenant Support
- All data scoped by `companyId`
- User ownership tracked via `originatorId`
- Company-wide access for viewing
- Ownership required for editing/deleting

### 6. Error Handling
- Comprehensive error messages
- API key validation
- Rate limit handling
- JSON parsing validation
- Authentication checks

---

## Integration Points

### Authentication
- Uses `verifyAuth()` from `lib/server/verifyAuth`
- Requires Firebase token
- Returns `workMeId` and `companyId`

### OpenAI Integration
- Environment variable: `OPENAI_API_KEY`
- Lazy initialization to prevent build-time errors
- Error handling for API key issues and rate limits

### Database
- Prisma ORM
- Multi-tenant scoping
- Cascade deletes for related records
- Indexed fields for performance

### Related Systems

#### WorkforceComms
NTK is separate from the WorkforceComms system but shares similar goals:
- WorkforceComms: 3-layer email generation system
- NTK: Standalone NAVSEA format document generation
- Both can reference `WorkEventRouter` IDs for context

#### WorkStuff Ingestion
NTK content can be ingested into the WorkStuff system:
- API routes: `/api/workstuff/ingest/*`
- Supports `sourceType: 'ntk'`
- Specialized classification for NTK content

---

## File Structure

```
workme-nextapp/
├── app/
│   ├── ntk/
│   │   ├── page.tsx                    # NTK library listing
│   │   ├── layout.tsx                  # Layout with sidebar
│   │   ├── new/
│   │   │   └── page.tsx                # Create new NTK
│   │   ├── [id]/
│   │   │   └── page.tsx                # NTK detail page
│   │   ├── parse/
│   │   │   └── page.tsx                # Parser MVP page
│   │   ├── editions/
│   │   │   └── [editionId]/
│   │   │       └── page.tsx            # Edition view
│   │   ├── items/
│   │   │   └── [itemId]/
│   │   │       └── page.tsx             # Item edit page
│   │   └── components/
│   │       ├── NtkInputForm.tsx        # Parser input form
│   │       └── NtkParsedPreview.tsx    # Parsed fields display
│   └── api/
│       └── ntk/
│           ├── route.ts                # GET /api/ntk (list)
│           ├── generate/
│           │   └── route.ts            # POST /api/ntk/generate
│           ├── parse/
│           │   └── route.ts            # POST /api/ntk/parse
│           ├── [ntkId]/
│           │   └── route.ts            # GET/PUT/DELETE single NTK
│           ├── editions/
│           │   ├── route.ts            # GET/POST editions
│           │   └── [editionId]/
│           │       └── route.ts        # GET edition
│           └── items/
│               └── [itemId]/
│                   ├── route.ts        # GET item
│                   ├── regenerate/
│                   │   └── route.ts    # POST regenerate
│                   └── mark-final/
│                       └── route.ts    # PATCH mark final
├── components/
│   └── ntk/
│       ├── CSVUpload.tsx               # CSV upload component
│       └── NTKPreview.tsx              # NTK display component
├── lib/
│   ├── ntk/
│   │   ├── ntkParser.ts                # Field extraction service
│   │   └── ntkTypes.ts                 # Parser types
│   ├── server/
│   │   ├── ntk.ts                      # NTK CRUD server actions
│   │   └── ntk-edition.ts              # Edition/item server actions
│   ├── services/
│   │   └── ntk-generator.ts            # OpenAI generation service
│   └── types/
│       └── ntk.ts                      # NTK structure types
└── prisma/
    └── schema.prisma                    # Database models
```

---

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key for GPT generation

---

## Future Enhancements

Potential improvements based on codebase analysis:

1. **Unified Workflow**: Merge legacy single NTK path with batch processing
2. **CSV Template**: Provide CSV template for users
3. **Bulk Operations**: Generate all items in an edition at once
4. **Export**: Export editions as formatted documents
5. **Versioning**: Track changes to NTK items
6. **Collaboration**: Multi-user editing and review
7. **Templates**: Save and reuse NTK templates
8. **Integration**: Direct integration with WorkforceComms system

---

## Notes

- The system maintains backward compatibility with the legacy `NTK` model
- The new `NTKEdition` + `NTKItem` models provide more sophisticated batch processing
- Both paths can coexist, but consider consolidating in the future
- Parser is extraction-only by design (no rewriting or inference)
- Generator uses plain language, action-oriented, present-tense style
- All operations are multi-tenant scoped by `companyId`

