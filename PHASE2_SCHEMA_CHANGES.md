# Phase 2: Model Normalization with companyId + createdByWorkMeId

## Summary

All work-related models now have `companyId` and `createdByWorkMeId` as required fields with proper relations to `Company` and `WorkMe`.

## Schema Changes Applied

### ✅ Company Model Updated
Added relations to all work models:
- `contexts` → WorkContext[]
- `supports` → WorkSupport[]
- `outputs` → WorkOutput[]
- `standaloneOutputs` → WorkOutputStandalone[]
- `campaignContexts` → WorkContextCampaign[]
- `impactEventContexts` → WorkContextImpactEvent[]
- `trainingContexts` → WorkContextTraining[]
- `eventContexts` → WorkContextEvent[]
- `communityContexts` → WorkContextCommunity[]
- `benefitsContexts` → WorkContextBenefits[]
- `careerContexts` → WorkContextCareer[]
- `employeeCauseContexts` → WorkContextEmployeeCause[]
- `objectives` → Objective[]
- `achievements` → Achievement[]
- `commsOutputs` → CommsOutput[]
- `workforceComms` → WorkforceComms[]
- `commsDrafts` → WorkforceCommsDraft[]
- `commsEditions` → WorkforceCommsEdition[]

### ✅ WorkMe Model Updated
Added relations to all created work models:
- `createdContexts` → WorkContext[]
- `createdSupports` → WorkSupport[]
- `createdOutputs` → WorkOutput[]
- `createdStandaloneOutputs` → WorkOutputStandalone[]
- `createdCampaignContexts` → WorkContextCampaign[]
- `createdImpactEventContexts` → WorkContextImpactEvent[]
- `createdTrainingContexts` → WorkContextTraining[]
- `createdEventContexts` → WorkContextEvent[]
- `createdCommunityContexts` → WorkContextCommunity[]
- `createdBenefitsContexts` → WorkContextBenefits[]
- `createdCareerContexts` → WorkContextCareer[]
- `createdEmployeeCauseContexts` → WorkContextEmployeeCause[]
- `createdObjectives` → Objective[]
- `createdAchievements` → Achievement[]
- `createdCommsOutputs` → CommsOutput[]
- `createdWorkforceComms` → WorkforceComms[]
- `createdCommsDrafts` → WorkforceCommsDraft[]
- `createdCommsEditions` → WorkforceCommsEdition[]

### ✅ Root Work Models

#### WorkContext
- ✅ Added `companyId` (required String)
- ✅ Added `company` relation → Company
- ✅ Added `createdBy` relation → WorkMe
- ✅ Added indexes: `@@index([companyId])`, `@@index([createdByWorkMeId])`

#### WorkSupport
- ✅ Added `companyId` (required String)
- ✅ Added `company` relation → Company
- ✅ Added `createdBy` relation → WorkMe
- ✅ Added indexes: `@@index([companyId])`, `@@index([createdByWorkMeId])`

#### WorkOutput
- ✅ Added `companyId` (required String)
- ✅ Added `company` relation → Company
- ✅ Added `createdBy` relation → WorkMe
- ✅ Added indexes: `@@index([companyId])`, `@@index([createdByWorkMeId])`

#### WorkOutputStandalone
- ✅ Added `companyId` (required String)
- ✅ Added `company` relation → Company
- ✅ Added `createdBy` relation → WorkMe
- ✅ Added indexes: `@@index([companyId])`, `@@index([createdByWorkMeId])`

### ✅ Typed Context Models

All 8 typed context models updated:
- ✅ WorkContextCampaign
- ✅ WorkContextImpactEvent
- ✅ WorkContextTraining
- ✅ WorkContextEvent
- ✅ WorkContextCommunity
- ✅ WorkContextBenefits
- ✅ WorkContextCareer
- ✅ WorkContextEmployeeCause

Each now has:
- `companyId` (required String)
- `company` relation → Company
- `createdBy` relation → WorkMe
- Indexes for `companyId` and `createdByWorkMeId`

### ✅ Career Models

#### CommsOutput
- ✅ Added `companyId` (required String)
- ✅ Added `company` relation → Company
- ✅ Changed `workMeId` to `createdByWorkMeId`
- ✅ Added `createdBy` relation → WorkMe
- ✅ Added indexes: `@@index([companyId])`, `@@index([createdByWorkMeId])`

#### Objective
- ✅ Added `companyId` (required String)
- ✅ Added `company` relation → Company
- ✅ Changed `workMeId` to `createdByWorkMeId`
- ✅ Added `createdBy` relation → WorkMe
- ✅ Added indexes: `@@index([companyId])`, `@@index([createdByWorkMeId])`

#### Achievement
- ✅ Added `companyId` (required String)
- ✅ Added `company` relation → Company
- ✅ Changed `workMeId` to `createdByWorkMeId`
- ✅ Added `createdBy` relation → WorkMe
- ✅ Added indexes: `@@index([companyId])`, `@@index([createdByWorkMeId])`, `@@index([category])`

### ✅ Workforce Comms Models

#### WorkforceComms
- ✅ Added `companyId` (required String)
- ✅ Added `company` relation → Company
- ✅ Added `createdByWorkMeId` (required String)
- ✅ Added `createdBy` relation → WorkMe
- ✅ Added indexes: `@@index([companyId])`, `@@index([createdByWorkMeId])`

#### WorkforceCommsDraft
- ✅ Added `companyId` (required String)
- ✅ Added `company` relation → Company
- ✅ Added `createdByWorkMeId` (required String)
- ✅ Added `createdBy` relation → WorkMe
- ✅ Added indexes: `@@index([companyId])`, `@@index([createdByWorkMeId])`

#### WorkforceCommsEdition
- ✅ Added `companyId` (required String)
- ✅ Added `company` relation → Company
- ✅ Added `createdByWorkMeId` (required String)
- ✅ Added `createdBy` relation → WorkMe
- ✅ Added indexes: `@@index([companyId])`, `@@index([createdByWorkMeId])`

## Relations Structure

```
Company (Root Tenant)
  ├── WorkMe (employees)
  │   └── companyId → Company.id
  │
  ├── WorkContext (work containers)
  │   ├── companyId → Company.id ✅
  │   └── createdByWorkMeId → WorkMe.id ✅
  │
  ├── WorkSupport (support containers)
  │   ├── companyId → Company.id ✅
  │   ├── contextId → WorkContext.id
  │   └── createdByWorkMeId → WorkMe.id ✅
  │
  ├── WorkOutput (outputs)
  │   ├── companyId → Company.id ✅
  │   ├── contextId → WorkContext.id?
  │   ├── supportId → WorkSupport.id?
  │   └── createdByWorkMeId → WorkMe.id ✅
  │
  ├── WorkOutputStandalone (standalone outputs)
  │   ├── companyId → Company.id ✅
  │   └── createdByWorkMeId → WorkMe.id ✅
  │
  ├── WorkContextCampaign|ImpactEvent|Training|Event|Community|Benefits|Career|EmployeeCause
  │   ├── companyId → Company.id ✅
  │   └── createdByWorkMeId → WorkMe.id ✅
  │
  ├── Objective, Achievement, CommsOutput
  │   ├── companyId → Company.id ✅
  │   └── createdByWorkMeId → WorkMe.id ✅
  │
  └── WorkforceComms, WorkforceCommsDraft, WorkforceCommsEdition
      ├── companyId → Company.id ✅
      └── createdByWorkMeId → WorkMe.id ✅
```

## Validation

✅ Schema validates successfully
✅ All relations properly defined
✅ All foreign keys have `onDelete: Cascade` for data integrity
✅ All indexes added for performance

## Next Steps (Phase 3)

1. Generate Prisma Client with new schema
2. Update all factory functions to accept `companyId` explicitly
3. Update all create/update functions to inject `companyId` from `verifyAuth()`
4. Update all queries to filter by `companyId`
5. Remove all fallback calls to `getWorkMeId()`

## Files Modified

- `prisma/schema.prisma` - Complete normalization with companyId + createdByWorkMeId

---

**Phase 2 Complete** - Schema normalized and ready for migration

