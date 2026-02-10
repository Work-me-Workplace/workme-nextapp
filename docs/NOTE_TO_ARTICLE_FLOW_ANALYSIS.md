# Note Lookup → Article Ingest Flow Analysis

**Date:** February 10, 2026

## Summary

- **Upstream compatibility:** Note Lookup has an "Ingest Article" button that flows into article processing.
- **Downstream gap:** The Article Ingest page (`/signal/clip`) does **not** support Note Lookup as an input method. It only supports URL, Paste Text, and Search (Google Scan).
- **Backwards compatibility needed:** Add "Note Lookup" as a 4th input method on the Clip Ingest Wizard so users can start from a phrase they heard and flow into the artifact creation path.

---

## Current Architecture

### 1. Note Lookup (`/signal/note`)

```
User enters phrase → POST /api/signalingest/note/lookup
                  → Returns { results: SignalSearchResult[] }
                  → User clicks "Ingest Article" on a result
                  → POST /api/signalingest/clip/parse { title, url, snippet, source, date }
                  → Creates CompanyX record directly (bypasses artifact bank)
```

**Key:** Note Lookup uses `clip/parse` directly. It does **not** create a `CompanyNewsArtifact` first. It infers type from title+snippet and creates the appropriate CompanyX record (ExternalPressure, platform product, etc.). Milestone articles are rejected with a suggestion to use the news artifact flow.

### 2. Article Ingest / Clip Ingest (`/signal/clip`)

```
Input methods: URL | Paste Text | Search (Google Scan)

URL:    Enter URL → Fetch article → Save to artifact → Parse page
Paste:  Paste text → Save to artifact → Parse page  
Search: Enter query → POST /api/signalingest/google/scan → Select result → Fetch URL → Save to artifact → Parse page
```

**Key:** Clip page creates a `CompanyNewsArtifact` first, then redirects to `/signal/clip/:id/parse` for downstream routing. This is the "artifact-first" flow.

### 3. The Two Paths

| Path | Entry | Creates Artifact? | Downstream |
|------|-------|-------------------|------------|
| **A: Note Lookup** | `/signal/note` → Ingest Article | No | `clip/parse` → CompanyX directly |
| **B: Clip Ingest** | `/signal/clip` → URL/Paste/Search | Yes | `news-artifact/create` → parse page → CompanyX |

---

## The Gap: Backwards Compatibility

**What's missing:** The Clip Ingest page has no "Note Lookup" mode. Users cannot:

1. Start at "Add Article" (`/signal/clip`)
2. Choose "Note Lookup" as the method
3. Enter a phrase they heard in a meeting
4. Get Note Lookup results and select one
5. Flow into the artifact creation path

**Current flow:** Note Lookup → Ingest Article → `clip/parse` (direct to CompanyX, no artifact).

**Desired flow:** Note Lookup should also be usable as an input method on the Clip page, so:
- User goes to Add Article
- Selects "Note Lookup" mode
- Enters phrase → gets results
- Selects result → fetches full article (or uses title+snippet) → creates artifact → parse page

This gives **backwards compatibility**: the article ingest page can consume Note Lookup as a source, not just URL paste or Google Search.

---

## Note-to-Article Flow (Current)

```
┌─────────────────┐     ┌─────────────────────────┐     ┌──────────────────────┐
│  Note Lookup    │     │  /api/signalingest/      │     │  clip/parse          │
│  /signal/note   │────▶│  note/lookup             │────▶│  (title, url,         │
│                 │     │  Returns search results  │     │   snippet, ...)      │
│  "Portfolio     │     │  (SignalSearchResult[])  │     │                      │
│   Aqusition     │     └─────────────────────────┘     │  Infers type,        │
│   Executive"   │                │                      │  creates CompanyX     │
└─────────────────┘                │                      └──────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │  User clicks            │
                         │  "Ingest Article"       │
                         │  on a result            │
                         └─────────────────────────┘
```

**Data flow:** `SignalSearchResult` = `{ title, url, snippet, source?, date? }` → `clip/parse` uses `title + snippet` as `rawText` (no full article fetch).

---

## Implementation: Add Note Lookup to Clip Page

### Option A: Add "Note Lookup" as 4th input mode (recommended)

1. Add `'note_lookup'` to `inputMode` state on `/signal/clip` page.
2. Add a "Note Lookup" button in the input mode toggle (next to URL, Paste Text, Search).
3. When in Note Lookup mode:
   - Show phrase input (like Note Lookup page).
   - Call `POST /api/signalingest/note/lookup` with the phrase.
   - Display results (same shape as Search results).
4. When user selects a result:
   - Use `handleSelectSearchResult(result)` — same as Search flow.
   - Fetch article from URL via `/api/utils/fetch-article`.
   - Populate text, headline, url.
   - User clicks "Save & Continue" → creates artifact → parse page.

**Result:** Note Lookup becomes a first-class input method on the article ingest page. Same downstream flow as Search.

### Option B: Deep link from Note Lookup to Clip with prefill

- On Note Lookup page, add "Add to Article Bank" (or similar) that links to `/signal/clip?noteLookup=1` or passes result data via query/state.
- Clip page reads params and pre-fills or shows Note Lookup UI.

**Result:** Entry point from Note Lookup to Clip, but requires navigation between pages.

### Option C: Both

- Add Note Lookup mode to Clip page (Option A).
- On Note Lookup page, add "Add to Article Bank" that navigates to `/signal/clip?mode=note_lookup` with optional phrase pre-filled.

---

## Compatibility Matrix

| Source | Clip Page Method | Creates Artifact | Parse Page |
|--------|------------------|------------------|------------|
| URL paste | URL | ✅ | ✅ |
| Manual paste | Paste Text | ✅ | ✅ |
| Google Scan | Search | ✅ | ✅ |
| **Note Lookup** | **Not supported** | N/A | Via direct `clip/parse` only |
| Note Lookup (after fix) | Note Lookup | ✅ | ✅ |

---

## Recommendation

**Implement Option A:** Add "Note Lookup" as a 4th input mode on the Clip Ingest Wizard. Reuse the same:
- API: `/api/signalingest/note/lookup`
- Result type: `SignalSearchResult[]`
- Selection flow: `handleSelectSearchResult` → fetch article → create artifact

This provides full backwards compatibility: article ingest can use Note Lookup as a method, alongside URL, Paste, and Search.
