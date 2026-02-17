# Unified ProductDigitalSignWorkforceStuff Proposal

## The Problem

Currently we have separate variant models for each CompanyX type:
- `ProductDigitalSignWorkforce` (standalone)
- `ProductDigitalSignCompanyNews` (standalone)
- `ProductDigitalSignWorkforceAchievement` (standalone)
- `ProductDigitalSignCompanyEvent` (references CompanyEvent)

**But all CompanyX models share common fields:**
- `title` / `eventName`
- `description`
- Date/time fields (`eventDate`, `trainingDate`, `windowStart`, etc.)
- `location`
- `companyId`
- `workMeId`

**Only Events are unique because of:**
- `eventItems` (highlights, agenda items, key moments)

## Proposed Solution: Unified Model

### Single `ProductDigitalSignWorkforceStuff` Model

```prisma
model ProductDigitalSignWorkforceStuff {
  id            String @id @default(cuid())
  digitalSignId String @unique

  // Polymorphic FK to any CompanyX model
  companyEventId        String?
  companyTrainingId    String?
  companyCampaignId    String?
  companyBenefitsId    String?
  companyCareerId      String?
  companyCommunityId   String?
  companyImpactEventId String?
  companyEmployeeCauseId String?
  companyLeaderEngagementId String?

  // Relations to CompanyX models
  companyEvent        CompanyEvent?        @relation(fields: [companyEventId], references: [id], onDelete: SetNull)
  companyTraining     CompanyTraining?     @relation(fields: [companyTrainingId], references: [id], onDelete: SetNull)
  companyCampaign     CompanyCampaign?     @relation(fields: [companyCampaignId], references: [id], onDelete: SetNull)
  companyBenefits     CompanyBenefits?     @relation(fields: [companyBenefitsId], references: [id], onDelete: SetNull)
  companyCareer       CompanyCareer?       @relation(fields: [companyCareerId], references: [id], onDelete: SetNull)
  companyCommunity    CompanyCommunity?    @relation(fields: [companyCommunityId], references: [id], onDelete: SetNull)
  companyImpactEvent  CompanyImpactEvent?  @relation(fields: [companyImpactEventId], references: [id], onDelete: SetNull)
  companyEmployeeCause CompanyEmployeeCause? @relation(fields: [companyEmployeeCauseId], references: [id], onDelete: SetNull)
  companyLeaderEngagement CompanyLeaderEngagement? @relation(fields: [companyLeaderEngagementId], references: [id], onDelete: SetNull)

  // Common fields (from CompanyX models)
  title       String?
  description String?
  
  // Date/time fields (normalized from CompanyX)
  date        DateTime?  // eventDate, trainingDate, effectiveDate, date, windowStart
  endDate     DateTime?  // windowEnd (for campaigns/benefits)
  startTime   String?
  endTime     String?
  location    String?

  // Event-specific fields (only for events)
  eventItems String[] @default([]) // Highlights, agenda items, key moments (only for CompanyEvent)

  // Legacy fields for backward compatibility (can be removed after migration)
  eventName        String?
  registrationLink String?

  signage ProductDigitalSign @relation(fields: [digitalSignId], references: [id], onDelete: Cascade)

  // Indexes for efficient queries
  @@index([companyEventId])
  @@index([companyTrainingId])
  @@index([companyCampaignId])
  @@index([companyBenefitsId])
  @@index([companyCareerId])
  @@index([companyCommunityId])
  @@index([companyImpactEventId])
  @@index([companyEmployeeCauseId])
  @@index([companyLeaderEngagementId])
  
  // Constraint: exactly one CompanyX FK must be set
  @@check(
    (companyEventId IS NOT NULL)::int +
    (companyTrainingId IS NOT NULL)::int +
    (companyCampaignId IS NOT NULL)::int +
    (companyBenefitsId IS NOT NULL)::int +
    (companyCareerId IS NOT NULL)::int +
    (companyCommunityId IS NOT NULL)::int +
    (companyImpactEventId IS NOT NULL)::int +
    (companyEmployeeCauseId IS NOT NULL)::int +
    (companyLeaderEngagementId IS NOT NULL)::int = 1
  )
}
```

### Update ProductDigitalSign

```prisma
model ProductDigitalSign {
  // ... existing fields ...
  
  // Replace separate variants with unified model
  workforceStuff ProductDigitalSignWorkforceStuff?
  
  // Keep other standalone variants
  workforce            ProductDigitalSignWorkforce?
  companyNews          ProductDigitalSignCompanyNews?
  workforceAchievement ProductDigitalSignWorkforceAchievement?
  
  // Remove: companyEvent ProductDigitalSignCompanyEvent?
}
```

## Benefits

1. **Single Model** ✅
   - One model instead of 9+ separate models
   - Easier to maintain and query

2. **Polymorphic FK** ✅
   - References any CompanyX model
   - Type-safe via Prisma relations

3. **Common Fields** ✅
   - Normalized date/time/location fields
   - No data duplication

4. **Event-Specific Support** ✅
   - `eventItems` field for events only
   - Other types ignore this field

5. **Backward Compatible** ✅
   - Can migrate existing data
   - Legacy fields for transition period

## Migration Strategy

### Phase 1: Add New Model (Non-Breaking)
1. Add `ProductDigitalSignWorkforceStuff` model
2. Add relation to `ProductDigitalSign`
3. Keep existing `ProductDigitalSignCompanyEvent` for now

### Phase 2: Migrate Data
1. Migrate `ProductDigitalSignCompanyEvent` → `ProductDigitalSignWorkforceStuff`
2. Set appropriate CompanyX FK based on source
3. Copy common fields (title, date, location, etc.)
4. Copy `eventItems` for events

### Phase 3: Update Code
1. Update creation logic to use unified model
2. Update reading logic to use unified model
3. Update queries to use unified model

### Phase 4: Remove Old Model
1. Remove `ProductDigitalSignCompanyEvent`
2. Remove other CompanyX-specific variants (if any)
3. Clean up legacy fields

## Usage Examples

### Creating Signage from CompanyEvent

```typescript
await prisma.productDigitalSign.create({
  data: {
    signType: 'COMPANY_EVENT',
    companyUnit: 'SEA 05',
    createdByWorkMeId: userId,
    workforceStuff: {
      create: {
        companyEventId: event.id, // ✅ FK reference
        // Common fields auto-populated from CompanyEvent relation
        // Or can override:
        title: event.title,
        date: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        eventItems: event.eventItems, // Event-specific
      }
    }
  },
  include: {
    workforceStuff: {
      include: {
        companyEvent: true // Can access full CompanyEvent
      }
    }
  }
})
```

### Creating Signage from CompanyTraining

```typescript
await prisma.productDigitalSign.create({
  data: {
    signType: 'COMPANY_TRAINING', // New type or reuse COMPANY_EVENT?
    workforceStuff: {
      create: {
        companyTrainingId: training.id, // ✅ FK reference
        title: training.title,
        date: training.trainingDate,
        startTime: training.startTime,
        endTime: training.endTime,
        location: training.location,
        // No eventItems (not an event)
      }
    }
  }
})
```

### Querying All Signs for an Event

```typescript
const signs = await prisma.productDigitalSignWorkforceStuff.findMany({
  where: { companyEventId: eventId },
  include: {
    signage: true,
    companyEvent: true // Full event data
  }
})
```

## Alternative: Simpler Polymorphic Approach

If Prisma doesn't support the check constraint well, use a single FK with type discriminator:

```prisma
model ProductDigitalSignWorkforceStuff {
  id            String @id @default(cuid())
  digitalSignId String @unique

  // Polymorphic FK
  companyXId   String?  // ID of any CompanyX model
  companyXType String?  // 'event', 'training', 'campaign', etc.

  // Common fields
  title       String?
  description String?
  date        DateTime?
  endDate     DateTime?
  startTime   String?
  endTime     String?
  location    String?
  eventItems  String[] @default([]) // Only for events

  signage ProductDigitalSign @relation(...)
  
  @@index([companyXId, companyXType])
}
```

**Trade-off:** Less type-safe, but simpler and more flexible.

## Recommendation

**Go with the multi-FK approach** (first option) because:
1. ✅ Type-safe via Prisma relations
2. ✅ Can use `include: { companyEvent: true }` for full data
3. ✅ Database enforces FK constraints
4. ✅ Better IDE autocomplete

The check constraint ensures exactly one FK is set, preventing invalid data.
