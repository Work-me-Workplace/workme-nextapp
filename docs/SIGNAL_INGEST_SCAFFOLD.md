# Signal Ingest Scaffold - Ground Truth

**Last Updated:** 2025-01-24  
**Purpose:** Raw scaffold documentation of all signal ingest endpoints and infrastructure

---

## Architecture Overview

WorkMe has **two main ingestion patterns**:

1. **Universal Ingestion Pattern** (`/api/ingest/{domain}/{feature}/{method}`)
   - Event AI ingestion
   - Promotional AI ingestion
   - Pure parsing endpoints (no DB writes)

2. **Workforce Stuff Ingestion** (`/api/workstuff/ingest/*`)
   - Type inference
   - Progressive parsing with Redis storage
   - Training/Career specific endpoints

---

## Universal Ingestion Endpoints

### 1. Event AI Ingestion

**Endpoint:** `POST /api/ingest/event/ai`  
**File:** `app/api/ingest/event/ai/route.ts`

**Flow:**
```
Raw Text → OpenAI GPT-4o-mini → Structured JSON → Returns Parsed Data (NO DB WRITE)
```

**Request:**
```typescript
{
  rawText: string
  userContext?: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    event: ParsedWorkEvent,
    items: ParsedEventItem[]
  }
}
```

**Key Features:**
- Uses `response_format: { type: 'json_object' }` for structured output
- Temperature: 0 (deterministic)
- Model: `gpt-4o-mini` (configurable via `OPENAI_MODEL`)
- Validates response structure
- Handles OpenAI errors (rate limits, auth, etc.)

**System Prompt:**
- Converts messy government/corporate event announcements into structured JSON
- Extracts: title, theme, description, dates, times, category, audience, registration, speakers, food, agenda items
- Category enum: `CELEBRATION | HERITAGE | COMMUNITY | RECOGNITION | APPRECIATION | FAMILY`
- Audience enum: `ALL_WORKFORCE | LEADERS | WORKFORCE_AND_FAMILIES | COMMUNITY`

---

### 2. Event Save

**Endpoint:** `POST /api/ingest/event/save`  
**File:** `app/api/ingest/event/save/route.ts`

**Flow:**
```
Parsed Event Data → Normalize → Prisma Transaction → Create CompanyEvent + EventItems
```

**Request:**
```typescript
EventIngestionResponse {
  event: ParsedWorkEvent,
  items: ParsedEventItem[]
}
```

**Response:**
```typescript
{
  success: true,
  eventId: string,
  itemCount: number
}
```

**Key Features:**
- Uses `normalizeGPTIngestionOutput()` to clean GPT output
- Creates `CompanyEvent` and `EventItem` records in a transaction
- Requires `companyUnit` to be set on WorkMe user
- Sets `createdByWorkMeId` on event

---

### 3. Promotional AI Ingestion

**Endpoint:** `POST /api/ingest/promotional/ai`  
**File:** `app/api/ingest/promotional/ai/route.ts`

**Flow:**
```
Raw Text + Type → OpenAI GPT-4o-mini → CVI-Ready Promotional Product Brief
```

**Request:**
```typescript
{
  type: string,
  rawText: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    name: string,
    type: string,
    title: string | null,
    headline: string | null,
    subheadline: string | null,
    details: string | null,
    perks: string | null,
    participation: string | null,
    foodProvided: string | null,
    foodTypes: string | null,
    theme: string | null,
    eventDateBlock: string | null,
    eventTimeBlock: string | null,
    rsvpLink: string | null,
    metadata: Record<string, any> | null
  }
}
```

**Key Features:**
- Converts event details into CVI-ready promotional product brief
- Extracts formatted date/time blocks
- Always sets `rsvpLink` to null (user fills manually)
- Does NOT save to database

---

## Workforce Stuff Ingestion Endpoints

### 1. Type Inference

**Endpoint:** `POST /api/workstuff/ingest/type-infer`  
**File:** `app/api/workstuff/ingest/type-infer/route.ts`

**Flow:**
```
Raw Blob → Hybrid Inference Service → Suggested Type
```

**Request:**
```typescript
{
  blob: string
}
```

**Response:**
```typescript
{
  success: true,
  suggestedType: string  // training, career, event, notice, task, other
}
```

**Key Features:**
- **Stage 1** of new ingest system
- Uses `inferCompanyXType()` service
- Maps CompanyXType to ingest type
- No DB writes, no parsing, just type inference

**Type Mapping:**
- `training` → `training`
- `career` → `career`
- `event` → `event`
- `impact_event` → `notice`
- `campaign|benefits|community|employee_cause` → `task`
- default → `other`

---

### Topic Inference Service (`lib/services/companyx-topic-inference.ts`)

**Function:** `inferCompanyXType(text: string): Promise<InferenceResult>`

**Hybrid Approach:**
1. **Deterministic keyword matching** - Scores text against keyword lists
2. **Pattern recognition** - If score >= 2, locks in type (confidence: 0.9)
3. **LLM fallback** - For ambiguous cases, uses GPT-4o-mini

**Supported Types:**
- `training` - Training programs, courses, certifications
- `career` - Career development, promotions, opportunities
- `event` - Company events, gatherings, meetings
- `campaign` - Company campaigns, initiatives, drives
- `impact_event` - Disruptions, outages, changes affecting workforce
- `benefits` - Benefits enrollment, open season
- `community` - Community engagement, volunteer opportunities
- `employee_cause` - Employee causes, drives, collections

**Keyword Lists:**
- Each type has a curated list of keywords
- Scoring: +1 per keyword match
- Threshold: >= 2 matches = deterministic (confidence 0.9)

**LLM Fallback:**
- Uses GPT-4o-mini with `response_format: { type: 'json_object' }`
- Temperature: 0 (deterministic)
- Returns: `{ type, confidence, explanation }`
- Always returns a valid type (never null/undefined)

---

### 3. Training Endpoints

**Files:**
- `app/api/workstuff/ingest/training-hydrate/route.ts`
- `app/api/workstuff/ingest/training-save/route.ts`
- `app/api/workstuff/ingest/create-training/route.ts`

**Purpose:** Progressive parsing and saving of training content

---

### 4. Career Endpoints

**Files:**
- `app/api/workstuff/ingest/career-hydrate/route.ts`
- `app/api/workstuff/ingest/career-save/route.ts`

**Purpose:** Progressive parsing and saving of career content

---

## Supporting Infrastructure

### Redis Storage (`lib/redis.ts`)

**Upstash Redis REST API** used for temporary workspace storage:

**Keys:**
- `workstuff:raw:{workMeId}` - Raw blob (24h TTL)
- `workstuff:proposed:{workMeId}` - Proposed CompanyX from Layer 1 (24h TTL)
- `workstuff:parsed:{workMeId}` - Parsed CompanyX from Layer 2 (7d TTL)
- `workstuff:pending:{workMeId}` - Pending field groups (7d TTL)

**Functions:**
- `storeRawBlob(workMeId, rawBlob, ttl?)`
- `storeProposedCompanyX(workMeId, proposedData, ttl?)`
- `storeParsedCompanyX(workMeId, parsedData, ttl?)`
- `storePendingFieldGroups(workMeId, pendingGroups, ttl?)`
- `getProposedCompanyX(workMeId)`
- `getParsedCompanyX(workMeId)`
- `getPendingFieldGroups(workMeId)`

**Environment Variables:**
- `UPSTASH_REDIS_REST_URL` - REST API URL (https://...)
- `UPSTASH_REDIS_REST_TOKEN` - REST API token

---

### GPT JSON Mapper Service (`lib/server/gptJsonMapperService.ts`)

**Purpose:** Normalizes GPT output into Prisma-ready objects

**Function:** `normalizeGPTIngestionOutput(gptOutput, companyUnit, originatorId)`

**Normalization:**
- String trimming and null conversion
- Array normalization (always array, filter empty strings)
- Enum mapping (EventCategory, EventAudience)
- Date parsing (YYYY-MM-DD format)
- Food provided normalization ("Yes"/"No")
- Type coercion and validation

**Returns:**
```typescript
{
  eventData: NormalizedEventData,
  eventItemsData: NormalizedItemData[]
}
```

---

### Type Definitions (`lib/types/event-ingestion.ts`)

**Interfaces:**
- `EventIngestionRequest` - Input to AI endpoint
- `ParsedWorkEvent` - Parsed event structure
- `ParsedEventItem` - Parsed item structure
- `EventIngestionResponse` - Combined event + items
- `EventIngestionAPIResponse` - Success response
- `EventIngestionAPIError` - Error response

---

## Authentication & Authorization

**All endpoints use:**
1. `verifyAuth(request)` - Verifies Firebase token, returns `firebaseId`
2. `loadWorkMe(firebaseId)` - Loads WorkMe identity, returns `{ id, companyUnit }`

**Requirements:**
- Valid Firebase token in Authorization header
- WorkMe user must exist
- `companyUnit` must be set (for save endpoints)

---

## Environment Variables

**Required:**
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - Model name (default: `gpt-4o-mini`)
- `UPSTASH_REDIS_REST_URL` - Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis REST API token

---

## File Structure

```
workme-nextapp/
├── app/api/
│   ├── ingest/
│   │   ├── event/
│   │   │   ├── ai/route.ts          # Event AI parsing
│   │   │   └── save/route.ts        # Event save to DB
│   │   └── promotional/
│   │       └── ai/route.ts          # Promotional AI parsing
│   └── workstuff/ingest/
│       ├── type-infer/route.ts      # Type inference (Stage 1)
│       ├── training-hydrate/route.ts
│       ├── training-save/route.ts
│       ├── create-training/route.ts
│       ├── career-hydrate/route.ts
│       └── career-save/route.ts
├── lib/
│   ├── redis.ts                     # Redis storage utilities
│   ├── server/
│   │   └── gptJsonMapperService.ts  # GPT output normalization
│   └── types/
│       └── event-ingestion.ts       # TypeScript types
└── docs/
    └── EVENT_AI_INGESTION.md        # Event ingestion docs
```

---

## Key Patterns

### 1. Two-Step Process (Parse → Save)
- **Parse endpoint** (`/ai`) - Pure parsing, no DB writes
- **Save endpoint** (`/save`) - Takes parsed data, saves to DB

### 2. Redis as Temporary Workspace
- Stores raw blobs and intermediate parsing results
- TTL-based expiration (24h for raw/proposed, 7d for parsed)
- Enables progressive parsing workflows

### 3. OpenAI Integration
- Consistent pattern: `response_format: { type: 'json_object' }`
- Temperature: 0 for deterministic parsing
- Model: `gpt-4o-mini` (configurable)
- Error handling for rate limits, auth, etc.

### 4. Normalization Layer
- GPT output → Normalized → Prisma-ready
- Handles type coercion, enum mapping, null conversion
- Validates and sanitizes all fields

---

## Notes

- **Type Inference** is the "Stage 1" system for workforce stuff ingestion
- Legacy Redis functions marked as `@deprecated REMOVED`
- All endpoints force dynamic rendering (`export const dynamic = 'force-dynamic'`)

