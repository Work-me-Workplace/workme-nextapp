# CompanyMilestone Schema Issue - The Smoking Gun

## The Problem

**`CompanyMilestone` has `platformUnitId` field** - This is the "smoking gun" that allows unit milestones to pollute company milestones.

### Schema Location
```prisma
model CompanyMilestone {
  // ...
  // Optional contextual linkage (not ownership)
  platformUnitId String?  // ← THE SMOKING GUN
  platformUnit   CompanyPlatformUnit? @relation(fields: [platformUnitId], references: [id], onDelete: SetNull)
  
  // Optional provenance linkage (which update triggered this milestone)
  updateId String?                    @unique
  update   CompanyPlatformUnitUpdate? @relation(fields: [updateId], references: [id], onDelete: SetNull)
}
```

### The Issue

1. **Schema allows it:** `platformUnitId` is optional (`String?`), so code can create `CompanyMilestone` with `platformUnitId` set
2. **Comment says deprecated:** Line 2200 says "platformUnitId is DEPRECATED - big picture milestones are company-wide, not platform-specific"
3. **But it's still there:** The field exists in the schema, allowing the confusion

### What Should Happen

**Platform unit milestones should be tracked via `CompanyPlatformUnitUpdate`:**
- `CompanyPlatformUnitUpdate` has all the milestone fields:
  - `keelLaidDate`
  - `deliveryDate`
  - `commissioningDate`
  - `seaTrialsStartDate`
  - `statusUpdate` (e.g., "Keel Laid", "Commissioning")
  - `narrativeSummary`
  - `tags`

**`CompanyMilestone` should ONLY be for company-wide milestones:**
- Company reorganizations
- Major company-wide contracts
- Company mergers/acquisitions
- Company-wide achievements

### The Reverse Relations

```prisma
model CompanyPlatformUnit {
  updates     CompanyPlatformUnitUpdate[]
  milestones  CompanyMilestone[]  // ← This allows the confusion
}

model CompanyPlatformUnitUpdate {
  milestones CompanyMilestone[]  // ← Via updateId, not platformUnitId
}
```

## Solution Options

### Option 1: Remove `platformUnitId` from Schema (Clean)
- Create migration to remove `platformUnitId` field
- Remove the relation
- Remove `CompanyPlatformUnit.milestones` reverse relation
- Keep `updateId` for provenance (if an update triggers a company milestone)

### Option 2: Keep Field but Never Set It (Defensive)
- Keep `platformUnitId` in schema for backward compatibility
- Ensure all code paths set `platformUnitId: null`
- Filter queries to exclude `platformUnitId IS NOT NULL`

### Option 3: Rename/Clarify
- Keep `platformUnitId` but rename to `deprecatedPlatformUnitId` or `legacyPlatformUnitId`
- Add schema-level validation/constraint if possible

## Recommendation

**Remove `platformUnitId` from `CompanyMilestone` schema entirely.**

Reasoning:
- Platform unit milestones belong in `CompanyPlatformUnitUpdate`
- `CompanyMilestone` should be pure company-wide milestones
- The `updateId` field provides provenance linkage if needed
- Cleaner separation of concerns
