# Artifact Navigation Analysis

## Current State

### Where Artifacts Are Visible

1. **Unit Detail Page** (`/mycompany/platforms/[id]/units/[unitId]`)
   - Shows statements section (if exists)
   - Lists statements for that specific unit
   - Can click to view statement details

2. **Unit Update Page** (`/mycompany/platforms/[id]/units/[unitId]/update`)
   - Has "Artifact Bank" tab
   - Shows statements for that specific unit
   - Can select statement to create update

### What's Missing

❌ **No Global Artifacts View**
- Can't see all artifacts across all units
- Can't browse artifacts company-wide
- No navigation link to "All Artifacts"

❌ **No Artifact-First Navigation**
- Artifacts are buried in unit pages
- No dedicated "Article Bank" or "Artifacts" section
- Can't easily discover what artifacts exist

## The Flow We're Building

**Yes - Artifact First, Then Derive Updates:**

```
1. Ingest Article → Create Artifact (CompanyPlatformUnitStatement)
   ↓
2. Artifact Bank → Browse Artifacts
   ↓
3. Select Artifact → Parse → Create Update (derived from artifact)
```

**Key Points:**
- ✅ Artifact is created first (stores raw article)
- ✅ Update is derived from artifact (optional link via `statementId`)
- ✅ Can pull artifact at any time to create update
- ❌ But no global view to browse all artifacts

## Proposed Solution

### Add to Navigation

**Under "MYCOMPANY" section:**
```
- Workforce Stuff
- Company Milestones
- Employee Highlights
- Company Products
- Article Bank  ← NEW (shows all artifacts)
- External Company Pressures
```

### New Page: `/mycompany/articles` or `/mycompany/artifacts`

**Features:**
- List all `CompanyPlatformUnitStatement` records
- Filter by:
  - Platform/Unit
  - Date range
  - Source
- Actions:
  - View artifact
  - Create update from artifact
  - Delete artifact

### Flow from Global View

```
Article Bank (Global) → See All Artifacts
  ↓
Select Artifact → View Details
  ↓
"Create Update" → Goes to unit update page with artifact pre-selected
  ↓
Parse → Create Update (derived from artifact)
```

## Summary

**Current State:**
- ✅ Artifacts exist (as `CompanyPlatformUnitStatement`)
- ✅ Can see artifacts per-unit
- ❌ No global artifacts view
- ❌ No navigation link to artifacts

**What We Need:**
- ✅ Add "Article Bank" to navigation
- ✅ Create global artifacts listing page
- ✅ Allow browsing all artifacts, filtering by unit/platform
- ✅ "Create Update" action from global view

**The Flow:**
- Artifact First ✅ (we create statements)
- Derive Updates ✅ (updates link to statements)
- Pull Artifact Anytime ✅ (can select from bank)
- Browse All Artifacts ❌ (missing - need global view)
