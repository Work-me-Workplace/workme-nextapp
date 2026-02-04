# Company Milestone vs Unit Update Separation

## The Problem

**Before:** Unit updates were feeding into company milestones, causing confusion.

**Now:** Clear separation - company milestones are ONLY for big picture company-wide stuff.

## The Separation

### CompanyMilestone (Company-Wide Only)
**What it's for:**
- ✅ Company reorganization or restructuring
- ✅ Major company-wide contract awards (affecting entire company)
- ✅ Company-wide strategic initiatives
- ✅ Company mergers or acquisitions
- ✅ Company-wide achievements (e.g., "Company reaches 10,000 employees")
- ✅ Company-wide policy changes

**What it's NOT for:**
- ❌ Platform unit events (ship commissioning, keel laying, delivery)
- ❌ Unit-specific milestones
- ❌ Platform-specific updates

**Filter:** `platformUnitId` must be `null` (company-wide only)

### CompanyPlatformUnitUpdate (Unit-Specific)
**What it's for:**
- ✅ Builder's trials
- ✅ Sea trials
- ✅ Keel laying
- ✅ Ship delivery
- ✅ Commissioning
- ✅ Unit status updates
- ✅ Unit progress tracking

**Repository:** `/mycompany/platforms/updates` - View all platform unit updates

## What We Fixed

### 1. Removed Unit Update → Milestone Logic
- **Before:** Platform creation created `CompanyMilestone` from unit milestones
- **After:** Platform creation does NOT create milestones (commented out)

### 2. Filtered Company Milestones List
- **Before:** Showed all milestones including unit-specific ones
- **After:** Only shows milestones where `platformUnitId IS NULL`

### 3. Blocked platformUnitId in Milestone Creation
- **Before:** Could create milestones with `platformUnitId`
- **After:** Always sets `platformUnitId = null` (company-wide only)

### 4. Created Platform Unit Updates Repository
- **New Page:** `/mycompany/platforms/updates`
- **Shows:** All `CompanyPlatformUnitUpdate` records
- **Filter:** By status (Builder's Trials, Sea Trials, etc.)
- **Navigation:** Added to sidebar under "MYCOMPANY"

## The Flow Now

### Company Milestones
```
Company Milestones Page → Only shows company-wide milestones
  ↓
Add Milestone → Only for big picture company stuff
  ↓
No platformUnitId allowed
```

### Platform Unit Updates
```
Platform Unit Updates Page → Shows all unit updates
  ↓
Create Update → From unit page or artifact bank
  ↓
Tracked as CompanyPlatformUnitUpdate (not milestone)
```

## Summary

**Company Milestones:**
- ✅ Only big picture company-wide stuff
- ✅ `platformUnitId` always `null`
- ✅ Filtered to exclude unit milestones

**Platform Unit Updates:**
- ✅ All unit-specific events
- ✅ Separate repository at `/mycompany/platforms/updates`
- ✅ Not mixed with company milestones

**The Logic is Broken:**
- ✅ Unit updates NO LONGER feed into company milestones
- ✅ Company milestones are ONLY set by company milestones
- ✅ Clear separation maintained
