# Platform Unit Update Model - The Truth

## What the Model Actually Is

```prisma
model CompanyPlatformUnitUpdate {
  platformUnitId String  // REQUIRED - only thing required!
  
  statementId String?  // OPTIONAL - bolt on! Just provenance
  
  // ALL fields optional:
  statusUpdate       String?
  percentComplete    Int?
  scheduleNote       String?
  industrialBaseNote String?
  leadershipQuote    String?
  keelLaidDate       DateTime?
  seaTrialsStartDate DateTime?
  deliveryDate       DateTime?
  commissioningDate  DateTime?
  narrativeSummary   String?
  tags               String[] @default([])
}
```

## The Key Insight

**Statement is NOT a determinant of the update.**

- ✅ Update can exist WITHOUT a statement
- ✅ Statement is just optional provenance (bolt on)
- ✅ Update is unit-centric, not statement-centric

## What This Means

### Updates Can Be Created Directly
```
Create Update → Just fill in fields → Done
```
- No statement needed
- No article needed
- Just the update data

### Statement is Optional Provenance
```
Article → Statement (optional) → Update (link statementId if you want)
```
- Statement stores raw text (nice to have)
- Update stores structured data (what matters)
- Link them if you want provenance, but not required

## The Correct Mental Model

**Update = Unit Status/Progress Tracking**
- Belongs to a unit (required)
- Has fields for status, dates, notes (all optional)
- Can exist independently

**Statement = Optional Source Article**
- Stores raw article text
- Optional link back to update
- Just for provenance/traceability

## What We Fixed

1. **Removed requirement for rawText** - Update can exist without statement
2. **Made statementId truly optional** - Update doesn't need it
3. **Focus on update fields** - What matters is the update data, not the source

## Summary

**The update model is:**
- Unit-centric (requires `platformUnitId`)
- Statement-agnostic (`statementId` is optional bolt-on)
- Field-flexible (all fields optional)

**Statement is NOT a determinant** - it's just optional provenance linking back to source article.
