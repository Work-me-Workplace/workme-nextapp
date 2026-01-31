# Platform Unit Update Model - What It Actually Is

## The Model

```prisma
model CompanyPlatformUnitUpdate {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  platformUnitId String  // REQUIRED - which unit this update is for
  platformUnit   CompanyPlatformUnit @relation(...)

  statementId String?  // OPTIONAL - bolt on! Just provenance
  statement   CompanyPlatformUnitStatement? @relation(...)

  // Extracted signals (ALL OPTIONAL)
  percentComplete    Int?
  statusUpdate       String? // "Keel Laid", "Construction 60% complete"
  scheduleNote       String?
  industrialBaseNote String?
  leadershipQuote    String?

  // Dates (ALL OPTIONAL)
  keelLaidDate       DateTime?
  seaTrialsStartDate DateTime?
  deliveryDate       DateTime?
  commissioningDate  DateTime?

  // AI narrative summary (OPTIONAL)
  narrativeSummary String?
  tags             String[] @default([])
}
```

## What's Required vs Optional

### REQUIRED (Only One!)
- ✅ `platformUnitId` - Which unit this update is for

### OPTIONAL (Everything Else!)
- ❌ `statementId` - **BOLT ON** - Just provenance, not required
- ❌ ALL update fields are optional:
  - `statusUpdate`
  - `percentComplete`
  - `scheduleNote`
  - `industrialBaseNote`
  - `leadershipQuote`
  - All dates
  - `narrativeSummary`
  - `tags`

## The Problem

**We've been treating statement as if it's required, but it's NOT!**

The update model is:
- **Unit-centric** - Must belong to a unit
- **Statement-agnostic** - Can exist without a statement
- **Field-flexible** - Any combination of fields is valid

## What This Means

### Updates Can Exist Independently
- ✅ Create update directly (no statement needed)
- ✅ Update can have just `statusUpdate` and `deliveryDate`
- ✅ Update can have just `scheduleNote`
- ✅ Update can have any combination of fields

### Statement is Just Provenance
- Statement is a "bolt on" - optional link back to source article
- If you have a statement, you can link it (`statementId`)
- If you don't have a statement, that's fine too

## The Correct Flow

### Flow 1: Update from Article (with Statement)
```
Article → Parse → Create Statement (optional) → Create Update (link statementId)
```

### Flow 2: Update Directly (no Statement)
```
Manual Entry → Create Update (no statementId)
```

### Flow 3: Update from Existing Statement
```
Existing Statement → Parse → Create Update (link statementId)
```

## What We Should Do

1. **Don't require statement** - Updates can exist without statements
2. **Statement is optional provenance** - Nice to have, not required
3. **Focus on update fields** - What matters is the update data, not the source
4. **Allow direct update creation** - Don't force article ingestion

## Summary

**The update model is:**
- Unit-centric (requires `platformUnitId`)
- Statement-agnostic (`statementId` is optional bolt-on)
- Field-flexible (all fields optional)

**Statement is NOT a determinant of the update** - it's just optional provenance linking back to the source article.
