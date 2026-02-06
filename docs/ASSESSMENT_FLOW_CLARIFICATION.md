# Assessment Flow Clarification

**Date:** February 6, 2026  
**Status:** ⚠️ **MVP1 Manual Helper vs Intended Flow**

## The Intended Flow

Assessments (ContributionSummary) should be **GENERATED** from work/events, not manually created.

### Intended Flow:
```
1. Event/Work Happens
   ↓
2. CompanyWork (created)
   ↓
3. MyContribution (user's role documented)
   ↓
4. SkillItems (evidence extracted)
   ↓
5. SkillTopics (capabilities identified)
   ↓
6. ContributionSummary (assessment GENERATED from above)
```

**Key Point:** Assessments emerge naturally AFTER work is done, summarizing what actually happened.

## Current MVP1 State

### What We Built:
- ✅ Manual assessment creation form (`/career/assessments`)
- ✅ CRUD API for ContributionSummary
- ✅ Appraisal helper page

### Why Manual Form Exists:
- **MVP1 Fallback** - Full flow (Event → Assessment) not yet built
- **Helper for Appraisal** - Users need something NOW, even if not perfect
- **"At least have something on file"** - Better than nothing

### The Gap:
- ❌ No automatic generation from events/work
- ❌ No CompanyWork → MyContribution → SkillItems → SkillTopics → ContributionSummary flow
- ⚠️ Manual form is a temporary helper until full flow is built

## Next Steps

### Phase 1: Keep Manual Helper (Current MVP1)
- ✅ Manual assessment form stays (it's useful!)
- ✅ Add note: "This is a manual helper - full flow coming soon"
- ✅ Users can still document accomplishments manually

### Phase 2: Build Event → Assessment Flow
1. **Event/Work Creation**
   - User creates event or work item
   - System creates CompanyWork

2. **Contribution Documentation**
   - User documents their role (MyContribution)
   - System extracts evidence (SkillItems)

3. **Skill Identification**
   - System/AI suggests SkillTopics
   - User confirms or edits

4. **Assessment Generation**
   - System generates ContributionSummary from:
     - CompanyWork
     - MyContribution
     - SkillItems
     - SkillTopics
   - User can edit/refine the generated summary

### Phase 3: Period-Based Aggregation
- Generate annual/quarterly assessments from multiple events
- Aggregate all CompanyWork in a period
- Create comprehensive ContributionSummary

## Current Assessment Page Note

The assessment page should include:
> **Note:** This is a manual helper for MVP1. The intended flow is: Event → Work → Contribution → Assessment (automatic generation). For now, you can manually document your accomplishments. Full flow coming soon!

## Files to Update

1. `app/career/assessments/page.tsx` - Add note about manual helper
2. Future: Build event → assessment generation service
3. Future: Build period-based aggregation service
