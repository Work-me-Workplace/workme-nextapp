# Perks → EventItems Migration Investigation

## What Was `perks`?

**`perks`** was a field on `CompanyEvent` that stored an **array of strings** representing:
- **Event highlights** (e.g., "Free lunch", "Raffle prizes", "Live music")
- **Event benefits** (e.g., "Networking opportunity", "CE credits available")
- **Key selling points** for the event

### Examples from Code:
```typescript
// From WorkEvent.md documentation:
perks: ["Free lunch", "Raffle prizes", "Live music"]

// From digital-signage-to-deck.ts:
'Highlights: ' + e.perks.join(', ')
```

## Why Was It Renamed to `eventItems`?

The migration happened on **Feb 17, 2026** (`20260217000000_companyevent_perks_to_eventitems`). The new name `eventItems` is more accurate because it represents:

1. **Highlights** - Key moments or selling points
2. **Agenda items** - What's happening at the event
3. **Key moments** - Important parts of the event

From the migration comment:
```sql
-- eventItems: highlights, agenda items, key moments (String[])
```

## Current State

### ✅ Migrated Models:
- **`CompanyEvent`** - Now uses `eventItems` (migration applied, `perks` column dropped)
- **`WorkEvent`** - Still has `perks` (separate model, not migrated yet)

### ✅ Still Using `perks` (Legitimately):
- **`ProductDigitalSignCompanyEvent`** - Separate model for digital signage, still uses `perks`
  - This is fine because it's a different model with different purpose
  - Located at: `prisma/schema.prisma:1336`

### ⚠️ Code Still Referencing `perks`:

1. **Digital Signage Models** (OK - different model):
   - `app/mywork/digital-signage/[id]/page.tsx` - Reading `ProductDigitalSignCompanyEvent.perks`
   - `lib/deck/digital-signage-to-deck.ts` - Using `perks` for digital signage display
   - `app/mywork/digital-signage/builder/new/page.tsx` - Form for creating digital signage

2. **Promotional Work Items** (Needs investigation):
   - `app/workforce/events/[eventId]/promo/*` - Multiple files using `perks` as a string (not array!)
   - `app/api/ingest/promotional/ai/route.ts` - Returns `perks: string | null` (should be array?)
   - **Issue**: These treat `perks` as a string, but `WorkEvent.perks` is an array

3. **Backward Compatibility** (OK - fallback handling):
   - `lib/server/gptJsonMapperService.ts` - `event.eventItems ?? event.perks`
   - `app/api/digital-signage/create/route.ts` - `companyEvent.eventItems || companyEvent.perks`
   - `app/api/mywork/digital-signage/create/route.ts` - `companyEvent.eventItems || companyEvent.perks`

## Type Inconsistencies Found

### Problem: `PromotionalWorkItem` uses `perks` as STRING
From `docs/WorkEvent.md`:
```
**Problem:** `perks` and `participation` are defined as **arrays** (`String[]`) 
in Prisma schema, but some forms and PromotionalWorkItem are treating them as **strings**.
```

Files affected:
- `app/workforce/events/[eventId]/promo/new/scratch/page.tsx` - Textarea input (string)
- `app/api/ingest/promotional/ai/route.ts` - Returns `perks: string | null`
- `app/workforce/events/[eventId]/promo/[promoId]/page.tsx` - Displays as string

## Summary

**`perks`** = Event highlights/benefits/selling points (array of strings)

**Migration reason**: Renamed to `eventItems` to better reflect that it includes:
- Highlights
- Agenda items  
- Key moments

**Current status**:
- ✅ `CompanyEvent.perks` → `CompanyEvent.eventItems` (migrated)
- ✅ `ProductDigitalSignCompanyEvent.perks` (still exists, different model)
- ⚠️ `WorkEvent.perks` (still exists, not migrated)
- ⚠️ `PromotionalWorkItem.perks` (type mismatch - string vs array)
