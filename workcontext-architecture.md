# WorkContext Architecture

## Overview

The WorkContext system is a **router-based architecture** that separates **immutable context data** (typed models) from **routable references** (WorkContext model). This allows multiple WorkContexts to reference the same typed context data while maintaining unique routing and ownership.

## Core Architecture

### Two-Layer Model System

1. **Typed Context Models** (Immutable Facts)
   - Store the actual data (title, description, dates, POCs, etc.)
   - Examples: `WorkContextCampaign`, `WorkContextTraining`, `WorkContextEvent`
   - These are **facts** about what the organization is doing

2. **WorkContext Router Model** (Routable Reference)
   - Thin router entry that points to a typed context model
   - Stores: `type`, `typeRefId`, `createdByWorkMeId`
   - Used for routing, ownership, and relations

### Models

```prisma
// Router Model - Thin reference layer
model WorkContext {
  id                String   @id @default(cuid())
  createdAt         DateTime @default(now())
  type              String   // "campaign" | "impact_event" | "training" | etc.
  typeRefId         String   // References the typed context model ID
  createdByWorkMeId String   // Owner

  outputs WorkOutput[]
  supports WorkSupport[]

  @@index([createdByWorkMeId])
  @@index([type, typeRefId]) // Unique type+id lookup
}

// Example Typed Context Model
model WorkContextCampaign {
  id                String    @id @default(cuid())
  createdAt         DateTime  @default(now())
  title             String
  description       String?
  windowStart       DateTime?
  windowEnd         DateTime?
  // ... all the data fields
  createdByWorkMeId String
}
```

## Typed Context Types

The system supports these typed contexts:

1. **`campaign`** → `WorkContextCampaign`
2. **`impact_event`** → `WorkContextImpactEvent`
3. **`training`** → `WorkContextTraining`
4. **`event`** → `WorkContextEvent`
5. **`community`** → `WorkContextCommunity`
6. **`benefits`** → `WorkContextBenefits`
7. **`career`** → `WorkContextCareer`
8. **`employee_cause`** → `WorkContextEmployeeCause`

## CRUD Operations

### CREATE Flow

When creating a new typed context (e.g., Campaign):

1. **Create Typed Model** → `prisma.workContextCampaign.create(...)`
   - Stores all the data fields
   - Returns the typed model ID

2. **Create WorkContext Router** → `prisma.workContext.create(...)`
   - `type: "campaign"`
   - `typeRefId: campaign.id`
   - `createdByWorkMeId: workMeId`
   - Returns the WorkContext (this is what gets used for routing)

3. **Return Both**
   ```typescript
   return { 
     success: true, 
     campaign,      // Typed model
     workContext    // Router model - USE THIS FOR ROUTING
   }
   ```

### READ Flow

When reading a WorkContext:

1. **Fetch WorkContext** → `prisma.workContext.findFirst({ where: { id } })`
   - Gets the router entry with `type` and `typeRefId`

2. **Enrich with Typed Data** → `getTypedContext({ type, typeRefId })`
   - Uses `type` to determine which typed model to query
   - Uses `typeRefId` to fetch the specific typed context
   - Merges the data into a single enriched object

3. **Return Enriched Context**
   ```typescript
   {
     ...workContext,      // Router fields (id, createdAt, type, typeRefId)
     typedData: {...},    // Full typed context data
     title: typed.title,  // Convenience fields
   }
   ```

### UPDATE Flow ⚠️ **CURRENTLY MISSING**

**Problem**: We created models but didn't implement update/upsert functions!

When updating a typed context, we need:

1. **Update Typed Model** → `prisma.workContextCampaign.update(...)`
   - Update the actual data fields
   - Keep the same ID

2. **WorkContext Router** → No changes needed
   - The router entry stays the same
   - Only the typed data changes

**Required Implementation**:
```typescript
export async function updateCampaign(
  workContextId: string,  // The WorkContext router ID
  data: CampaignUpdateData
) {
  // 1. Get WorkContext to find typeRefId
  const workContext = await prisma.workContext.findFirst({
    where: { id: workContextId, createdByWorkMeId }
  })
  
  if (!workContext || workContext.type !== 'campaign') {
    return { success: false, error: 'Invalid context type' }
  }

  // 2. Update typed model using typeRefId
  const campaign = await prisma.workContextCampaign.update({
    where: { id: workContext.typeRefId },
    data: { ...validated }
  })

  // 3. Return enriched context
  return { success: true, campaign, workContext }
}
```

### DELETE Flow

When deleting a WorkContext:

1. **Delete WorkContext Router** → `prisma.workContext.delete(...)`
   - This should cascade to outputs/supports (if relations set up)

2. **Delete Typed Model** → Manual cleanup or cascade
   - Need to ensure typed model is also deleted
   - Currently handled via cascade in schema (check relations)

## Routing

### URL Structure

- `/mywork/context/[contextId]` → View WorkContext (uses WorkContext router ID)
- `/mywork/support/[contextId]` → View WorkSupport (uses WorkContext router ID)
- `/mywork/outputs/builder/[outputId]` → Build WorkOutput (uses WorkOutput ID)

### Navigation Flow

1. User creates typed context → Gets WorkContext ID
2. Redirect to `/mywork/context/[workContextId]` (NOT typed model ID)
3. Context detail page fetches WorkContext by ID
4. Enriches with typed data for display

## Data Flow

```
User Creates Campaign
  ↓
createCampaign() server action
  ↓
Create WorkContextCampaign (typed model) → returns campaign.id
  ↓
Create WorkContext (router) → type: "campaign", typeRefId: campaign.id
  ↓
Return { campaign, workContext }
  ↓
Frontend redirects to /mywork/context/[workContext.id]
  ↓
Page calls getWorkContext(workContext.id)
  ↓
Fetch WorkContext by ID → get type + typeRefId
  ↓
Call getTypedContext({ type: "campaign", typeRefId }) → fetch WorkContextCampaign
  ↓
Merge into enriched object → display
```

## Current Issues

### 1. Missing Update Functions ❌

**Problem**: No `updateCampaign`, `updateTraining`, etc. functions exist.

**Impact**: Users can't edit existing WorkContexts. They have to delete and recreate.

**Solution**: Implement update functions for each typed context type:
- `updateCampaign(workContextId, data)`
- `updateTraining(workContextId, data)`
- `updateEvent(workContextId, data)`
- ... etc.

### 2. Authentication Mismatch 🔧 **PARTIALLY FIXED**

**Problem**: WorkContext created with `clientWorkMeId` but retrieved with server `getWorkMeId()`.

**Solution**: Added `clientWorkMeId` fallback to `getWorkContext()` function.

**Remaining**: Need to ensure all create functions use consistent auth method.

### 3. WorkContext Disappearing After Create 🔍

**Likely Causes**:
1. **Auth mismatch**: Created with one workMeId, retrieved with different one
2. **Transaction rollback**: If typed model creation fails, WorkContext should rollback
3. **Missing error handling**: Silent failures during enrichment

**Debug Steps**:
- Check console logs for `[getWorkContext]` error messages
- Verify `workMeId` consistency between create and retrieve
- Check database directly to see if WorkContext exists

### 4. Missing Upsert Flow ⚠️

**Problem**: No "update if exists, create if not" functionality.

**Use Case**: User edits a WorkContext form, clicks save. Should update existing or create new?

**Current**: Forms always create new (no update logic).

**Solution**: Check if WorkContext exists before creating:
```typescript
// In form submit handler
const existing = await getWorkContext(workContextId)

if (existing.success) {
  // Update existing
  await updateCampaign(workContextId, formData)
} else {
  // Create new
  await createCampaign(formData)
}
```

## Best Practices

### DO ✅

- **Always use WorkContext ID for routing** (not typed model ID)
- **Always pass `clientWorkMeId` to getWorkContext()** as fallback
- **Enrich WorkContext before displaying** (call `getTypedContext()`)
- **Check ownership** before update/delete operations

### DON'T ❌

- Don't route directly to typed model IDs
- Don't query typed models directly (use WorkContext + enrichment)
- Don't skip authentication checks
- Don't create WorkContext without creating typed model first

## File Structure

```
lib/actions/
  ├── work-context.ts          # WorkContext router CRUD
  ├── typed-contexts.ts        # Typed context CRUD (CREATE only currently)
  ├── work-support.ts          # WorkSupport CRUD
  └── work-output.ts           # WorkOutput CRUD

app/mywork/
  ├── context/
  │   ├── [contextId]/         # View WorkContext (uses router ID)
  │   └── new/                 # Create new typed contexts
  ├── support/
  │   └── [contextId]/         # WorkSupport container
  └── outputs/
      └── builder/
          └── [outputId]/      # Build WorkOutputs
```

## Next Steps

1. **Implement UPDATE functions** for all typed contexts
2. **Add upsert logic** to forms (check existence before create)
3. **Add better error logging** throughout the flow
4. **Add transaction support** for create operations (rollback on failure)
5. **Add ownership validation** middleware
6. **Document the getTypedContext() enrichment pattern**

## Related Documentation

- `worktoachievement.md` - How Work relates to Achievements
- `TEMPLATE_SYSTEM.md` - Template system architecture
- `WORKPACKAGE_FORENSICS_REPORT.md` - Historical context

