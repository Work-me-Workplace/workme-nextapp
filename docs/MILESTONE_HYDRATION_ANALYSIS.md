# Milestone Hydration Analysis

## The Schema Relationships

Looking at the Prisma schema, here's how the models relate:

### CompanyMilestone Model
```prisma
model CompanyMilestone {
  // Optional contextual linkage (not ownership)
  platformUnitId String?
  platformUnit   CompanyPlatformUnit? @relation(fields: [platformUnitId], references: [id], onDelete: SetNull)

  // Optional provenance linkage (which update triggered this milestone)
  updateId String?                    @unique
  update   CompanyPlatformUnitUpdate? @relation(fields: [updateId], references: [id], onDelete: SetNull)
}
```

### CompanyPlatformUnit Model
```prisma
model CompanyPlatformUnit {
  updates     CompanyPlatformUnitUpdate[]
  milestones  CompanyMilestone[]  // ← Reverse relation
}
```

### CompanyPlatformUnitUpdate Model
```prisma
model CompanyPlatformUnitUpdate {
  // Reverse relation to milestone (if this update triggered one)
  milestones CompanyMilestone[]  // ← Reverse relation
}
```

## The Hydration Mechanism

**There is NO foreign key constraint forcing this.** The relationships are:
- `platformUnitId` is **optional** (`String?`)
- `updateId` is **optional** (`String?`)
- Both have `onDelete: SetNull` - they're just contextual links

**The "hydration" was happening in APPLICATION CODE:**

### 1. Platform Creation Code (NOW REMOVED)
**File:** `app/api/company/products/platform/create-with-units/route.ts`

**What it was doing:**
```typescript
// OLD CODE (now commented out):
await Promise.all(
  milestones.map(async (milestone: any) => {
    return prisma.companyMilestone.create({
      data: {
        title: milestoneTitle,
        companyId,
        category: 'Platform',
        platformUnitId: platformUnitId,  // ← THIS was setting it
        milestoneType: milestone.milestoneType,
        // ...
      },
    })
  })
)
```

**This was explicitly creating `CompanyMilestone` records with `platformUnitId` set**, which made them show up in the company milestones list.

### 2. Other Creation Points
**File:** `app/api/company/products/milestones/create/route.ts`
- This creates milestones from the unit milestone page
- Need to check if it's setting `platformUnitId`

**File:** `app/api/company/milestones/upsert/route.ts`
- This is the general milestone creation endpoint
- Already fixed to set `platformUnitId: null`

## The Root Cause

**It wasn't a foreign key accident** - it was **intentional application logic** that was creating milestones with `platformUnitId` populated.

The schema allows it (optional foreign key), but the **application code was choosing to populate it**.

## The Fix

1. **Removed the milestone creation code** from platform creation
2. **Filter the list** to exclude milestones with `platformUnitId` set
3. **Block setting `platformUnitId`** in milestone creation endpoints

But the user is right - we should just **not create them** rather than blocking/filtering. The schema relationship is fine, we just need to ensure the application code doesn't create milestones with `platformUnitId` set.

## Summary

- **Schema:** Optional foreign keys (`platformUnitId`, `updateId`) - these are fine, just contextual links
- **Problem:** Application code was creating milestones with `platformUnitId` populated
- **Solution:** Don't create milestones with `platformUnitId` in the first place (already done)
- **Current State:** We're filtering them out, but we could also just ensure they're never created
