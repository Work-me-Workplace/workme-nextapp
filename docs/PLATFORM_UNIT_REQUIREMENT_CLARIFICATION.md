# Platform Unit Requirement Clarification

## The Question

**Do we need to "bite the bullet" and create platform/unit first, OR can we create updates without them and "fill in later"?**

## The Answer

**You MUST create platform and unit first.** There's no "fill in later" option for updates.

However, you CAN store the raw news article first, then create platform/unit/update later.

---

## Current Requirements

### CompanyPlatformUnitUpdate Schema

```prisma
model CompanyPlatformUnitUpdate {
  platformUnitId String  // REQUIRED - NOT optional
  platformUnit   CompanyPlatformUnit @relation(...)
  // ...
}
```

**Key Point:** `platformUnitId` is **REQUIRED** - there's no `?` making it optional.

### Update Creation Endpoint

```typescript
// app/api/company/products/platform/unit/update/create/route.ts

if (!platformUnitId || !rawText) {
  return NextResponse.json(
    { success: false, error: 'Platform Unit ID and raw text are required' },
    { status: 400 }
  )
}

const unit = await prisma.companyPlatformUnit.findUnique({
  where: { id: platformUnitId },
})

if (!unit) {
  return NextResponse.json(
    { success: false, error: 'Platform unit not found' },
    { status: 404 }
  )
}
```

**Key Point:** The endpoint validates that the unit exists before creating the update.

---

## What "One-Off Update" Actually Means

**"One-off update" means:**
- ✅ Platform and unit **already exist**
- ✅ You're just adding an update to an existing unit
- ✅ You don't need to create the platform/unit first (they're already there)

**"One-off update" does NOT mean:**
- ❌ Create update without platform/unit
- ❌ Fill in platform/unit later
- ❌ Store update in limbo until platform/unit exists

---

## Two Valid Flows

### Flow 1: Store News First, Then Create Platform/Unit/Update

**Step 1: Store Raw News**
```
POST /api/utils/news-artifact/create
→ Creates CompanyNewsArtifact (stores rawText)
→ No platform/unit required
```

**Step 2: Create Platform/Unit (if needed)**
```
POST /api/company/products/platform/create-with-units
→ Creates CompanyPlatformProduct
→ Creates CompanyPlatformUnit(s)
```

**Step 3: Create Update**
```
POST /api/company/products/platform/unit/update/create
→ Requires platformUnitId (must exist)
→ Creates CompanyPlatformUnitStatement
→ Creates CompanyPlatformUnitUpdate
```

**Use Case:** You have a news article, store it first, then later decide to create platform/unit/update.

---

### Flow 2: Create Platform/Unit First, Then Updates

**Step 1: Create Platform/Unit**
```
POST /api/company/products/platform/create-with-units
→ Creates CompanyPlatformProduct
→ Creates CompanyPlatformUnit(s)
```

**Step 2: Create Updates as News Comes In**
```
POST /api/company/products/platform/unit/update/create
→ Requires platformUnitId (already exists)
→ Creates CompanyPlatformUnitStatement
→ Creates CompanyPlatformUnitUpdate
```

**Use Case:** Platform/unit already exists, you're tracking ongoing updates.

---

## The "Bite the Bullet" Decision

**If you want to create platform unit updates, you MUST:**

1. ✅ **Create platform first** (if it doesn't exist)
2. ✅ **Create unit first** (if it doesn't exist)
3. ✅ **Then create update** (requires platformUnitId)

**OR**

1. ✅ **Store news as CompanyNewsArtifact first** (no platform/unit required)
2. ✅ **Later create platform/unit** (when ready)
3. ✅ **Then create update** (requires platformUnitId)

---

## Why This Design?

**Database Constraints:**
- `CompanyPlatformUnitUpdate.platformUnitId` is a foreign key
- Foreign keys require the referenced record to exist
- Can't create update without unit

**Data Integrity:**
- Updates belong to specific units
- Can't have "orphan" updates without units
- Ensures data consistency

---

## Recommendation

**For Product Development:**

**Option A: Store News First (Recommended)**
```
1. Ingest news → CompanyNewsArtifact (source of truth)
2. Later: Create platform/unit when ready
3. Then: Create update from stored news artifact
```

**Option B: Create Platform/Unit First**
```
1. Create platform/unit upfront
2. Then: Create updates as news comes in
```

**Choose based on:**
- Do you know the platform/unit exists? → Use Option B
- Are you discovering platforms/units from news? → Use Option A

---

## Summary

**Answer:** You MUST create platform and unit first (or store news first, then create platform/unit later).

**"One-off update" means:** Update to an existing unit, not "create update without unit."

**Current Limitation:** No way to create updates without platform/unit existing first.

**Workaround:** Store news as `CompanyNewsArtifact` first, then create platform/unit/update later.
