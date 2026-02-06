# CompanyWork → MyContribution Refactor

**Date:** February 6, 2026  
**Status:** ✅ **Complete**

## What Was Refactored

### Problem
- CompanyWork was a confusing abstraction layer
- CompanyX models (CompanyEvent, CompanyCampaign, etc.) ARE the actual work stuff
- CompanyWork wasn't actually being created/used properly
- Blog topic generator was using CompanyWork instead of MyContribution

### Solution
- Removed CompanyWork from MyContribution model
- MyContribution now links directly to CompanyX models
- Refactored blog topic generator to use MyContribution instead of CompanyWork

## Changes Made

### 1. Schema Changes
- ✅ Removed `companyWorkId` from MyContribution
- ✅ Removed CompanyWork relation from MyContribution
- ✅ MyContribution now has direct FKs to CompanyX models only

### 2. Blog Topic Generator Refactor
**File:** `lib/services/blogTopicGenerator.ts`

**Before:**
- Used `companyWorkId` parameter
- Fetched CompanyWork model
- CompanyWork was abstract/generic

**After:**
- Uses `myContributionId` parameter
- Fetches MyContribution (which links to CompanyX)
- Extracts CompanyX context from MyContribution
- More specific and useful context

**Changes:**
- `SkillTopicBlogInput.companyWorkId` → `myContributionId`
- `BlogTopic.companyWorkId` → `myContributionId` + `companyXContext`
- Fetches MyContribution with CompanyX relations
- Extracts CompanyX context (type, id, title, description)
- Includes MyContribution fields (title, description, whatDid, results) in context

### 3. API Route Update
**File:** `app/api/myskills/generate-blog-topics/route.ts`

**Before:**
```typescript
companyWorkId,  // Generic CompanyWork ID
```

**After:**
```typescript
myContributionId,  // MyContribution ID (links to CompanyX work)
```

## Benefits

1. **Clearer Model:** MyContribution links directly to CompanyX (the actual work)
2. **Better Context:** Blog generator gets MyContribution details (whatDid, results) + CompanyX context
3. **No Abstraction Layer:** CompanyX models ARE the work stuff, no confusing CompanyWork
4. **More Useful:** Can reference specific contributions and their impact

## Usage

### Blog Topic Generation with MyContribution

```typescript
// Generate blog topics for a skill, referencing a specific contribution
const topics = await generateBlogTopics({
  workMeId: "workme-123",
  skillTopicId: "skill-456",
  myContributionId: "contribution-789", // Links to CompanyEvent, Campaign, etc.
});
```

The service will:
1. Fetch MyContribution with CompanyX relations
2. Extract CompanyX context (event, campaign, etc.)
3. Include MyContribution details (whatDid, results) in AI prompt
4. Generate blog topics with specific work context

## Files Modified

1. `prisma/schema.prisma` - Removed CompanyWork from MyContribution
2. `lib/services/blogTopicGenerator.ts` - Refactored to use MyContribution
3. `app/api/myskills/generate-blog-topics/route.ts` - Updated parameter

## Next Steps

- ✅ MyContribution links directly to CompanyX
- ✅ Blog generator uses MyContribution
- ⚠️ CompanyWork still exists in schema (for SkillItems/ContributionSummary if they use it)
- ⚠️ May need to refactor SkillItems/ContributionSummary later if they use CompanyWork
