# Artifact First - Global Flow

## The Correct Flow

**Artifacts are GLOBAL and can be about ANYTHING:**
- Company news
- Platform/product updates  
- Unit updates
- Leader statements
- External pressures
- Processes/policies
- Workforce stuff
- Milestones

**You don't know what it's about until you parse it!**

## The Flow

### Step 1: Create Artifact (Global)
```
Ingest Article → Parse → Create CompanyNewsArtifact (GLOBAL, company-level)
```
- Store raw text
- Parse with AI to determine `artifactType`
- Store parsed intelligence
- **No unit/platform required** - it's global!

### Step 2: Browse Global Artifact Bank
```
Article Bank → See All Artifacts → Filter by Type/Sentiment
```
- All artifacts in one place
- Filter by `artifactType`, `sentiment`, date, source
- See what each artifact is about

### Step 3: Parse & Route Based on Type
```
Select Artifact → Parse → Determine Type → Route to Appropriate Model
```

**Routing:**
- `unit_update` → Create `CompanyPlatformUnitStatement` + `CompanyPlatformUnitUpdate`
- `milestone` → Create `CompanyMilestone`
- `external_pressure` → Create `CompanyExternalEnv`
- `workforce` → Create workforce record
- `platform` → Create `CompanyPlatformStatement` + `CompanyPlatformUpdate`
- `leadership` → Create leader statement/engagement

## What We Built

### 1. Global Artifact Bank Page
**Route:** `/mycompany/articles`

**Features:**
- Lists ALL `CompanyNewsArtifact` records (company-wide)
- Filter by `artifactType`, `sentiment`
- Shows parsed intelligence
- "Parse & Route" button → Routes to appropriate creation page

### 2. Navigation Link
Added "Article Bank" to sidebar under "MYCOMPANY"

### 3. API Endpoint
**GET `/api/utils/news-artifact/list`**
- Lists all artifacts for company
- Filter by type, sentiment
- Pagination support

### 4. Updated Ingest Flow
- Ingest → Parse → Save as `CompanyNewsArtifact` (global)
- Then route based on `artifactType`

## The Model Structure

```
CompanyNewsArtifact (GLOBAL - company-level)
  ↓ (can link to multiple things)
CompanyPlatformUnitStatement (unit-specific, links to artifact)
  ↓
CompanyPlatformUnitUpdate (unit-specific, links to statement)
```

**OR**

```
CompanyNewsArtifact (GLOBAL)
  ↓
CompanyMilestone (links to artifact)
```

**OR**

```
CompanyNewsArtifact (GLOBAL)
  ↓
CompanyExternalEnv (links to artifact)
```

## Summary

**Artifacts are GLOBAL:**
- ✅ Belong to company, not specific unit
- ✅ Can be about anything (company, product, unit, leader, process, etc.)
- ✅ Parse to determine what they're about
- ✅ Route to appropriate model based on type

**The Flow:**
1. Create artifact (global) ✅
2. Browse artifact bank (global) ✅
3. Parse & route based on type ✅

**Navigation:**
- "Article Bank" in sidebar ✅
- `/mycompany/articles` page ✅
