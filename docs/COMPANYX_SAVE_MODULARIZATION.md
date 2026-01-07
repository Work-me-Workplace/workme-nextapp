# CompanyX Save Route Modularization

**Date:** 2025-01-XX  
**Purpose:** Refactor monolithic save route into modular service pattern

---

## Problem

The `/api/workforcestuff/save/route.ts` file had a **massive 300+ line switch statement** handling all 9 CompanyX types in one route file. This was:
- ❌ Hard to maintain
- ❌ Difficult to test individual types
- ❌ Violated single responsibility principle
- ❌ Made the route file bloated and hard to read

---

## Solution: Modular Service Pattern

Following the pattern from `IgniteBd-Next-combine` (template system), we've created:

### 1. **Service Layer** (`lib/services/companyx-save-handlers.ts`)
- Individual save handler function for each CompanyX type
- Each handler is self-contained and testable
- Router function delegates to appropriate handler

### 2. **Thin Route Layer** (`app/api/workforcestuff/save/route.ts`)
- Handles auth, validation, and orchestration
- Delegates save logic to service layer
- Clean and focused on API concerns

---

## Architecture

```
┌─────────────────────────────────────┐
│  API Route (save/route.ts)         │
│  - Auth & Validation                │
│  - Orchestration                    │
│  - Response formatting               │
└──────────────┬──────────────────────┘
               │
               │ delegates to
               ▼
┌─────────────────────────────────────┐
│  Service (companyx-save-handlers.ts)│
│  - saveCompanyX() router            │
│  - Individual handlers:             │
│    • saveTraining()                 │
│    • saveCareer()                   │
│    • saveEvent()                    │
│    • saveLeaderEngagement()         │
│    • saveCampaign()                 │
│    • saveImpactEvent()              │
│    • saveCommunity()                │
│    • saveBenefits()                 │
│    • saveEmployeeCause()            │
└─────────────────────────────────────┘
```

---

## Benefits

### ✅ **Maintainability**
- Each type's save logic is isolated
- Easy to find and modify specific type handlers
- Changes to one type don't affect others

### ✅ **Testability**
- Each handler can be unit tested independently
- Mock Prisma client for testing
- Test router function separately

### ✅ **Readability**
- Route file is now ~70 lines (was 350+)
- Service file is organized by type
- Clear separation of concerns

### ✅ **Extensibility**
- Adding a new CompanyX type:
  1. Add handler function to service
  2. Add case to router switch
  3. No changes needed to route file

### ✅ **Consistency**
- Follows same pattern as `IgniteBd-Next-combine` template system
- Aligns with service-oriented architecture
- Matches existing codebase patterns

---

## File Structure

### Before
```
app/api/workforcestuff/save/route.ts  (350+ lines)
  └─ Massive switch statement with all types
```

### After
```
app/api/workforcestuff/save/route.ts  (~70 lines)
  └─ Thin orchestration layer

lib/services/companyx-save-handlers.ts  (~400 lines)
  ├─ saveCompanyX() - Router function
  ├─ saveTraining()
  ├─ saveCareer()
  ├─ saveEvent()
  ├─ saveLeaderEngagement()
  ├─ saveCampaign()
  ├─ saveImpactEvent()
  ├─ saveCommunity()
  ├─ saveBenefits()
  └─ saveEmployeeCause()
```

---

## Usage

### Route File (Simplified)
```typescript
// STEP 1: Create with ingest
const ingestResult = await createCompanyXWithIngest(...)

// STEP 2: Parse content
const parsed = await parseCompanyXContent(...)

// STEP 3: Save using modular handler
const saveResult = await saveCompanyX(prisma, ingestResult, parsed)
```

### Service File (Modular)
```typescript
// Each handler is independent
export async function saveTraining(context: SaveHandlerContext) {
  // Training-specific save logic
}

export async function saveCareer(context: SaveHandlerContext) {
  // Career-specific save logic
}

// Router delegates to appropriate handler
export async function saveCompanyX(...) {
  switch (parsedData.type) {
    case 'training': return saveTraining(context)
    case 'career': return saveCareer(context)
    // etc.
  }
}
```

---

## Migration Notes

- ✅ **No breaking changes** - API contract unchanged
- ✅ **Same response format** - `{ success, id, type, redirectTo }`
- ✅ **Same behavior** - All save logic preserved
- ✅ **Backward compatible** - Existing clients work unchanged

---

## Next Steps

1. ✅ Modularization complete
2. ⏭️ Consider extracting common patterns (date handling, POC parsing, etc.)
3. ⏭️ Add unit tests for individual handlers
4. ⏭️ Consider similar pattern for other routes (update, delete, etc.)

---

**Last Updated:** 2025-01-XX

