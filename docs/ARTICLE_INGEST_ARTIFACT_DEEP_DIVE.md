# Article Ingest & Artifact System - Deep Dive

**Date:** 2026-02-06  
**Status:** Comprehensive Analysis & Enhancement Opportunities

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Data Model Architecture](#data-model-architecture)
3. [API Endpoints](#api-endpoints)
4. [User Flows](#user-flows)
5. [Parsing Intelligence](#parsing-intelligence)
6. [Current State Analysis](#current-state-analysis)
7. [Enhancement Opportunities](#enhancement-opportunities)
8. [Technical Deep Dives](#technical-deep-dives)

---

## System Overview

### Core Concept

The article ingest/artifact system is a **two-stage intelligence pipeline**:

1. **Stage 1: Ingest** - Capture raw article content as a global `CompanyNewsArtifact`
2. **Stage 2: Parse & Route** - Extract structured intelligence and create domain-specific records

### Key Principles

- **Artifact-First Architecture**: All articles become global artifacts first, then get parsed into specific models
- **Global Artifact Bank**: `CompanyNewsArtifact` belongs to company, not specific units/platforms
- **Multi-Purpose Parsing**: Same artifact can be parsed into different model types (unit update, milestone, external env, etc.)
- **Intelligence Extraction**: AI analyzes articles to extract metadata, sentiment, human elements, and structured data

---

## Data Model Architecture

### CompanyNewsArtifact (Global Artifact Bank)

**Purpose:** Universal storage for all ingested articles/press releases

```typescript
{
  id: string
  companyId: string                    // Company-scoped (not unit-specific)
  createdAt: DateTime
  updatedAt: DateTime
  
  // Article Metadata
  sourceName: string?                   // "USNI News", "HII Release", "DoD Release"
  sourceUrl: string?                    // URL of article/press release
  headline: string?                     // Article headline/title
  
  // Content
  rawText: string                       // Full article/press release text
  aiSummary: string?                    // AI-generated one paragraph summary
  
  // Article Intelligence (from /ingest endpoint)
  artifactType: string?                 // "unit_update", "milestone", "workforce", "leadership", etc.
  sentiment: string?                    // "positive", "negative", "neutral"
  humanElements: Json?                  // {"sponsor": "...", "leaders": [...], "spokespeople": [...]}
  noteworthyItems: Json?                // Key facts, dates, milestones
  leaderStatement: Json?                // Quotes from leadership
  
  // Relations
  createdByWorkMeId: string?
  platformStatements: CompanyPlatformStatement[]
  platformUnitStatements: CompanyPlatformUnitStatement[]
  milestones: CompanyMilestone[]
  externalEnv: CompanyExternalEnv[]
}
```

**Key Characteristics:**
- ✅ Global (company-scoped, not unit-specific)
- ✅ Immutable source of truth for raw article content
- ✅ Can be linked to multiple downstream records
- ✅ Stores AI-extracted intelligence metadata

### Downstream Models (Derived from Artifacts)

#### CompanyPlatformUnitUpdate
- Links to: `CompanyNewsArtifact` via `newsArtifactId`
- Contains: Parsed structured update data (percentComplete, statusUpdate, dates, etc.)

#### CompanyPlatformUnitStatement
- Links to: `CompanyNewsArtifact` via `newsArtifactId`
- Contains: Unit-specific statement derived from global artifact

#### CompanyMilestone
- Links to: `CompanyNewsArtifact` via `newsArtifactId`
- Contains: Company milestone information

#### CompanyExternalEnv
- Links to: `CompanyNewsArtifact` via `newsArtifactId`
- Contains: External signals, pressures, developments

#### CompanyX Models (Training, Event, Career, etc.)
- Links to: `CompanyNewsArtifact` via `newsArtifactId` (when created from artifacts)
- Contains: Workforce-related structured data

---

## API Endpoints

### 1. POST `/api/utils/news-artifact/create`

**Purpose:** Create a `CompanyNewsArtifact` from URL or text

**Input:**
```typescript
{
  sourceUrl?: string
  sourceName?: string
  headline?: string
  rawText: string                    // Required
  aiSummary?: string
  artifactType?: string
  sentiment?: string
  humanElements?: Json
  noteworthyItems?: Json
  leaderStatement?: Json
}
```

**Output:**
```typescript
{
  success: boolean
  data: {
    id: string
    sourceUrl: string | null
    sourceName: string | null
    headline: string | null
    rawText: string
    createdAt: DateTime
  }
}
```

**Flow:**
1. Validates authentication and companyId
2. Creates `CompanyNewsArtifact` record
3. Returns artifact ID for next step

**File:** `app/api/utils/news-artifact/create/route.ts`

---

### 2. POST `/api/utils/news-artifact/ingest`

**Purpose:** Comprehensive AI analysis of article content

**Input:**
```typescript
{
  text: string                        // Required - article text
  headline?: string
  sourceUrl?: string
  sourceName?: string
}
```

**Output:**
```typescript
{
  success: boolean
  data: {
    // Artifact metadata
    artifactType: string              // Inferred type
    sentiment: string                 // "positive" | "negative" | "neutral"
    articleStyle: string              // "factual_reporting" | "inferred_fault" | etc.
    humanElements: Json               // People mentioned
    noteworthyItems: Json             // Key facts
    leaderStatement: Json             // Leadership quotes
    narrativeSummary: string          // AI summary
    
    // CompanyPlatformUnitUpdate fields (if artifactType is unit_update)
    statusUpdate?: string
    percentComplete?: number
    scheduleNote?: string
    industrialBaseNote?: string
    leadershipQuote?: string
    keelLaidDate?: string
    seaTrialsStartDate?: string
    deliveryDate?: string
    commissioningDate?: string
    tags?: string[]
    
    // Original metadata
    rawText: string
    headline?: string
    sourceUrl?: string
    sourceName?: string
  }
}
```

**AI Analysis:**
- Determines artifact type (unit_update, milestone, workforce, etc.)
- Extracts sentiment
- Identifies human elements (sponsors, leaders, spokespeople)
- Extracts noteworthy items (key facts, dates, milestones)
- Parses leader statements/quotes
- For unit updates: Extracts structured fields (status, dates, percentages)

**File:** `app/api/utils/news-artifact/ingest/route.ts`

**Note:** This endpoint does NOT create a database record - it only analyzes. Use `/create` to save.

---

### 3. POST `/api/utils/news-artifact/parse`

**Purpose:** Universal parser that routes to appropriate parser based on modelType

**Input:**
```typescript
{
  artifactId?: string                 // Optional - loads text from artifact
  modelType: string                   // Required - what to parse as
  text?: string                       // Optional - if no artifactId
}
```

**Supported Model Types:**
- `platform_unit_update` - Extracts unit update fields
- `platform_unit_statement` - Extracts statement metadata
- `platform_statement` - Basic structure
- `platform_product` - Basic structure
- `milestone` - Basic structure
- `external_env` - Extracts external environment fields
- `training` - Routes to CompanyX parser
- `event` - Routes to CompanyX parser
- `career` - Routes to CompanyX parser
- `campaign` - Routes to CompanyX parser
- `impact_event` - Routes to CompanyX parser
- `community` - Routes to CompanyX parser
- `benefits` - Routes to CompanyX parser
- `employee_cause` - Routes to CompanyX parser

**Output:**
```typescript
{
  success: boolean
  modelType: string
  data: any                           // Parsed data structure (varies by modelType)
}
```

**Parsing Logic:**
- `platform_unit_update`: OpenAI extracts structured unit update fields
- `platform_unit_statement`: OpenAI extracts statement metadata
- `external_env`: OpenAI extracts external environment intelligence
- CompanyX types: Routes to `parseCompanyXContent()` service

**File:** `app/api/utils/news-artifact/parse/route.ts`

---

### 4. GET `/api/utils/news-artifact/list`

**Purpose:** List all `CompanyNewsArtifact` records for company

**Query Params:**
- `artifactType?: string` - Filter by type
- `sentiment?: string` - Filter by sentiment
- `limit?: number` - Default: 50
- `offset?: number` - Default: 0

**Output:**
```typescript
{
  success: boolean
  data: {
    artifacts: CompanyNewsArtifact[]
    total: number
    limit: number
    offset: number
  }
}
```

**File:** `app/api/utils/news-artifact/list/route.ts`

---

### 5. GET `/api/utils/news-artifact/[id]`

**Purpose:** Get single artifact by ID

**Output:**
```typescript
{
  success: boolean
  data: {
    id: string
    headline: string | null
    rawText: string
    sourceUrl: string | null
    sourceName: string | null
    artifactType: string | null
    createdAt: DateTime
  }
}
```

**File:** `app/api/utils/news-artifact/[id]/route.ts`

---

## User Flows

### Flow 1: Ingest Article → Create Artifact → Parse → Create Record

**Steps:**
1. User navigates to `/signal/clip`
2. Enters URL or pastes text
3. Clicks "Save & Continue"
4. System calls `/api/utils/news-artifact/create` → Creates artifact
5. Redirects to `/signal/clip/[artifactId]/parse`
6. User selects model type (e.g., "platform_unit_update")
7. Clicks "Parse Article"
8. System calls `/api/utils/news-artifact/parse` → Returns parsed data
9. User reviews/edits parsed data
10. User enters required IDs (e.g., unitId for unit updates)
11. Clicks "Save Update"
12. System creates domain record (e.g., `CompanyPlatformUnitUpdate`)

**Files:**
- `app/signal/clip/page.tsx` - Step 1: Ingest
- `app/signal/clip/[artifactId]/parse/page.tsx` - Step 2: Parse & Save

---

### Flow 2: Browse Global Artifacts → Parse → Create Record

**Steps:**
1. User navigates to `/mycompany/articles`
2. Views list of all artifacts (filtered by type/sentiment)
3. Clicks "Parse & Route" on an artifact
4. Redirects to `/signal/clip/[artifactId]/parse`
5. Continues with Flow 1 steps 6-12

**Files:**
- `app/mycompany/articles/page.tsx` - Global artifact bank

---

### Flow 3: Unit Update Page → Ingest Article → Create Update

**Steps:**
1. User navigates to unit detail page
2. Clicks "Ingest Article" button
3. Redirects to `/signal/clip?unitId={unitId}`
4. User enters article (URL or text)
5. Creates artifact → Redirects to parse page
6. Parse page pre-fills `unitId` from query params
7. User parses as "platform_unit_update"
8. Saves → Creates `CompanyPlatformUnitUpdate` linked to artifact

**Files:**
- `app/mycompany/platforms/units/[id]/page.tsx` - Unit detail page with ingest button

---

## Parsing Intelligence

### Artifact Type Inference

The `/ingest` endpoint uses AI to infer `artifactType`:

**Supported Types:**
- `unit_update` - Platform unit status updates
- `milestone` - Company milestones
- `workforce` - Workforce-related content
- `leadership` - Leadership announcements
- `industrial_base` - Industrial base issues
- `contract` - Contract announcements
- `general` - Generic news

**Inference Logic:**
- Analyzes article content
- Looks for keywords, patterns, context
- Returns most likely type

### Sentiment Analysis

**Values:** `positive`, `negative`, `neutral`

**Analysis:**
- Evaluates tone and language
- Identifies positive/negative indicators
- Classifies overall sentiment

### Human Elements Extraction

**Structure:**
```json
{
  "sponsor": "Name of ship sponsor if mentioned",
  "leaders": ["CEO", "Admiral", "Program Manager"],
  "spokespeople": ["PR Representative", "Media Contact"]
}
```

**Extraction Rules:**
- Leaders: CEOs, Admirals, Program Managers, Senior Executives ONLY
- NOT spokespeople (separate field)
- Extracts actual names when mentioned

### Unit Update Field Extraction

When `artifactType` is `unit_update`, extracts:

- `statusUpdate`: Current status (e.g., "Builder's Trials", "Sea Trials", "Keel Laid")
- `percentComplete`: Construction/progress percentage (0-100)
- `scheduleNote`: Schedule-related information
- `industrialBaseNote`: Industrial base issues
- `leadershipQuote`: Actual quote text from leadership
- Dates: `keelLaidDate`, `seaTrialsStartDate`, `deliveryDate`, `commissioningDate`
- `narrativeSummary`: 2-3 sentence factual summary
- `tags`: Array of relevant tags

---

## Current State Analysis

### ✅ What's Working

1. **Global Artifact Bank**
   - ✅ `/mycompany/articles` page exists
   - ✅ Lists all artifacts with filtering
   - ✅ Links to parse page

2. **Ingest Flow**
   - ✅ `/signal/clip` page for entering articles
   - ✅ URL fetching works
   - ✅ Text paste works
   - ✅ Creates artifacts correctly

3. **Parse Flow**
   - ✅ Universal parser endpoint
   - ✅ Supports multiple model types
   - ✅ Routes to appropriate parsers
   - ✅ Review/edit UI before saving

4. **Integration Points**
   - ✅ Unit detail page has "Ingest Article" button
   - ✅ Dual compatibility (unit-specific and global flows)
   - ✅ Artifacts link to downstream records

5. **AI Intelligence**
   - ✅ `/ingest` endpoint analyzes articles
   - ✅ Extracts metadata, sentiment, human elements
   - ✅ Infers artifact type
   - ✅ Extracts structured fields for unit updates

### ⚠️ Gaps & Issues

1. **Incomplete Parsers**
   - ❌ `platform_statement` - Basic structure only
   - ❌ `platform_product` - Basic structure only
   - ❌ `milestone` - Basic structure only
   - ✅ `platform_unit_update` - Full parser
   - ✅ `external_env` - Full parser
   - ✅ CompanyX types - Routes to existing parsers

2. **Missing Save Endpoints**
   - ❌ `platform_unit_statement` save not implemented
   - ❌ `platform_statement` save not implemented
   - ✅ `platform_unit_update` save works
   - ✅ `external_env` save works
   - ✅ CompanyX types save works

3. **UI Limitations**
   - ⚠️ Parse page shows generic JSON editor for unsupported types
   - ⚠️ No inline article ingestion modal (navigates away)
   - ⚠️ No batch ingestion support

4. **Intelligence Gaps**
   - ⚠️ `/ingest` endpoint focused on unit updates
   - ⚠️ Could be more generic for all artifact types
   - ⚠️ No automatic artifact type suggestion in UI

5. **Navigation**
   - ✅ Global artifacts page exists
   - ⚠️ Could be more prominent in navigation
   - ⚠️ No quick links from other pages

---

## Enhancement Opportunities

### 1. Enhanced Parsers

**Priority: High**

**Actions:**
- Implement full parsers for `platform_statement`, `platform_product`, `milestone`
- Add structured field extraction (similar to unit_update)
- Create save endpoints for these types

**Impact:**
- More complete parsing coverage
- Better structured data extraction
- Enables full workflow for all model types

---

### 2. Improved Ingest Intelligence

**Priority: Medium**

**Actions:**
- Make `/ingest` endpoint more generic (not just unit_update focused)
- Extract different fields based on inferred artifact type
- Return suggested model type for parse page

**Impact:**
- Better AI intelligence extraction
- More accurate type inference
- Better user experience

---

### 3. Inline Ingestion Modal

**Priority: Medium**

**Actions:**
- Add modal to unit detail page for inline article ingestion
- Don't navigate away from page
- Show progress and results inline

**Impact:**
- Better UX (no page navigation)
- Faster workflow
- More seamless integration

---

### 4. Batch Ingestion

**Priority: Low**

**Actions:**
- Support multiple URLs/text inputs at once
- Process in background
- Show progress for each article

**Impact:**
- Faster bulk ingestion
- Better for processing many articles

---

### 5. Enhanced Artifact Bank UI

**Priority: Medium**

**Actions:**
- Add search functionality
- Better filtering (date range, source, etc.)
- Preview modal (don't navigate to parse page immediately)
- Bulk actions (delete, tag, etc.)

**Impact:**
- Better artifact management
- Easier to find specific articles
- More efficient workflow

---

### 6. Artifact Linking & Relationships

**Priority: Low**

**Actions:**
- Show which records link to each artifact
- Visual relationship graph
- Link multiple artifacts to same record

**Impact:**
- Better understanding of data relationships
- Easier to trace provenance
- More powerful data model

---

### 7. Parsing History & Versioning

**Priority: Low**

**Actions:**
- Track parsing attempts
- Store parsed data versions
- Allow re-parsing with different model types

**Impact:**
- Better audit trail
- Can experiment with different parsers
- Historical data preservation

---

## Technical Deep Dives

### Parsing Architecture

**Current Pattern:**
```
Article Text
  ↓
/parse endpoint
  ↓
Switch on modelType
  ↓
Route to specific parser:
  - OpenAI direct (unit_update, external_env)
  - parseCompanyXContent() service (CompanyX types)
  - Basic structure (platform_statement, etc.)
  ↓
Return structured data
```

**Service Layer:**
- `lib/services/companyx-unified-mapper.ts` - `parseCompanyXContent()`
  - Routes to type-specific parsers:
    - `parseTraining()` → `lib/services/training-parser-service.ts`
    - `parseCareer()` → `lib/services/career-parser-service.ts`
    - `parseEvent()` → `lib/services/event-mapper-service.ts`
    - etc.

**Enhancement Opportunity:**
- Create unified parser service that handles all types
- Consistent error handling
- Better validation
- Caching parsed results

---

### AI Prompt Engineering

**Current Prompts:**
- `/ingest`: Focused on unit update extraction
- `/parse`: Type-specific prompts for each model type

**Enhancement Opportunities:**
- More sophisticated prompts for better extraction
- Few-shot examples for better accuracy
- Validation rules in prompts
- Better error handling for malformed AI responses

---

### Data Flow Diagram

```
┌─────────────────┐
│  User Input     │
│  (URL or Text)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  /api/utils/fetch-article│  (if URL)
│  Extract article text   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  /api/utils/news-       │
│  artifact/create        │
│  Create CompanyNews     │
│  Artifact               │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  /api/utils/news-       │
│  artifact/ingest        │
│  (Optional) AI Analysis │
│  Extract metadata       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  User selects modelType │
│  (platform_unit_update, │
│   external_env, etc.)   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  /api/utils/news-       │
│  artifact/parse         │
│  Parse for modelType    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  User reviews/edits     │
│  parsed data            │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Save to domain model   │
│  (CompanyPlatformUnit   │
│   Update, etc.)         │
│  Links to artifact      │
└─────────────────────────┘
```

---

## Summary

### Current State: ✅ Solid Foundation

The article ingest/artifact system has a **solid foundation**:
- ✅ Global artifact bank working
- ✅ Ingest flow working
- ✅ Parse flow working for key types
- ✅ Integration with unit pages working
- ✅ AI intelligence extraction working

### Key Strengths

1. **Artifact-First Architecture** - Clean separation of concerns
2. **Global Artifact Bank** - Single source of truth
3. **Flexible Parsing** - Same artifact can be parsed multiple ways
4. **AI Intelligence** - Good extraction of metadata and sentiment
5. **Integration** - Works well with existing pages

### Areas for Enhancement

1. **Complete Parsers** - Finish parsers for all model types
2. **Better Intelligence** - More generic ingest endpoint
3. **UX Improvements** - Inline modals, better UI
4. **Batch Processing** - Support multiple articles
5. **Enhanced Artifact Bank** - Search, filtering, previews

### Next Steps

1. **Priority 1:** Complete parsers for `platform_statement`, `platform_product`, `milestone`
2. **Priority 2:** Enhance `/ingest` endpoint to be more generic
3. **Priority 3:** Add inline ingestion modal
4. **Priority 4:** Enhance artifact bank UI with search/filtering

---

**This system is production-ready for current use cases, with clear paths for enhancement.**
