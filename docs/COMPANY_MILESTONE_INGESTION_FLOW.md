# Company Milestone Ingestion Flow Analysis

## Overview

This document explains the current state of company milestone ingestion, the difference between various flows, and the issues that need to be addressed.

## Current Flows

### 1. "Generate w/ AI" Flow (Current Default)

**Location:** `/mycompany/milestones/new`

**User Journey:**
1. User clicks "Generate w/ AI" option
2. User pastes URL or text
3. System creates a `CompanyNewsArtifact` (just stores raw text, no parsing)
4. System calls `/api/company/milestones/upsert` which:
   - Fetches the artifact
   - Uses AI to parse milestone information
   - Creates/updates `CompanyMilestone`

**API Flow:**
```
POST /api/utils/news-artifact/create
  → Creates CompanyNewsArtifact (stores rawText)
  
POST /api/company/milestones/upsert
  → Parses artifact.rawText with AI
  → Creates CompanyMilestone
```

**Issues:**
- ❌ Parser doesn't have strong guardrails against hallucination
- ❌ No confirmation step - creates milestone immediately
- ❌ Date extraction is weak - AI might hallucinate dates (e.g., defaults to 2023)
- ❌ Parser prompt doesn't emphasize "ONLY extract dates from the text, DO NOT invent dates"
- ❌ Not clear what types of milestones we're looking for (ship building, platform units, etc.)

### 2. Clip Parser Flow (From Signal/Google Scan)

**Location:** `/signal/google` (Google Scan page)

**User Journey:**
1. User searches for articles using Google Scan
2. User clicks "Ingest Article" on a search result
3. System calls `/api/signalingest/clip/parse` with:
   - `title` (from search result)
   - `url` (from search result)
   - `snippet` (from search result)
   - `date` (from search result - might be unreliable)
   - `source` (from search result)

**API Flow:**
```
POST /api/signalingest/clip/parse
  → Detects type from keywords (milestone, platform_product, etc.)
  → **RECENTLY FIXED:** Now returns error for milestones instead of auto-creating
  → For CompanyX types: Creates record immediately
```

**Previous Behavior (BEFORE FIX):**
- ❌ Auto-detected milestone keywords
- ❌ Created fake parsed object without real parsing
- ❌ Created CompanyMilestone immediately with minimal data
- ❌ Used unreliable `date` from search result (could be 2023 even if article is newer)
- ❌ No confirmation step

**Current Behavior (AFTER FIX):**
- ✅ Detects milestone keywords
- ✅ Returns error: "Milestone articles need to be ingested via the news artifact flow"
- ✅ Prevents auto-creation and hallucination

### 3. News Artifact Flow (Recommended)

**Location:** `/signal/clip` or news artifact pages

**User Journey:**
1. User creates a CompanyNewsArtifact (from URL or text)
2. User views the artifact
3. User can parse the artifact into different model types (milestone, platform_product, etc.)
4. User confirms before creating the record

**API Flow:**
```
POST /api/utils/news-artifact/create
  → Creates CompanyNewsArtifact
  
GET /signal/clip/[id]/parse (or similar)
  → Shows parsed preview
  → User confirms
  
POST /api/company/milestones/upsert (or similar)
  → Creates CompanyMilestone with confirmation
```

**Benefits:**
- ✅ Artifact is created first (can be reused)
- ✅ User sees parsed preview before creating
- ✅ User confirms before creating record
- ✅ Better for complex parsing scenarios

## Key Differences

| Feature | "Generate w/ AI" | Clip Parser (Old) | Clip Parser (New) | News Artifact Flow |
|---------|------------------|-------------------|-------------------|-------------------|
| Input Source | Manual URL/text | Google Search results | Google Search results | URL or text |
| Parsing | AI parsing in upsert | Keyword detection only | Blocked for milestones | Full AI parsing |
| Confirmation | ❌ None | ❌ None | ✅ Returns error | ✅ User previews |
| Date Source | AI extracted | Search result date | N/A | AI extracted from text |
| Artifact Created | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Reusable | ✅ Yes | ❌ No | ❌ No | ✅ Yes |

## Root Problems

### 1. Milestone Parser Hallucination

**Problem:** The AI parser in `/api/company/milestones/upsert` doesn't have strong enough guardrails.

**Current Prompt Issues:**
```
- date (ISO date YYYY-MM-DD): The milestone date
```

**What's Missing:**
- ❌ No instruction: "ONLY extract dates explicitly mentioned in the text"
- ❌ No instruction: "DO NOT invent or infer dates"
- ❌ No instruction: "If no date is mentioned, return null"
- ❌ No examples showing how to handle missing dates

**Why It Hallucinates:**
- AI models tend to "fill in" missing information
- Without explicit instructions, it might use training data patterns (e.g., defaulting to 2023)
- The prompt doesn't emphasize extraction-only behavior

### 2. Milestone Type Definitions

**Problem:** Not clear what types of milestones we're looking for.

**Current Prompt:**
```
- milestoneType (String): e.g., "KEEL_LAYING", "DELIVERY", "COMMISSIONING", "CONTRACT", "AWARD", "EXPANSION"
```

**Missing:**
- ❌ No clear definition of what constitutes a milestone
- ❌ Not clear if we're focused on ship building/platform units
- ❌ Categories are mixed (PLATFORM_UNIT, BUSINESS, STRATEGY, ACHIEVEMENT)
- ❌ No guidance on when to use which category

### 3. UX Default Flow

**Problem:** The milestone creation UX defaults to "Generate w/ AI" which has the hallucination problem.

**Questions:**
- Should it default to clip parser flow instead?
- Should it use the news artifact flow (more steps but safer)?
- Should we add a confirmation/preview step to "Generate w/ AI"?

### 4. Date Extraction from Articles

**Problem:** Articles might mention dates in various formats, and the parser needs to:
1. Extract dates ONLY from the text
2. Not use article metadata dates (which might be publication date, not milestone date)
3. Handle relative dates ("yesterday", "next month") appropriately
4. Return null if no date is mentioned

## Recommendations

### Immediate Fixes

1. **Fix Milestone Parser Prompt** (`/api/company/milestones/upsert`)
   - Add strong guardrails: "ONLY extract dates explicitly mentioned in the text"
   - Add: "DO NOT invent, infer, or guess dates"
   - Add: "If no date is mentioned in the text, return null"
   - Add examples showing null dates

2. **Add Confirmation Step to "Generate w/ AI"**
   - Parse first, show preview
   - User confirms before creating
   - Similar to news artifact flow

### Longer Term

1. **Define Milestone Types More Clearly**
   - Document what we're looking for (ship building, platform units, etc.)
   - Create clearer categories
   - Add examples

2. **Consider Defaulting to News Artifact Flow**
   - More steps but safer
   - Reusable artifacts
   - Better for complex scenarios

3. **Improve Date Extraction**
   - Better prompt instructions
   - Validate dates (e.g., warn if date is far in past/future)
   - Extract publication date separately from milestone date

## Code Locations

- **Milestone Creation UI:** `app/mycompany/milestones/new/page.tsx`
- **Milestone Upsert API:** `app/api/company/milestones/upsert/route.ts`
- **Clip Parser API:** `app/api/signalingest/clip/parse/route.ts`
- **News Artifact Create:** `app/api/utils/news-artifact/create/route.ts`
- **Google Scan Page:** `app/signal/google/page.tsx`

## Questions to Answer

1. What types of milestones are we primarily looking for? (Ship building? Platform units? Business milestones?)
2. Should "Generate w/ AI" have a confirmation step?
3. Should we default to news artifact flow instead?
4. How should we handle dates that are relative or unclear?
5. Should we validate extracted dates (e.g., warn if date seems wrong)?

