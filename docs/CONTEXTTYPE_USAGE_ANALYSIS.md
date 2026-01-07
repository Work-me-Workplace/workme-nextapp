# ContextType Usage Analysis

**Date:** 2025-01-XX  
**Purpose:** Comprehensive analysis of how `ContextType` from `lib/types/context-type.ts` is used throughout the codebase

---

## Executive Summary

`ContextType` is a **TypeScript-only type** (not a Prisma enum) that serves as the canonical type definition for CompanyX model types. It's used extensively for:

1. **Type Safety** - Ensuring only valid CompanyX types are used
2. **Mapping** - Converting between types and model names, routes, etc.
3. **Inference** - AI/LLM-based type inference from raw text
4. **Routing** - URL route segment mapping
5. **Validation** - API route input validation

**Key Finding:** `ContextType` is NOT used for database model creation directly. Instead, it's used as a **routing/mapping layer** that translates to actual Prisma model names (e.g., `'training'` → `'companyTraining'`).

---

## Type Definition

**Location:** `lib/types/context-type.ts`

```typescript
export type ContextType =
  | 'campaign'
  | 'impact_event'
  | 'training'
  | 'event'
  | 'leader_engagement'
  | 'community'
  | 'benefits'
  | 'career'
  | 'employee_cause'
```

**Note:** This is a TypeScript type, NOT a Prisma enum. It was created after removing `WorkEventRouter` to provide type safety without database enum constraints.

---

## Usage Patterns

### 1. **Mapping Services** (Core Infrastructure)

#### `lib/services/companyx-mapper.ts`
**Purpose:** Canonical mapping between ContextType and Prisma models

**Key Exports:**
- `CONTEXT_TYPE_TO_MODEL: Record<ContextType, string>` - Maps type to Prisma model name
  - Example: `'training'` → `'companyTraining'`
- `CONTEXT_TYPE_TO_ROUTE: Record<ContextType, string>` - Maps type to URL route segment
  - Example: `'impact_event'` → `'impact-event'`
- `REQUIRED_FIELDS: Record<ContextType, Record<string, any>>` - Required fields per type
- `createCompanyXWithIngest()` - Creates CompanyX models using ContextType

**Usage Pattern:**
```typescript
const modelName = CONTEXT_TYPE_TO_MODEL[type] // 'training' → 'companyTraining'
const route = CONTEXT_TYPE_TO_ROUTE[type]     // 'impact_event' → 'impact-event'
await createCompanyXWithIngest(prisma, type, rawText, workMeId, companyId)
```

#### `lib/services/workstuff-routes.ts`
**Purpose:** Route segment ↔ ContextType bidirectional mapping

**Key Exports:**
- `ROUTE_TO_TYPE: Record<string, ContextType>` - URL segment → ContextType
- `TYPE_TO_ROUTE: Record<ContextType, string>` - ContextType → URL segment
- `getTypeFromRoute()` - Helper function

**Usage Pattern:**
```typescript
const type = getTypeFromRoute('training') // Returns 'training'
const route = TYPE_TO_ROUTE['impact_event'] // Returns 'impact-event'
```

---

### 2. **AI/Inference Services**

#### `lib/services/companyx-topic-inference.ts`
**Purpose:** Infers ContextType from raw text using keyword matching + LLM fallback

**Key Function:**
- `inferCompanyXType(text: string): Promise<InferenceResult>`
  - Returns: `{ type: ContextType, confidence: number, explanation: string }`

**Usage Pattern:**
```typescript
const inference = await inferCompanyXType(rawText)
// Returns: { type: 'training', confidence: 0.9, explanation: '...' }
```

**Implementation:**
1. Keyword-based scoring for each ContextType
2. Deterministic selection if confidence ≥ 2 keywords
3. LLM fallback (GPT-4o-mini) for ambiguous cases
4. Always returns a valid ContextType (never null/undefined)

#### `lib/services/companyx-unified-mapper.ts`
**Purpose:** Routes to appropriate parser based on ContextType

**Key Function:**
- `parseCompanyXContent(rawText: string, type: ContextType): Promise<ParsedCompanyXData>`

**Usage Pattern:**
```typescript
const parsed = await parseCompanyXContent(rawText, 'training')
// Returns: { type: 'training', data: TrainingModel }
```

**Switch Statement:**
- Maps each ContextType to its specific parser service
- Returns typed union based on ContextType

---

### 3. **API Routes** (Request/Response Handling)

#### `app/api/workstuff/ingest/type-infer/route.ts`
**Purpose:** Type inference endpoint (Stage 1 of ingest flow)

**Usage:**
```typescript
const inference = await inferCompanyXType(blob)
return { suggestedType: inference.type } // ContextType
```

#### `app/api/workstuff/ingest/create-training/route.ts`
**Purpose:** Creates CompanyX model with ingest snapshot

**Usage:**
```typescript
// Validates selectedType is ContextType
const validTypes: ContextType[] = ['training', 'career', ...]
if (!validTypes.includes(selectedType as ContextType)) { ... }

// Creates model
await createCompanyXWithIngest(prisma, selectedType as ContextType, ...)
```

#### `app/api/workforcestuff/save/route.ts`
**Purpose:** Full ingest flow (create + parse + update)

**Usage:**
```typescript
// Validates type
const validTypes: ContextType[] = [...]
if (!validTypes.includes(type as ContextType)) { ... }

// Creates with ingest
await createCompanyXWithIngest(prisma, type as ContextType, ...)

// Parses content
const parsed = await parseCompanyXContent(rawText, type as ContextType)

// Updates record (switch on type)
switch (type) {
  case 'training': { ... }
  case 'career': { ... }
  // etc.
}
```

#### `app/api/signalingest/clip/parse/route.ts`
**Purpose:** Ingest article from search results

**Usage:**
```typescript
// Infers type
const inference = await inferCompanyXType(rawText)
inferredType = inference.type // ContextType

// Parses content
parsed = await parseCompanyXContent(rawText, inferredType as ContextType)

// Creates record (switch on parsed.type)
switch (parsed.type) {
  case 'training': { ... }
  // etc.
}
```

#### `app/api/utils/news-artifact/parse/route.ts`
**Purpose:** Parse CompanyNewsArtifact to various model types

**Usage:**
```typescript
// Uses ContextType for CompanyX types
if (modelType is ContextType) {
  const parsed = await parseCompanyXContent(rawText, modelType as ContextType)
}
```

---

### 4. **Type Validation Patterns**

**Common Pattern Across API Routes:**
```typescript
const validTypes: ContextType[] = [
  'training',
  'career',
  'event',
  'campaign',
  'impact_event',
  'community',
  'benefits',
  'employee_cause',
  'leader_engagement', // Sometimes missing!
]

if (!validTypes.includes(type as ContextType)) {
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
```

**Issue Found:** Some routes are missing `'leader_engagement'` in their validation arrays, which could cause validation failures.

---

## Architecture Flow

### Ingest Flow (Typical)
```
1. User submits rawText
   ↓
2. inferCompanyXType(rawText)
   → Returns: { type: ContextType, confidence, explanation }
   ↓
3. User confirms type (or system uses inferred)
   ↓
4. createCompanyXWithIngest(prisma, type: ContextType, ...)
   → Uses CONTEXT_TYPE_TO_MODEL[type] to get model name
   → Creates: prisma[modelName].create(...)
   ↓
5. parseCompanyXContent(rawText, type: ContextType)
   → Routes to type-specific parser
   → Returns: ParsedCompanyXData
   ↓
6. prisma[modelName].update({ ...parsedData })
```

### Route Resolution Flow
```
URL: /mycompany/workforcestuff/training/123
   ↓
getTypeFromRoute('training')
   → Returns: 'training' (ContextType)
   ↓
CONTEXT_TYPE_TO_MODEL['training']
   → Returns: 'companyTraining'
   ↓
prisma.companyTraining.findUnique({ where: { id: '123' } })
```

---

## Files Using ContextType

### Core Services (5 files)
1. ✅ `lib/services/companyx-mapper.ts` - Core mapping service
2. ✅ `lib/services/workstuff-routes.ts` - Route mapping
3. ✅ `lib/services/companyx-topic-inference.ts` - Type inference
4. ✅ `lib/services/companyx-unified-mapper.ts` - Parser routing
5. ✅ `lib/services/company-news-to-model-parser-service.ts` - News artifact parsing

### API Routes (5 files)
1. ✅ `app/api/workstuff/ingest/type-infer/route.ts` - Type inference endpoint
2. ✅ `app/api/workstuff/ingest/create-training/route.ts` - Create with ingest
3. ✅ `app/api/workforcestuff/save/route.ts` - Full ingest flow
4. ✅ `app/api/signalingest/clip/parse/route.ts` - Article ingest
5. ✅ `app/api/utils/news-artifact/parse/route.ts` - News artifact parsing

### Type Definition (1 file)
1. ✅ `lib/types/context-type.ts` - Type definition

**Total: 11 files actively using ContextType**

---

## Key Observations

### ✅ What ContextType IS Used For:
1. **Type Safety** - TypeScript type checking
2. **Mapping** - Type → Model name, Type → Route segment
3. **Inference** - AI-based type detection
4. **Routing** - URL segment resolution
5. **Validation** - API input validation
6. **Parser Routing** - Directing to correct parser service

### ❌ What ContextType is NOT Used For:
1. **Database Schema** - No Prisma enum (TypeScript-only)
2. **Direct Model Creation** - Always goes through mapping layer
3. **Database Queries** - Uses mapped model names, not ContextType
4. **Legacy WorkContext** - Removed from model creation

---

## Potential Issues

### 1. **Missing `leader_engagement` in Validation Arrays**
Some API routes have validation arrays that are missing `'leader_engagement'`:
- `app/api/workstuff/ingest/create-training/route.ts` - Missing in validTypes array
- Other routes may have similar issues

**Fix:** Ensure all validation arrays include all 9 ContextType values.

### 2. **Inconsistent Type Assertions**
Some code uses `as ContextType` without proper validation:
```typescript
// Potentially unsafe
const type = body.type as ContextType
```

**Better Pattern:**
```typescript
const validTypes: ContextType[] = [...]
if (!validTypes.includes(body.type as ContextType)) {
  return error
}
```

### 3. **Hardcoded Type Lists**
Multiple files have hardcoded arrays of ContextType values. Consider:
- Exporting `CONTEXT_TYPES` array from `context-type.ts` (already exists!)
- Using it consistently across all validation

---

## Recommendations

### 1. **Standardize Validation**
Use the exported `CONTEXT_TYPES` array from `lib/types/context-type.ts`:
```typescript
import { CONTEXT_TYPES } from '@/lib/types/context-type'

if (!CONTEXT_TYPES.includes(type as ContextType)) {
  return error
}
```

### 2. **Add Type Guards**
Create helper functions:
```typescript
export function isValidContextType(value: string): value is ContextType {
  return CONTEXT_TYPES.includes(value as ContextType)
}
```

### 3. **Document Mapping Pattern**
The pattern `ContextType → Model Name → Prisma Model` should be clearly documented as the canonical way to work with CompanyX models.

### 4. **Consider Type-Safe Routes**
Instead of string-based route segments, consider type-safe route generation:
```typescript
export function getCompanyXRoute(type: ContextType, id: string): string {
  const segment = CONTEXT_TYPE_TO_ROUTE[type]
  return `/mycompany/workforcestuff/${segment}/${id}`
}
```

---

## Summary

`ContextType` is a **well-architected type system** that:
- ✅ Provides type safety without database constraints
- ✅ Serves as a clean abstraction layer
- ✅ Enables AI-based type inference
- ✅ Supports flexible routing and mapping
- ✅ Is NOT tied to legacy WorkContext models

The main improvement opportunity is **standardizing validation** across all API routes to use the exported `CONTEXT_TYPES` array consistently.

---

**Last Updated:** 2025-01-XX

