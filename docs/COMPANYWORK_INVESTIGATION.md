# CompanyWork Investigation

**Date:** February 6, 2026

## What Is CompanyWork?

**From Schema:**
- Generic container for company-owned work
- Polymorphic reference to CompanyX models (CompanyEvent, CompanyCampaign, etc.)
- Has `companyEventId`, `companyCampaignId`, etc. (one will be set)
- Has `title`, `description`, `workType`

**Purpose (from docs):**
- Bridge between CompanyX models and Work Value Model
- SkillItems reference CompanyWork (not CompanyX directly)
- MyContribution was supposed to link to CompanyWork (not CompanyX)

## Actual Usage in Codebase

### ✅ Used:
1. **blogTopicGenerator.ts** - References CompanyWork if provided
   - `prisma.companyWork.findUnique()` - Only reads, doesn't create
   - Used for context in blog generation

2. **Schema Relations:**
   - CompanyX models have `companyWork CompanyWork[]` relation
   - MyContribution has `companyWorkId` FK
   - SkillItem has `companyWorkId` FK
   - ContributionSummary has `companyWorkId` FK

### ❌ NOT Used:
1. **No actual creation** - No `prisma.companyWork.create()` found in codebase
2. **Only in docs** - Examples show creating CompanyWork, but no real code does it
3. **CompanyX models are independent** - Events, campaigns, etc. exist without CompanyWork

## The Problem

**CompanyWork is:**
- A theoretical abstraction layer
- Not actually created when CompanyX models are created
- Confusing because it adds an extra layer
- CompanyX models (CompanyEvent, etc.) are the actual "work stuff"

**User's Point:**
- CompanyEvent IS the work stuff
- CompanyWork is an unnecessary abstraction
- MyContribution should link directly to CompanyX models

## Current State

**CompanyX Models:**
- CompanyEvent, CompanyCampaign, CompanyTraining, etc.
- These are the actual "work stuff"
- They exist independently
- They have `companyWork CompanyWork[]` relation (but CompanyWork records aren't created)

**MyContribution:**
- Currently has FK to CompanyWork (legacy)
- Should link directly to CompanyX models ✅ (we just added this)

## Recommendation

**Remove CompanyWork from MyContribution:**
- ✅ Already done - MyContribution now has direct FKs to CompanyX
- Remove `companyWorkId` from MyContribution (it's confusing)
- CompanyX models ARE the work stuff

**CompanyWork Status:**
- Keep in schema for SkillItems/ContributionSummary (if they use it)
- But MyContribution should NOT use it
- CompanyX models are the source of truth

## Conclusion

**CompanyWork = Confusing abstraction layer**
- CompanyX models (CompanyEvent, etc.) ARE the work stuff
- CompanyWork was meant to be a bridge but isn't actually used
- MyContribution should link directly to CompanyX ✅ (already done)
