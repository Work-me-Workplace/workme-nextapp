# CompanyMilestone platformUnitId Clarification

## The Real Issue

**The problem was AUTO-CREATION/AUTO-ASSIGNMENT logic**, not the `platformUnitId` field itself.

## What We Fixed

### 1. Removed Auto-Creation Logic
- **Before:** Platform creation endpoint was automatically creating `CompanyMilestone` records from unit milestones
- **After:** Removed that auto-creation logic - milestones are only created manually

### 2. Kept platformUnitId Optional
- **Field remains:** `platformUnitId` is still optional in `CompanyMilestone` schema
- **Use case:** For HUGE company-wide events that happen to involve a specific unit
- **Examples:**
  - "Carrier flew its first mission" - company milestone, but involves a specific carrier
  - "First submarine completed circumnavigation" - company milestone, but involves a specific submarine
  - "Major contract award for entire platform class" - company milestone, but might reference a unit

### 3. Manual Creation Only
- **No auto-creation:** Unit updates do NOT automatically create company milestones
- **Manual only:** Company milestones are created manually through the UI
- **Clear separation:** Routine unit events (keel laying, delivery, commissioning) go to `CompanyPlatformUnitUpdate`

## The Schema

```prisma
model CompanyMilestone {
  // ...
  // Optional contextual linkage (for HUGE company-wide events that happen to involve a specific unit)
  // e.g., "Carrier flew its first mission" - this is a company milestone, but involves a specific unit
  // CRITICAL: Do NOT auto-create company milestones from unit updates - only manual creation
  platformUnitId String?
  platformUnit   CompanyPlatformUnit? @relation(fields: [platformUnitId], references: [id], onDelete: SetNull)
}
```

## The Collision That Was Fixed

**Before:**
- Platform creation → Auto-creates `CompanyMilestone` with `platformUnitId` set
- Unit updates → Could trigger auto-creation of milestones
- Result: Company milestones list polluted with routine unit events

**After:**
- Platform creation → Does NOT create milestones
- Unit updates → Do NOT create milestones
- Company milestones → Manual creation only
- `platformUnitId` → Optional, only for HUGE company-wide events

## Summary

✅ **platformUnitId stays optional** - for huge company-wide events involving a unit  
✅ **No auto-creation** - removed all automatic milestone creation logic  
✅ **Manual creation only** - company milestones created through UI  
✅ **Clear separation** - routine unit events → `CompanyPlatformUnitUpdate`, huge events → `CompanyMilestone`
