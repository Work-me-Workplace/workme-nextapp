# Signal Routes & UX Documentation

**Last Updated:** 2025-01-24  
**Purpose:** Complete overview of Signal routes, pages, UX status, and user flows

---

## Overview

WorkMe has **two distinct Signal systems**:

1. **OSINT Signals** (`/signal/*`) - Public web/news verification and lookup
2. **WorkSignal** (`/mycompany/worksignal/*`) - Company-level signals/events

This document focuses on the **OSINT Signals** system (`/signal/*`).

---

## Signal Routes & Status

### ✅ Landing Page

**Route:** `/signal`  
**File:** `app/signal/page.tsx`  
**Status:** ✅ **Full UX Implemented**

**Description:**  
Landing page showing a grid of all 5 signal types with availability status.

**Features:**
- Grid layout with 5 signal type cards
- Color-coded icons (blue, green, purple, orange, indigo)
- "Available" vs "Coming Soon" badges
- Links to individual signal pages
- Sidebar navigation included
- Authentication required (redirects to `/signin` if not logged in)

**User Flow:**
1. User clicks "Signals" in sidebar (Radio icon)
2. Lands on `/signal` landing page
3. Sees grid of 5 signal types
4. Clicks on available signal type to navigate to specific page

---

### ✅ Note Lookup

**Route:** `/signal/note`  
**File:** `app/signal/note/page.tsx`  
**Status:** ✅ **Full UX Implemented**

**Description:**  
Form-based page to check if a phrase heard in a meeting is publicly verifiable.

**Features:**
- Textarea input for signal phrase
- Submit button with loading state
- Results display with:
  - Public/Not Public status indicator (green checkmark or gray X)
  - List of search results with:
    - Title
    - Snippet/description
    - Source URL (clickable)
    - Source name
    - Date (if available)
- Error handling with red alert box
- "Back to Signals" link
- Sidebar navigation included

**API Endpoint:**  
`POST /api/signalingest/note/lookup`

**Request:**
```typescript
{
  signal: string
}
```

**Response:**
```typescript
{
  success: true,
  public: boolean,
  results: SignalSearchResult[]
}
```

**User Flow:**
1. User navigates to `/signal/note` from landing page
2. Enters a phrase (e.g., "JFK C-Trials", "PM visit to key link")
3. Clicks "Lookup Signal" button
4. Sees loading spinner
5. Results display showing if signal is publicly verifiable
6. Can click external links to view sources

---

### ✅ Google Scan

**Route:** `/signal/google`  
**File:** `app/signal/google/page.tsx`  
**Status:** ✅ **Full UX Implemented**

**Description:**  
Form-based page for broad keyword-based web/news searches.

**Features:**
- Text input for search query
- Submit button with loading state
- Results display with:
  - Total results count (if available)
  - List of ranked results with:
    - Title
    - Snippet/description
    - Source URL (clickable)
    - Source name
    - Date (if available)
- Error handling with red alert box
- "Back to Signals" link
- Sidebar navigation included

**API Endpoint:**  
`POST /api/signalingest/google/scan`

**Request:**
```typescript
{
  query: string
}
```

**Response:**
```typescript
{
  success: true,
  results: SignalSearchResult[],
  totalResults?: number
}
```

**User Flow:**
1. User navigates to `/signal/google` from landing page
2. Enters search query (e.g., "CVN-79 JFK", "AUKUS submarine industrial base")
3. Clicks "Scan Web & News" button
4. Sees loading spinner
5. Results display showing ranked web/news results
6. Can click external links to view sources

---

### ❌ X Feed (Not Implemented)

**Route:** `/signal/x`  
**File:** ❌ **No page exists**  
**Status:** ❌ **No UX - API Stub Only**

**Description:**  
Intended for live Twitter/X feed signals (high frequency, public-facing).

**Current State:**
- API endpoint exists as stub: `POST /api/x/feed`
- Returns structured response with user's ecosystem contacts
- Frontend page exists at `/signal/x/feed`
- Shows as "Coming Soon" on landing page

**Planned Features (Future):**
- Pull live Twitter/X feed
- AI classification
- Normalize results

**To Implement:**
1. Create `app/signal/x/page.tsx`
2. Build form/interface for X feed input
3. Connect to API endpoint (when implemented)
4. Display feed results

---

### ❌ Senior Email (Not Implemented)

**Route:** `/signal/senior`  
**File:** ❌ **No page exists**  
**Status:** ❌ **No UX - API Stub Only**

**Description:**  
Intended for SES/Flag email context extraction and OSINT cross-check.

**Current State:**
- API endpoint exists as stub: `POST /api/signalingest/senior/parse`
- Returns `501 Not Implemented`
- No frontend page exists
- Shows as "Coming Soon" on landing page

**Planned Features (Future):**
- Paste email content
- Extract entities
- OSINT cross-check

**To Implement:**
1. Create `app/signal/senior/page.tsx`
2. Build form for email paste
3. Connect to API endpoint (when implemented)
4. Display extracted entities and cross-check results

---

### ❌ Clip Parser (Not Implemented)

**Route:** `/signal/clip`  
**File:** ❌ **No page exists**  
**Status:** ❌ **No UX - API Stub Only**

**Description:**  
Intended for parsing CHINFO / curated news clips.

**Current State:**
- API endpoint exists as stub: `POST /api/signalingest/clip/parse`
- Returns `501 Not Implemented`
- No frontend page exists
- Shows as "Coming Soon" on landing page

**Planned Features (Future):**
- Paste clip content
- AI extract units/platforms/countries/programs
- Normalize results

**To Implement:**
1. Create `app/signal/clip/page.tsx`
2. Build form for clip paste
3. Connect to API endpoint (when implemented)
4. Display extracted entities

---

## Navigation

### Sidebar Navigation

**Location:** `components/mywork/SidebarNav.tsx`

**Signal Section:**
```typescript
{
  name: 'Signals',
  items: [
    { name: 'Signals', path: '/signal', icon: Radio },
  ],
}
```

**Active State Logic:**
- Path `/signal` is active when `pathname?.startsWith('/signal')`
- This means all `/signal/*` routes will show as active when on any signal page

---

## API Endpoints

### Implemented Endpoints

#### 1. Note Lookup
- **Route:** `POST /api/signalingest/note/lookup`
- **File:** `app/api/signalingest/note/lookup/route.ts`
- **Status:** ✅ Fully Implemented
- **Authentication:** Required (Firebase token)
- **Service:** Uses `searchPublicSignal()` from `lib/services/signalSearch.ts`

#### 2. Google Scan
- **Route:** `POST /api/signalingest/google/scan`
- **File:** `app/api/signalingest/google/scan/route.ts`
- **Status:** ✅ Fully Implemented
- **Authentication:** Required (Firebase token)
- **Service:** Uses `searchPublicSignal()` from `lib/services/signalSearch.ts`

### Stub Endpoints (501 Not Implemented)

#### 3. X Feed
- **Route:** `POST /api/x/feed`
- **File:** `app/api/x/feed/route.ts`
- **Status:** ❌ Stub only

#### 4. Senior Email
- **Route:** `POST /api/signalingest/senior/parse`
- **File:** `app/api/signalingest/senior/parse/route.ts`
- **Status:** ❌ Stub only

#### 5. Clip Parser
- **Route:** `POST /api/signalingest/clip/parse`
- **File:** `app/api/signalingest/clip/parse/route.ts`
- **Status:** ❌ Stub only

---

## Supporting Infrastructure

### Type Definitions

**File:** `lib/types/signal.ts`

**Key Types:**
- `SignalType` enum (5 types: NOTE, GOOGLE, X, SENIOR, CLIP)
- `SignalSearchResult` interface
- Request/Response types for all endpoints

### OSINT Service

**File:** `lib/services/signalSearch.ts`

**Function:** `searchPublicSignal(query: string): Promise<SignalSearchResult[]>`

**Features:**
- Supports **serper.dev** (preferred) and **Bing Web Search API** (fallback)
- Returns normalized `SignalSearchResult[]`
- NO AI inference, NO hallucination
- Pure OSINT lookup

**Environment Variables:**
- `SERPER_API_KEY` (preferred) OR
- `BING_SEARCH_API_KEY` + `BING_SEARCH_ENDPOINT` (optional)

---

## User Experience Summary

### ✅ Complete User Flows

1. **Note Lookup Flow:**
   - Sidebar → Signals → Note Lookup → Enter phrase → View results

2. **Google Scan Flow:**
   - Sidebar → Signals → Google Scan → Enter query → View results

### ❌ Missing User Flows

1. **X Feed Flow:** No page exists
2. **Senior Email Flow:** No page exists
3. **Clip Parser Flow:** No page exists

---

## Implementation Status Matrix

| Route | Page Exists | UX Implemented | API Implemented | Status |
|-------|------------|----------------|-----------------|--------|
| `/signal` | ✅ | ✅ | N/A | ✅ Complete |
| `/signal/note` | ✅ | ✅ | ✅ | ✅ Complete |
| `/signal/google` | ✅ | ✅ | ✅ | ✅ Complete |
| `/signal/x` | ❌ | ❌ | ❌ | ❌ Not Started |
| `/signal/senior` | ❌ | ❌ | ❌ | ❌ Not Started |
| `/signal/clip` | ❌ | ❌ | ❌ | ❌ Not Started |

---

## Next Steps for Missing Features

### To Complete X Feed:

1. **Frontend:**
   - Create `app/signal/x/page.tsx`
   - Build form/interface for X feed input
   - Follow pattern from `/signal/note` or `/signal/google`

2. **Backend:**
   - Implement `POST /api/x/feed/route.ts`
   - Connect to Twitter/X API
   - Add AI classification
   - Normalize results

### To Complete Senior Email:

1. **Frontend:**
   - Create `app/signal/senior/page.tsx`
   - Build form for email paste (textarea)
   - Follow pattern from `/signal/note`

2. **Backend:**
   - Implement `POST /api/signalingest/senior/parse/route.ts`
   - Extract entities from email
   - OSINT cross-check
   - Return normalized results

### To Complete Clip Parser:

1. **Frontend:**
   - Create `app/signal/clip/page.tsx`
   - Build form for clip paste (textarea)
   - Follow pattern from `/signal/note`

2. **Backend:**
   - Implement `POST /api/signalingest/clip/parse/route.ts`
   - AI extract units/platforms/countries/programs
   - Normalize results

---

## Design Patterns

### Consistent UI Elements

All signal pages should include:

1. **Top Navigation Bar:**
   - Work.me logo (links to `/dashboard`)
   - Sign Out button

2. **Sidebar Navigation:**
   - Uses `SidebarNav` component
   - Shows active state

3. **Page Header:**
   - Icon (color-coded)
   - Title
   - Description
   - "Back to Signals" link (for sub-pages)

4. **Form Section:**
   - White card with shadow
   - Input field(s)
   - Submit button with loading state

5. **Results Section:**
   - White card with shadow
   - Results list with:
     - Title
     - Snippet
     - Source URL (external link icon)
     - Metadata (source, date)

6. **Error Handling:**
   - Red alert box with error message

### Color Scheme

- **Note Lookup:** Blue (`bg-blue-600`, `text-blue-600`)
- **Google Scan:** Green (`bg-green-600`, `text-green-600`)
- **X Feed:** Purple (`bg-purple-600`, `text-purple-600`) - when implemented
- **Senior Email:** Orange (`bg-orange-600`, `text-orange-600`) - when implemented
- **Clip Parser:** Indigo (`bg-indigo-600`, `text-indigo-600`) - when implemented

---

## Related Documentation

- `docs/SIGNAL_INGEST_IMPLEMENTATION.md` - Technical implementation details
- `docs/SIGNAL_INGEST_SCAFFOLD.md` - Architecture and scaffold documentation

---

## Notes

- All signal pages require authentication (Firebase token)
- All endpoints use `verifyAuth()` and `loadWorkMe()`
- Signal system is completely isolated from Universal Ingest and Workforce Ingest
- No database writes in v1 (stateless lookup only)
- Uses OSINT service for all searches (no AI inference for basic lookups)

---

**Summary:** The Signal system has a complete landing page and two fully functional pages (Note Lookup and Google Scan) with full UX. Three signal types (X Feed, Senior Email, Clip Parser) are stubbed at the API level but have no frontend pages or UX yet.

