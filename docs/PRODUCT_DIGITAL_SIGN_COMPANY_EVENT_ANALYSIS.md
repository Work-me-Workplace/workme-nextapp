# ProductDigitalSignCompanyEvent Architecture Analysis

## The Problem: Why So Many Variant Models?

### Current Architecture

**Single-Table Inheritance Pattern:**
```
ProductDigitalSign (base)
├── signType: DigitalSignType enum
│   ├── WORKFORCE
│   ├── COMPANY_NEWS  
│   ├── WORKFORCE_ACHIEVEMENT
│   └── COMPANY_EVENT
│
└── Variant Models (1:1 with ProductDigitalSign):
    ├── ProductDigitalSignWorkforce
    ├── ProductDigitalSignCompanyNews
    ├── ProductDigitalSignWorkforceAchievement
    └── ProductDigitalSignCompanyEvent ⚠️
```

**Key Pattern:**
- Each `ProductDigitalSign` has exactly ONE variant (determined by `signType`)
- Variant relationship is `digitalSignId @unique` (1:1)
- This is a **discriminated union** pattern

## The Issue: ProductDigitalSignCompanyEvent

### Current State

```prisma
model ProductDigitalSignCompanyEvent {
  id            String @id @default(cuid())
  digitalSignId String @unique  // 1:1 with ProductDigitalSign
  
  // NEW: Reference to CompanyEvent (preferred)
  companyEventId String?
  companyEvent   CompanyEvent? @relation(...)
  
  // LEGACY: Duplicated event data
  eventName        String?
  eventDate        DateTime?
  startTime        String?
  endTime          String?
  location         String?
  description      String?
  eventItems       String[]  @default([])
  perks            String[]  @default([]) // Deprecated
  registrationLink String?
  
  signage ProductDigitalSign @relation(...)
  
  @@index([companyEventId])
}
```

### Problems Identified

1. **Data Duplication** ❌
   - Duplicates all event fields instead of referencing `CompanyEvent`
   - Creates sync issues (event updates don't propagate to signage)
   - Wastes storage space

2. **No Unique Constraint** ❌
   - Multiple `ProductDigitalSign` can reference the same `CompanyEvent`
   - No constraint preventing duplicate signage for same event
   - Comment in code: "ProductDigitalSignCompanyEvent doesn't have FK, can't check"

3. **Inconsistent with Other Models** ❌
   - Other models use `companyEventId` FK (e.g., `OneOffEmailItem`, `CompanyWork`, `MyContribution`)
   - This model duplicates data instead of referencing

4. **Still Uses `perks`** ❌
   - Should use `eventItems` to match `CompanyEvent`
   - Migration incomplete

## Should There Be a Unique Constraint?

### Use Case Analysis

**Question: Can one CompanyEvent have multiple digital signs?**

**Possible Scenarios:**
1. ✅ **Different versions** - Draft vs final, different designs
2. ✅ **Different audiences** - Different company units see different signs
3. ✅ **Different time periods** - Pre-event vs day-of vs post-event
4. ✅ **Different purposes** - Registration sign vs event details sign

**Answer: YES, multiple signs per event makes sense!**

### But... Should We Prevent Duplicates?

**Current State:**
- No constraint = Can create unlimited signs for same event
- Could accidentally create duplicates
- No way to query "all signs for this event" efficiently

**Options:**

#### Option 1: No Unique Constraint (Current)
- ✅ Flexible - allows multiple signs per event
- ❌ No protection against accidental duplicates
- ❌ Hard to query "signs for event X"

#### Option 2: Unique Constraint on `companyEventId`
```prisma
@@unique([companyEventId])
```
- ✅ Prevents duplicate signs per event
- ❌ Too restrictive - can't have multiple versions/designs
- ❌ Breaks valid use cases

#### Option 3: Unique Constraint on `[digitalSignId, companyEventId]`
- ❌ Redundant - `digitalSignId` is already unique
- ❌ Doesn't solve the problem

#### Option 4: Composite Unique on `[companyEventId, companyUnit]`
```prisma
@@unique([companyEventId, companyUnit])
```
- ✅ Allows one sign per event per company unit
- ✅ Prevents accidental duplicates within same unit
- ✅ Still allows multiple signs for different units
- ⚠️ Requires `companyUnit` to be set (currently nullable)

#### Option 5: No Constraint, But Add Index
```prisma
@@index([companyEventId])
```
- ✅ Allows multiple signs per event
- ✅ Makes queries efficient
- ✅ No artificial restrictions
- ✅ Current state (already added)

## Recommended Solution

### Phase 1: Fix Data Model (DONE ✅)
1. ✅ Add `companyEventId` FK to `ProductDigitalSignCompanyEvent`
2. ✅ Add `eventItems` field (rename from `perks`)
3. ✅ Keep legacy fields for backward compatibility
4. ✅ Add index on `companyEventId` for efficient queries

### Phase 2: Migrate to Use FK (TODO)
1. Update code to prefer `companyEventId` over duplicated fields
2. When creating signage from event, set `companyEventId` instead of copying data
3. When reading signage, use `companyEvent.companyEvent` relation

### Phase 3: Deprecate Legacy Fields (Future)
1. Mark duplicated fields as deprecated
2. Migrate existing data to use `companyEventId`
3. Eventually remove duplicated fields

### Phase 4: Consider Unique Constraint (Optional)
- If duplicate prevention is needed, use `@@unique([companyEventId, companyUnit])`
- But this might be too restrictive
- Better: Add application-level validation/UI to prevent accidental duplicates

## Code Changes Needed

### 1. Update Creation Logic

**Before:**
```typescript
// Duplicates all event data
companyEvent: {
  create: {
    eventName: companyEvent.eventName,
    eventDate: companyEvent.eventDate,
    // ... all fields duplicated
  }
}
```

**After:**
```typescript
// References CompanyEvent
companyEvent: {
  create: {
    companyEventId: companyEvent.id, // ✅ Use FK
    // Legacy fields can be null or copied for backward compat
  }
}
```

### 2. Update Reading Logic

**Before:**
```typescript
// Reads duplicated data
const eventName = signage.companyEvent.eventName
```

**After:**
```typescript
// Reads from referenced CompanyEvent
const eventName = signage.companyEvent.companyEvent?.title 
  || signage.companyEvent.eventName // Fallback to legacy
```

### 3. Update Queries

**New Query: Find all signs for an event**
```typescript
const signs = await prisma.productDigitalSignCompanyEvent.findMany({
  where: { companyEventId: eventId },
  include: { signage: true }
})
```

## Summary

**Why So Many Variant Models?**
- Single-table inheritance pattern (discriminated union)
- Each sign type has different fields
- This is actually GOOD architecture ✅

**Why ProductDigitalSignCompanyEvent Seems Unique?**
- It's the ONLY variant that duplicates data instead of referencing source
- Other variants (Workforce, CompanyNews, Achievement) don't have source models
- This is the PROBLEM ❌

**Should There Be a Unique Constraint?**
- **NO** - Multiple signs per event is valid (different versions, units, purposes)
- **YES** - Add index for efficient queries (already done ✅)
- **MAYBE** - Consider `@@unique([companyEventId, companyUnit])` if needed

**The Real Issue:**
- Data duplication instead of FK reference
- Migration incomplete (`perks` → `eventItems`)
- No efficient way to query "signs for event X" (now fixed with index)
