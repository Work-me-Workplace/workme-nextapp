# Employee Highlights Module Documentation

## Overview
The Employee Highlights module is a standalone MyCompany module for tracking and showcasing employee achievements, awards, and recognition. It uses AI-powered parsing to extract structured data from raw citation text.

## Database Schema

### Prisma Model: `CompanyEmployeeHighlight`

**Location:** `prisma/schema.prisma`

```prisma
model CompanyEmployeeHighlight {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Core person identity
  fullName String
  title    String? // role or billet: Engineer, TWH, Analyst
  unit     String? // NAVSEA 05, SEA 08, etc.

  // Award metadata
  awardName      String? // e.g., "Rosenblatt Young Naval Engineer Award"
  awardingAgency String? // e.g., "American Society of Naval Engineers"
  awardYear      Int?

  // Primary content
  citationText   String // full citation, multi-paragraph
  achievement    String? // single-sentence distilled summary
  narrative      String? // optional AI-synthesized story
  classification String? // "Leadership", "Innovation", etc.

  // Media
  photoUrl String?

  // Optional extras
  supervisorQuote String?

  // Relations
  companyUnit       String?
  createdByWorkMeId String
  createdBy         WorkMe  @relation("CompanyEmployeeHighlightCreator", fields: [createdByWorkMeId], references: [id], onDelete: Cascade)

  @@index([companyUnit])
  @@index([createdByWorkMeId])
}
```

**Migration:** `prisma/migrations/20250104130000_add_company_employee_highlight/migration.sql`

## AI Parser Service

### File: `lib/ai/highlightParser.ts`

**Function:** `parseHighlight(raw: string): Promise<ParsedHighlight>`

- **Purpose:** Pure function that extracts structured employee highlight data from raw citation text
- **Model:** GPT-4o-mini (configurable via `OPENAI_MODEL` env var)
- **Input:** Raw citation text (up to 4000 chars)
- **Output:** `ParsedHighlight` interface with structured fields
- **Features:**
  - Extracts clean entities from unstructured text
  - Preserves full verbatim citation text
  - Returns `null` for missing fields
  - No hallucinations - only extracts what's present

**Interface:**
```typescript
export interface ParsedHighlight {
  fullName: string
  title?: string | null
  unit?: string | null
  awardName?: string | null
  awardingAgency?: string | null
  awardYear?: number | null
  achievement?: string | null
  narrative?: string | null
  classification?: string | null
  citationText: string // MUST return full verbatim text
}
```

## Database Service Functions

### File: `lib/server/company/highlights.ts`

#### `createHighlight(data, workMeId, companyUnit)`
- Creates a new employee highlight
- Requires `workMeId` and optionally `companyUnit` for scoping
- Returns created highlight record

#### `updateHighlight(id, data, workMeId)`
- Updates an existing highlight
- **Authorization:** Only the creator can update (checks `createdByWorkMeId`)
- Returns updated highlight

#### `getHighlight(id)`
- Retrieves a single highlight by ID
- Throws error if not found

#### `listHighlights(companyUnit)`
- Lists all highlights for a company unit
- Returns empty array if `companyUnit` is null
- Ordered by `updatedAt` descending

## API Routes

### 1. POST `/api/company/highlights/create`

**File:** `app/api/company/highlights/create/route.ts`

**Purpose:** Create a new highlight via AI parsing

**Request Body:**
```json
{
  "rawText": "Full citation text here..."
}
```

**Response:**
```json
{
  "success": true,
  "highlightId": "clx..."
}
```

**Flow:**
1. Authenticates user via `requireWorkMeAuth`
2. Gets `companyUnit` from WorkMe profile
3. Calls `parseHighlight(rawText)` to extract structured data
4. Calls `createHighlight()` to save to database
5. Returns created highlight ID

---

### 2. GET `/api/company/highlights`

**File:** `app/api/company/highlights/route.ts`

**Purpose:** List all highlights for the user's company unit

**Response:**
```json
{
  "success": true,
  "highlights": [
    {
      "id": "clx...",
      "fullName": "John Doe",
      "awardName": "Excellence Award",
      "classification": "Leadership",
      "updatedAt": "2024-01-04T..."
    }
  ]
}
```

**Flow:**
1. Authenticates user via `requireWorkMeAuth`
2. Gets `companyUnit` from WorkMe profile
3. Calls `listHighlights(companyUnit)`
4. Returns array of highlights

---

### 3. GET `/api/company/highlights/[id]`

**File:** `app/api/company/highlights/[id]/route.ts`

**Purpose:** Get a single highlight by ID

**Response:**
```json
{
  "success": true,
  "highlight": {
    "id": "clx...",
    "fullName": "John Doe",
    "title": "Engineer",
    "unit": "NAVSEA 05",
    "awardName": "Excellence Award",
    "awardingAgency": "ASNE",
    "awardYear": 2024,
    "citationText": "Full citation...",
    "achievement": "Summary...",
    "narrative": "Story...",
    "classification": "Leadership",
    "photoUrl": "https://...",
    "supervisorQuote": "Quote...",
    "createdAt": "2024-01-04T...",
    "updatedAt": "2024-01-04T..."
  }
}
```

**Flow:**
1. Authenticates user via `requireWorkMeAuth`
2. Calls `getHighlight(id)`
3. Returns full highlight record

---

### 4. PUT `/api/company/highlights/[id]`

**File:** `app/api/company/highlights/[id]/route.ts`

**Purpose:** Update an existing highlight

**Request Body:**
```json
{
  "fullName": "John Doe",
  "title": "Senior Engineer",
  "unit": "NAVSEA 05",
  "awardName": "Excellence Award",
  "awardingAgency": "ASNE",
  "awardYear": 2024,
  "achievement": "Updated summary",
  "narrative": "Updated narrative",
  "classification": "Innovation",
  "photoUrl": "https://...",
  "supervisorQuote": "Updated quote",
  "citationText": "Updated citation..."
}
```

**Response:**
```json
{
  "success": true,
  "highlight": { /* updated record */ }
}
```

**Flow:**
1. Authenticates user via `requireWorkMeAuth`
2. Gets `workMeId` from auth
3. Calls `updateHighlight(id, data, workMeId)` (includes ownership check)
4. Returns updated highlight

**Authorization:** Only the creator can update (enforced in `updateHighlight`)

## UI Pages

### 1. List View: `/mycompany/highlights`

**File:** `app/mycompany/highlights/page.tsx`

**Features:**
- Displays all highlights as cards in a grid
- Shows: Name, Award Name, Classification tag (color-coded), Updated date
- "Add Highlight" button linking to `/mycompany/highlights/new`
- Empty state with call-to-action
- Clicking a card navigates to detail page

**Layout:**
- Top navigation bar
- Left sidebar (`SidebarNav`)
- Main content area with grid of highlight cards

---

### 2. Ingest View: `/mycompany/highlights/new`

**File:** `app/mycompany/highlights/new/page.tsx`

**Features:**
- Large textarea for raw citation input
- "Generate Highlight" button that POSTs to `/api/company/highlights/create`
- Loading state during AI parsing
- Error handling and display
- Redirects to detail page after successful creation
- Subtle description about AI parsing

**Layout:**
- Top navigation bar
- Left sidebar (`SidebarNav`)
- Centered form with textarea and action buttons

---

### 3. Detail/Edit View: `/mycompany/highlights/[id]`

**File:** `app/mycompany/highlights/[id]/page.tsx`

**Features:**
- **View Mode:** Displays all fields in organized sections
- **Edit Mode:** Full form with all editable fields
- Toggle between view/edit modes
- Save button for PUT requests to `/api/company/highlights/[id]`
- Cancel button to discard changes

**Editable Fields:**
- `fullName` (required)
- `title`
- `unit`
- `awardName`
- `awardingAgency`
- `awardYear`
- `classification`
- `photoUrl`
- `supervisorQuote`
- `achievement` (textarea)
- `narrative` (textarea)
- `citationText` (large textarea, required)

**Read-only Fields:**
- `id`
- `createdAt`
- `createdByWorkMeId`

**Layout:**
- Top navigation bar
- Left sidebar (`SidebarNav`)
- Centered content with form/view sections
- Matches `CompanyTraining` detail page style

## Navigation Integration

### Sidebar Navigation

**File:** `components/mywork/SidebarNav.tsx`

**Location in Sidebar:**
- Section: "MyCompany"
- Item: "Employee Highlights"
- Path: `/mycompany/highlights`
- Icon: `Award` (from lucide-react)

**Code:**
```typescript
{
  name: 'MyCompany',
  items: [
    { name: 'Workforce Stuff', path: '/mycompany/workforcestuff', icon: Users },
    { name: 'Company Milestones', path: '/mycompany/milestones', icon: TrendingUp },
    { name: 'Employee Highlights', path: '/mycompany/highlights', icon: Award },
  ],
}
```

### MyCompany Hub

**File:** `app/mycompany/page.tsx`

**Purpose:** Landing page showing cards for all three MyCompany modules

**Features:**
- Card for "Employee Highlights" linking to `/mycompany/highlights`
- Consistent styling with other module cards
- Purple color scheme for Employee Highlights card

## File Structure

```
app/
├── api/
│   └── company/
│       └── highlights/
│           ├── create/
│           │   └── route.ts          # POST /api/company/highlights/create
│           ├── [id]/
│           │   └── route.ts          # GET/PUT /api/company/highlights/[id]
│           └── route.ts              # GET /api/company/highlights
├── mycompany/
│   └── highlights/
│       ├── [id]/
│       │   └── page.tsx              # Detail/Edit view
│       ├── new/
│       │   └── page.tsx              # AI ingest form
│       └── page.tsx                 # List view

lib/
├── ai/
│   └── highlightParser.ts            # AI parsing service
└── server/
    └── company/
        └── highlights.ts             # DB service functions

prisma/
├── schema.prisma                     # CompanyEmployeeHighlight model
└── migrations/
    └── 20250104130000_add_company_employee_highlight/
        └── migration.sql             # Database migration
```

## Authentication & Authorization

### Authentication
- All API routes use `requireWorkMeAuth` middleware
- Ensures user is authenticated via Firebase → WorkMe

### Authorization
- **Create:** Any authenticated user can create highlights
- **Read:** Users can view all highlights in their `companyUnit`
- **Update:** Only the creator (`createdByWorkMeId`) can update a highlight
- **Delete:** Not implemented (cascade delete via Prisma relation)

### Scoping
- All highlights are scoped by `companyUnit`
- `companyUnit` is derived from the authenticated user's WorkMe profile
- Users can only see highlights from their own company unit

## Data Flow

### Creating a Highlight

1. User navigates to `/mycompany/highlights/new`
2. User pastes raw citation text into textarea
3. User clicks "Generate Highlight"
4. Frontend POSTs to `/api/company/highlights/create` with `rawText`
5. API calls `parseHighlight(rawText)` to extract structured data
6. API calls `createHighlight(parsedData, workMeId, companyUnit)`
7. Database record created
8. Frontend redirects to `/mycompany/highlights/[id]`

### Viewing Highlights

1. User navigates to `/mycompany/highlights`
2. Frontend GETs `/api/company/highlights`
3. API calls `listHighlights(companyUnit)`
4. Frontend displays highlights as cards
5. User clicks a card → navigates to `/mycompany/highlights/[id]`
6. Frontend GETs `/api/company/highlights/[id]`
7. API calls `getHighlight(id)`
8. Frontend displays highlight details

### Editing a Highlight

1. User navigates to `/mycompany/highlights/[id]`
2. User clicks "Edit" button
3. Form fields become editable
4. User makes changes
5. User clicks "Save Changes"
6. Frontend PUTs to `/api/company/highlights/[id]` with updated data
7. API calls `updateHighlight(id, data, workMeId)` (checks ownership)
8. Database record updated
9. Frontend refreshes to show updated data

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key for AI parsing
- `OPENAI_MODEL` (optional) - Model to use (defaults to `gpt-4o-mini`)

## Dependencies

- `openai` - OpenAI SDK for AI parsing
- `@prisma/client` - Prisma client for database operations
- `next` - Next.js framework
- `lucide-react` - Icons (Award, Plus, etc.)
- `firebase/auth` - Authentication

## Testing Checklist

- [x] Create highlight via AI parsing
- [x] List highlights for company unit
- [x] View single highlight
- [x] Edit highlight (as creator)
- [x] Authorization check (non-creator cannot edit)
- [x] Navigation integration
- [x] Empty states
- [x] Error handling
- [x] Loading states
- [x] Form validation

## Future Enhancements

Potential improvements:
- Bulk import from CSV/Excel
- Photo upload (currently URL only)
- Export highlights to PDF
- Search and filtering
- Tags/categories beyond classification
- Public-facing highlight pages
- Integration with company intranet
- Email notifications for new highlights

