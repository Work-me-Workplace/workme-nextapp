# Work to Achievement Flow

## Overview

This document explains the relationship between **Work** (WorkContexts and WorkOutputs) and **Achievements** in the WorkMe application.

## The Problem

Achievements were originally trying to reference work-related entities (like campaigns) before the Work architecture was fully established. This created a chicken-and-egg problem where achievements needed work records, but work wasn't properly set up yet.

## The Solution: Work-First Architecture

**The flow must be: Work → Achievement, not Achievement → Work.**

### Step 1: Create Work Context

Before creating an achievement, you must first establish the work context:

1. Navigate to `/mywork/context/new`
2. Select the type of work context:
   - **Campaign** (WorkContextCampaign)
   - **Impacts** (WorkContextImpactEvent) 
   - **Training** (WorkContextTraining)
   - **Event** (WorkContextEvent)
   - **Community** (WorkContextCommunity)
   - **Benefits** (WorkContextBenefits)
   - **Career** (WorkContextCareer)
   - **Employee Cause** (WorkContextEmployeeCause)

3. Fill in the context details (title, description, dates, POC info, etc.)
4. Save the WorkContext

### Step 2: Create Work Outputs (Optional)

Once a WorkContext exists, you can create WorkOutputs:

1. Navigate to `/mywork/outputs/[contextId]`
2. Select the output type:
   - Email
   - Poster
   - Talking Points
   - SharePoint Block
   - Event Kit

3. Create and save the WorkOutput

### Step 3: Create Achievement

**Now** you can create an achievement that references the work:

1. Navigate to `/career/achievements/new`
2. Fill in achievement details:
   - Title, category, what you did
   - Link to **CommsOutput** (if you created a comms output)
   - Link to **Objective** (if related to a career objective)

3. **Note**: Achievements currently reference:
   - `commsOutputId` - Links to CommsOutput (workforce communications)
   - `objectiveId` - Links to career planning objectives

## Future: Linking Achievements to WorkContexts

The next step in the architecture should be to allow achievements to directly reference WorkContexts and WorkOutputs:

```typescript
// Future schema addition
model Achievement {
  // ... existing fields ...
  
  workContextId String?  // FK -> WorkContext
  workOutputId  String?  // FK -> WorkOutput
  
  workContext   WorkContext? @relation(...)
  workOutput    WorkOutput?  @relation(...)
}
```

This would allow:
- **Achievements** to track work completed on specific **WorkContexts**
- **Achievements** to reference specific **WorkOutputs** produced
- A clear trail: WorkContext → WorkOutput → Achievement

## Current State vs. Future State

### Current State (After CompanyCampaign Removal)

- ✅ WorkContexts are created first
- ✅ WorkOutputs can be created from WorkContexts
- ✅ Achievements can reference CommsOutputs and Objectives
- ❌ Achievements **cannot** directly reference WorkContexts yet
- ❌ Achievements **cannot** directly reference WorkOutputs yet

### Future State (Recommended)

- ✅ WorkContext created
- ✅ WorkOutput created from WorkContext
- ✅ Achievement created that references:
  - The WorkContext (what work was done)
  - The WorkOutput (what was produced)
  - CommsOutput (if it was a communication)
  - Objective (if it aligns with career goals)

## Migration Path

1. **Add WorkContext and WorkOutput relations to Achievement model**
2. **Update achievement forms** to include WorkContext/WorkOutput selectors
3. **Update achievement display** to show linked work contexts/outputs
4. **Add validation** to ensure work exists before achievement can reference it

## Key Principle

**Work comes first. Achievements document the work done, not the other way around.**

You cannot achieve something without doing the work first. Therefore:
- Create WorkContext → Do the work → Create WorkOutput → Document as Achievement

## Related Models

- `WorkContext` - The router model for all work contexts
- `WorkContextCampaign` - Campaign-specific context
- `WorkContextImpactEvent` - Impact/disruption context
- `WorkContextTraining` - Training context
- `WorkContextEvent` - Event context
- `WorkContextCommunity` - Community opportunity context
- `WorkContextBenefits` - Benefits enrollment context
- `WorkContextCareer` - Career assessment context
- `WorkContextEmployeeCause` - Employee cause/charity context
- `WorkOutput` - Outputs produced from work contexts
- `Achievement` - Documentation of completed work
- `CommsOutput` - Communication outputs (separate from WorkOutput)
- `Objective` - Career planning objectives

## Notes

- The old `CompanyCampaign` model was removed because it conflicted with the new WorkContext architecture
- Achievements that previously referenced `CompanyCampaign` should now be linked through WorkContexts
- The separation between `CommsOutput` and `WorkOutput` may need clarification in the future

