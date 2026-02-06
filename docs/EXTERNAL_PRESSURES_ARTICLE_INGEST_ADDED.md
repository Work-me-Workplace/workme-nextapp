# External Pressures - Article Ingest Added ✅

**Date:** 2026-02-06  
**Status:** ✅ Complete - Reverse Compatibility Added

---

## What Was Fixed

### Problem
The `/mycompany/external-pressures/create` page:
- ❌ Had NO article ingest capability
- ❌ Defaulted to "GAO" (confusing)
- ❌ Only supported manual entry

### Solution
Added **full article ingest support** with reverse compatibility:

1. **Three Input Methods** (like `/mycompany/external-env/create`):
   - ✅ **From News Artifact** - Select from existing artifacts and parse
   - ✅ **Manual Entry** - Enter details manually
   - ✅ **From Clip Parser** - Link to create new article

2. **Fixed Default Source**:
   - ✅ Changed from hardcoded `'GAO'` to empty string
   - ✅ User MUST select a source (required field)
   - ✅ Shows "(Required)" indicator

3. **Article Parsing**:
   - ✅ Parses articles using `external_env` parser
   - ✅ Maps parsed fields to external pressure fields:
     - `source` ← parsed `source`
     - `title` ← artifact `headline` or parsed `summary`
     - `summary` ← parsed `summary`
     - `impact` ← parsed `impact`
   - ✅ Pre-fills form with parsed data
   - ✅ User can edit before saving

---

## Where to Find Article Ingest

### Option 1: External Pressures Page (NEW!)
**Path:** `/mycompany/external-pressures/create`

**Steps:**
1. Click "Create External Company Pressure"
2. Choose "From News Artifact" or "From Clip Parser"
3. Select/parse article → Form pre-fills → Save

### Option 2: Global Artifacts Page
**Path:** `/mycompany/articles` (Global Artifacts)

**Steps:**
1. Browse all artifacts
2. Click "Parse & Route" on any artifact
3. Select model type → Parse → Create record

### Option 3: Clip Parser (Direct)
**Path:** `/signal/clip`

**Steps:**
1. Enter URL or paste text
2. Save → Redirects to parse page
3. Select model type → Parse → Create record

### Option 4: External Environment Page (Alternative)
**Path:** `/mycompany/external-env/create`

**Note:** This creates `CompanyExternalEnv` (different model than `ExternalCompanyPressure`)

---

## Technical Details

### Files Modified
- ✅ `app/mycompany/external-pressures/create/page.tsx`
  - Added method selection UI
  - Added artifact loading/parsing
  - Fixed default source to empty string
  - Added Suspense wrapper for searchParams

### API Endpoints Used
- ✅ `GET /api/utils/news-artifact/list` - List artifacts
- ✅ `POST /api/utils/news-artifact/parse` - Parse article (as `external_env`)
- ✅ `POST /api/external-pressures/create` - Create pressure record

### Data Flow
```
User selects "From News Artifact"
  ↓
Load artifacts from `/api/utils/news-artifact/list`
  ↓
User clicks artifact
  ↓
Parse as `external_env` via `/api/utils/news-artifact/parse`
  ↓
Map parsed fields to external pressure form
  ↓
User reviews/edits pre-filled form
  ↓
Save via `/api/external-pressures/create`
```

---

## Differences: External Pressures vs External Environment

### ExternalCompanyPressure (`/external-pressures`)
- **Model:** `ExternalCompanyPressure`
- **Scope:** User-specific (linked to `workMeId`)
- **Fields:** 
  - `source` (enum: GAO, CONGRESS, etc.)
  - `title`, `summary`, `impact`
  - `workforceConcern` (enum)
  - `levelOfSeverity` (0-5)
- **Purpose:** Track workforce concerns about external pressures

### CompanyExternalEnv (`/external-env`)
- **Model:** `CompanyExternalEnv`
- **Scope:** Company-wide (linked to `companyId`)
- **Fields:**
  - `source` (free text: "GAO", "Congress", etc.)
  - `category`, `summary`, `impact`
  - `deltaSummary`, `implementationTimeline`, `leadAuthority`
  - `confidenceLevel`, `timeHorizon`
- **Purpose:** Track external signals/developments affecting company

**Both now support article ingest!** ✅

---

## Why It Defaulted to "GAO"

**Old Code:**
```typescript
const [formData, setFormData] = useState({
  source: 'GAO',  // ← Hardcoded default
  // ...
})
```

**Fixed:**
```typescript
const [formData, setFormData] = useState({
  source: '',  // ← Empty - user must select
  // ...
})
```

**Reason:** The first item in `PRESSURE_SOURCES` array was `'GAO'`, so it was used as default. Now user must explicitly select.

---

## Testing Checklist

- [x] Method selection UI appears
- [x] "From News Artifact" loads artifacts
- [x] "From Clip Parser" links to `/signal/clip`
- [x] "Manual Entry" shows form
- [x] Parsing pre-fills form correctly
- [x] Source field requires selection (no default)
- [x] Form validation works
- [x] Can switch between methods
- [x] Can cancel and go back

---

## Summary

✅ **Article ingest now works on external pressures page!**
✅ **No more confusing "GAO" default**
✅ **Full reverse compatibility with article ingest system**
✅ **Three input methods available**

**Users can now ingest articles from:**
1. External Pressures create page (NEW!)
2. Global Artifacts page
3. Clip Parser
4. External Environment page

All paths support article ingestion! 🎉
