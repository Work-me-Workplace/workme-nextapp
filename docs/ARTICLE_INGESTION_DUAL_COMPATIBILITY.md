# Article Ingestion Dual Compatibility Analysis

## Current State

### Article Ingestion Flows

#### 1. **Unit Update Page Flow** (`/mycompany/platforms/[id]/units/[unitId]/update`)
- **Path:** Unit-specific ingestion
- **Process:**
  1. User pastes article text or URL
  2. Calls `/api/utils/news-artifact/ingest` (parses article)
  3. Creates `CompanyNewsArtifact` (global) via `/api/utils/news-artifact/create`
  4. Creates `CompanyPlatformUnitUpdate` (unit-specific)
- **Result:** Global artifact + Unit update created together

#### 2. **Clip Page Flow** (`/signal/clip`)
- **Path:** Generic article ingestion
- **Process:**
  1. User enters URL or pastes text
  2. Creates `CompanyNewsArtifact` (basic, no parsing) via `/api/utils/news-artifact/create`
  3. Routes to `/signal/clip/[artifactId]/parse` for parsing
- **Result:** Global artifact created first, parsing happens separately

#### 3. **Global Artifacts Page** (`/mycompany/articles`)
- **Path:** Browse and route artifacts
- **Process:**
  1. Lists all `CompanyNewsArtifact` records
  2. User clicks "Parse & Route" based on `artifactType`
  3. Routes to appropriate creation page (milestone, unit update, etc.)
- **Result:** Artifacts are global, routing happens after creation

## The Problem

### Issue 1: Missing "Add Company Highlight" Button
- **Location:** Unit detail page (`/mycompany/platforms/units/[id]`)
- **Current:** No button to ingest articles or link to global artifacts
- **Expected:** Button to ingest articles that creates global artifacts

### Issue 2: Dual Compatibility
- **Unit Update Page:** Creates artifact + update in one flow (good for unit-specific articles)
- **Global Artifacts:** Should also support ingesting articles that might be about anything
- **Need:** Both flows should create `CompanyNewsArtifact` first, then optionally route

### Issue 3: Ingest Endpoint Focus
- **Current:** `/api/utils/news-artifact/ingest` is focused on unit updates (extracts `CompanyPlatformUnitUpdate` fields)
- **Issue:** Should work generically for all artifact types, not just unit updates
- **Fix Needed:** Make ingest endpoint more generic, or ensure it handles all artifact types

## Current Behavior

### Global Artifacts Page (`/mycompany/articles`)
- ✅ Lists all `CompanyNewsArtifact` records
- ✅ Filters by `artifactType` and `sentiment`
- ✅ Routes artifacts to appropriate pages based on type
- ✅ "Add Article" button links to `/signal/clip`

### Unit Update Page (`/mycompany/platforms/[id]/units/[unitId]/update`)
- ✅ Ingests article and creates global artifact
- ✅ Creates unit update linked to artifact
- ✅ Works for unit-specific articles

### Missing Links
- ❌ No way to ingest articles from unit detail page
- ❌ No direct link to global artifacts from unit page

## Recommendations

### 1. Add "Ingest Article" Button to Unit Detail Page
- **Location:** Unit detail page, near "Add Update" button
- **Action:** Link to `/signal/clip?unitId={unitId}` or create inline ingestion
- **Result:** Creates global artifact, then routes to unit update page if unit-specific

### 2. Ensure Dual Compatibility
- **Unit Update Flow:** Keep current flow (artifact + update together)
- **Global Artifacts Flow:** Ensure articles can be ingested without unit context
- **Both:** Should create `CompanyNewsArtifact` first (global), then route appropriately

### 3. Make Ingest Endpoint More Generic
- **Current:** Focused on unit updates
- **Fix:** Ensure it can determine artifact type for all types (milestone, workforce, external pressure, etc.)
- **Result:** Works for both unit-specific and generic article ingestion

## Implementation Plan

1. ✅ Add "Ingest Article" button to unit detail page
2. ✅ Ensure global artifacts page works correctly
3. ✅ Verify dual compatibility between flows
4. ✅ Test article ingestion from both paths
