# Artifact First Flow - Clarification

## The Flow We're Building

**Yes - Artifact First, Then Derive Updates**

```
1. Ingest Article → Create Artifact (Statement)
   ↓
2. Artifact Bank → Browse All Artifacts
   ↓
3. Select Artifact → Parse → Create Update (derived from artifact)
```

## Current State

### What We Have
- ✅ Artifact Bank on unit update page (per-unit artifacts)
- ✅ Can create update from existing artifact
- ✅ Can create artifact from new article

### What's Missing
- ❌ **No global "All Artifacts" page in navigation**
- ❌ **No way to browse all artifacts across all units**
- ❌ **Artifacts only visible per-unit**

## The Model Relationship

```
CompanyPlatformUnitStatement (Artifact)
  ↓ (optional link)
CompanyPlatformUnitUpdate (derived from artifact)
```

**Flow:**
1. **Artifact First** - Store article as `CompanyPlatformUnitStatement`
2. **Derive Update** - Create `CompanyPlatformUnitUpdate` from artifact
3. **Link Them** - Update links back via `statementId` (optional)

## Where Can You See Artifacts?

### Currently:
- ✅ **Unit Detail Page** - Shows statements for that unit
- ✅ **Unit Update Page** - Artifact Bank (shows statements for that unit)
- ❌ **No Global View** - Can't see all artifacts across all units

### What We Need:
- ✅ **Global Artifacts Page** - `/mycompany/artifacts` or `/mycompany/statements`
- ✅ **Navigation Link** - Add to sidebar
- ✅ **Browse All** - See all artifacts, filter by unit/platform
- ✅ **Create Update From Any** - Select artifact → Create update

## Proposed Navigation Addition

Add to sidebar under "MYCOMPANY":
```
- Company Products
- External Company Pressures
- Article Bank / Artifacts  ← NEW
```

## The Correct Flow

### Flow 1: New Article → Artifact → Update
```
1. Add Article → Create Statement (artifact)
2. Browse Artifact Bank → Select Statement
3. Parse Statement → Create Update (derived)
```

### Flow 2: Browse Existing → Update
```
1. Browse Artifact Bank → See all artifacts
2. Select Artifact → Parse
3. Create Update (derived from artifact)
```

## Summary

**Yes - Artifact First:**
- ✅ Articles become artifacts (statements) first
- ✅ Updates are derived from artifacts
- ✅ Can pull artifact at any time to create update

**Missing:**
- ❌ Global artifacts view in navigation
- ❌ Browse all artifacts (not just per-unit)

**Next Steps:**
- Add "Article Bank" or "Artifacts" to navigation
- Create global artifacts listing page
- Allow browsing all artifacts, filtering by unit/platform
