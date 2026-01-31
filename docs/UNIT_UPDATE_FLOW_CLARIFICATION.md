# Unit Update Flow Clarification

## Current Flow (What We're Actually Doing)

**We're NOT creating artifacts first.** We're creating the update directly:

1. **User pastes article** → Parse with AI
2. **Extract fields** → Map to `CompanyPlatformUnitUpdate` model
3. **User reviews/edits** → Fields are editable
4. **User clicks "Create Unit Update"** → Creates:
   - `CompanyPlatformUnitStatement` (stores raw text - source of truth)
   - `CompanyPlatformUnitUpdate` (stores parsed structured data)

## What Gets Created

### CompanyPlatformUnitStatement
- **Purpose:** Source of truth (stores raw article text)
- **Linked to:** Unit (`platformUnitId`)
- **Fields:** `rawText`, `sourceUrl`, `sourceName`, `headline`
- **Why:** Preserves original article text, never loses context

### CompanyPlatformUnitUpdate
- **Purpose:** Parsed structured data (what we extracted)
- **Linked to:** Unit (`platformUnitId`) + Statement (`statementId`)
- **Fields:** `statusUpdate`, `scheduleNote`, `dates`, `narrativeSummary`, etc.
- **Why:** Structured data for querying, filtering, displaying

## What We're NOT Creating

- ❌ **CompanyNewsArtifact** - Not created (that's for general news, not unit-specific)
- ❌ **Artifact first, then update** - Not the flow (we create Statement + Update together)

## The Flow

```
Article Text
    ↓
Parse with AI
    ↓
Extract CompanyPlatformUnitUpdate fields
    ↓
User reviews/edits
    ↓
Create Statement (raw text) + Update (parsed data)
    ↓
Done - Update is created, Statement is source of truth
```

## Why Statement + Update?

**Statement (raw text):**
- Source of truth - never loses original context
- Can re-parse later if needed
- Linked to unit

**Update (parsed data):**
- Structured fields for querying
- Can filter by status, dates, etc.
- Linked to statement (provenance)

## UX Clarity

**Before:** Function called `handleSaveArtifact` (confusing - no artifact created)

**Now:** Function called `handleCreateUpdate` (clear - creates update)

**Button:** "Create Unit Update" (clear what happens)

## Summary

**We're NOT doing "artifact first"** - we're creating Statement + Update together in one step.

**Statement = Source of truth** (like an artifact, but unit-specific)
**Update = Parsed structured data** (what we actually use)

No separate artifact step - just Statement + Update, done.
