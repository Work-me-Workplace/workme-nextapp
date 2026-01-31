# Global Artifact Bank Refactor

## The Problem

**Current State:**
- Artifacts are unit-specific (`CompanyPlatformUnitStatement`)
- Can't see artifacts until you know which unit they belong to
- But you don't know which unit until you parse!

**The Fix:**
- Use `CompanyNewsArtifact` as GLOBAL artifact bank
- Artifacts belong to company, not specific unit
- Parse artifact → Determine which unit → Create unit statement + update

## The Correct Flow

### Flow 1: New Article → Global Artifact → Parse → Unit Update
```
1. Ingest Article → Create CompanyNewsArtifact (GLOBAL, company-level)
   ↓
2. Global Artifact Bank → Browse All Artifacts
   ↓
3. Select Artifact → Parse → Determine Unit
   ↓
4. Create CompanyPlatformUnitStatement (linked to artifact)
   ↓
5. Create CompanyPlatformUnitUpdate (linked to statement)
```

### Flow 2: Browse Global Artifacts → Create Update
```
1. Global Artifact Bank → See All Artifacts
   ↓
2. Select Artifact → Parse → Determine Unit
   ↓
3. Create Unit Statement + Update
```

## Model Structure

### CompanyNewsArtifact (GLOBAL)
- Belongs to: `companyId` (not unit-specific)
- Stores: Raw article text, metadata, parsed intelligence
- Can be linked to: Multiple units/platforms/milestones

### CompanyPlatformUnitStatement (Unit-Specific)
- Belongs to: `platformUnitId` (specific unit)
- Links to: `CompanyNewsArtifact` (via `newsArtifactId`)
- Purpose: Unit-specific statement derived from global artifact

### CompanyPlatformUnitUpdate (Unit-Specific)
- Belongs to: `platformUnitId` (specific unit)
- Links to: `CompanyPlatformUnitStatement` (via `statementId`)
- Purpose: Parsed structured update data

## What We Need to Build

### 1. Global Artifact Bank Page
**Route:** `/mycompany/articles` or `/mycompany/artifacts`

**Features:**
- List all `CompanyNewsArtifact` records for company
- Filter by: date, source, artifactType, sentiment
- Actions:
  - View artifact
  - Parse artifact → Determine unit → Create update
  - Delete artifact

### 2. Navigation Link
Add to sidebar under "MYCOMPANY":
```
- Company Products
- Article Bank  ← NEW (global artifacts)
- External Company Pressures
```

### 3. Update Flow
- Start from global artifact bank
- Parse artifact → Extract unit/platform info
- Create unit statement (linked to artifact)
- Create unit update (linked to statement)

## The Refactor

### Current (Broken):
```
Unit Update Page → Artifact Bank (per-unit) → Create Update
```
**Problem:** Don't know unit until you parse!

### New (Fixed):
```
Global Artifact Bank → Select Artifact → Parse → Determine Unit → Create Update
```
**Solution:** Artifacts are global, parse to determine unit

## Summary

**The Fix:**
- ✅ Use `CompanyNewsArtifact` as global artifact bank
- ✅ Artifacts belong to company, not unit
- ✅ Parse artifact to determine which unit it's about
- ✅ Then create unit statement + update

**What We Need:**
- ✅ Global artifact bank page (`/mycompany/articles`)
- ✅ Navigation link to artifact bank
- ✅ Parse artifact → determine unit → create update flow
