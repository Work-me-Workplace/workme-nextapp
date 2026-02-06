# CompanyX Ingest & Hydration Status

**Date:** 2026-02-05  
**Status:** Active Implementation

---

## Overview

The CompanyX ingest system allows users to ingest raw text content (from emails, articles, etc.) and convert it into structured CompanyX models (Training, Career, Event, Campaign, etc.) through a two-stage process:

1. **Stage 1: Ingest** - Create a CompanyX record with raw text stored
2. **Stage 2: Hydrate & Save** - Parse raw text into structured data and save

---

## Current Architecture

### Stage 1: Ingest (Create with Raw Text)

**Purpose:** Create a CompanyX record with only `ingestRawText` populated. All other fields remain null until Stage 2.

**Endpoints:**

1. **`POST /api/workstuff/ingest/[type]/create`** - Generic endpoint for all CompanyX types
   - **File:** `app/api/workstuff/ingest/[type]/create/route.ts`
   - **Supported Types:** `training`, `career`, `event`, `campaign`, `impact_event`, `community`, `benefits`, `employee_cause`, `leader_engagement`
   - **Input:** `{ rawText: string, companyId: string }`
   - **Output:** `{ success: true, redirectTo: string, [modelName]: record, [idField]: id }`
   - **Auto-parses** for `training` and `impact_event` types (includes `model` in response)

2. **`POST /api/workstuff/ingest/training-create`** - Training-specific create (one-shot)
   - **File:** `app/api/workstuff/ingest/training-create/route.ts`
   - **Input:** Full training data + optional `ingestRawText`
   - **Output:** Creates training immediately (no Stage 2 needed)

**Service Layer:**
- **`lib/services/companyx-mapper.ts`** - `createCompanyXWithIngest()` function
  - Creates record with `ingestRawText` stored
  - Sets `ingestType`, `ingestStatus`, `ingestCreatedAt` for training type
  - Returns created record with type metadata

---

### Stage 2: Hydrate (Parse Raw Text)

**Purpose:** Parse `ingestRawText` into structured data. **Read-only operation** - no DB writes.

**Endpoints:**

1. **`POST /api/workstuff/ingest/training-hydrate`** ✅ **EXISTS**
   - **File:** `app/api/workstuff/ingest/training-hydrate/route.ts`
   - **Input:** `{ trainingId: string }`
   - **Output:** `{ success: true, model: TrainingModel }`
   - **Logic:** Loads training by ID, reads `ingestRawText`, calls `parseTraining()`, returns structured model

2. **`POST /api/workstuff/ingest/career-hydrate`** ✅ **EXISTS**
   - **File:** `app/api/workstuff/ingest/career-hydrate/route.ts`
   - Similar pattern to training-hydrate

3. **`POST /api/workstuff/ingest/impact-event-hydrate`** ✅ **EXISTS**
   - **File:** `app/api/workstuff/ingest/impact-event-hydrate/route.ts`

**Generic Parse Endpoint:**

4. **`POST /api/workstuff/ingest/[type]/parse`** ✅ **EXISTS**
   - **File:** `app/api/workstuff/ingest/[type]/parse/route.ts`
   - **Input:** `{ rawText: string }` (no ID needed - pure parse)
   - **Output:** `{ success: true, model: ParsedCompanyXData }`
   - **Use Case:** Parse without creating a record first

**Service Layer:**
- **`lib/services/companyx-unified-mapper.ts`** - `parseCompanyXContent()` function
  - Routes to type-specific parsers:
    - `parseTraining()` → `lib/services/training-parser-service.ts`
    - `parseCareer()` → `lib/services/career-parser-service.ts`
    - `parseEvent()` → `lib/services/event-mapper-service.ts`
    - etc.

---

### Stage 2: Save (Update with Parsed Data)

**Purpose:** Update CompanyX record with parsed structured data. Sets `ingestStatus = 'saved'`.

**Endpoints:**

1. **`POST /api/workstuff/ingest/training-save`** ✅ **EXISTS**
   - **File:** `app/api/workstuff/ingest/training-save/route.ts`
   - **Input:** `{ trainingId: string, ...TrainingModel fields }`
   - **Output:** `{ success: true, trainingId: string, training: updated }`
   - **Logic:** Updates all training fields, preserves ingest metadata

2. **`POST /api/workstuff/ingest/career-save`** ✅ **EXISTS**
   - Similar pattern

3. **`POST /api/workstuff/ingest/impact-event-save`** ✅ **EXISTS**

**Alternative: Unified Save Endpoint:**

4. **`POST /api/workforcestuff/save`** ✅ **EXISTS**
   - **File:** `app/api/workforcestuff/save/route.ts`
   - **Input:** `{ type: ContextType, rawText: string }`
   - **Output:** `{ success: true, id: string, type: string, redirectTo: string }`
   - **Logic:** Does all 3 stages in one call:
     1. Creates CompanyX with ingest snapshot
     2. Parses content
     3. Saves parsed data
   - **Use Case:** One-shot ingest for simpler flows

---

## Current Flow Examples

### Flow 1: Two-Stage Ingest (Training)

```
1. User pastes raw text → POST /api/workstuff/ingest/training/create
   → Creates CompanyTraining with ingestRawText only
   → Redirects to /mycompany/workforcestuff/training/ingest/[trainingId]

2. Page loads → POST /api/workstuff/ingest/training-hydrate
   → Parses ingestRawText → Returns structured TrainingModel
   → User edits form fields

3. User clicks Save → POST /api/workstuff/ingest/training-save
   → Updates all fields → Sets ingestStatus = 'saved'
   → Redirects to detail page
```

### Flow 2: One-Shot Ingest

```
User pastes raw text → POST /api/workforcestuff/save
  → Creates CompanyX with ingestRawText
  → Parses content immediately
  → Saves parsed data
  → Returns redirectTo URL
```

### Flow 3: Parse-Only (No DB Write)

```
User wants to preview parsed data → POST /api/workstuff/ingest/[type]/parse
  → Returns structured model
  → No database record created
```

---

## ✅ What's Working

1. **Ingest Endpoints** - All CompanyX types supported via `[type]/create`
2. **Hydrate Endpoints** - Training, Career, Impact Event have dedicated hydrate endpoints
3. **Parse Endpoint** - Generic `[type]/parse` works for all types
4. **Save Endpoints** - Training, Career, Impact Event have dedicated save endpoints
5. **Unified Save** - `/api/workforcestuff/save` handles all types in one shot
6. **Service Layer** - Modular parsers for each CompanyX type

---

## ⚠️ Gaps & Missing Pieces

### 1. Hydrate Endpoints Missing for Some Types

**Current Status:**
- ✅ `training-hydrate` - EXISTS
- ✅ `career-hydrate` - EXISTS  
- ✅ `impact-event-hydrate` - EXISTS
- ❌ `event-hydrate` - MISSING
- ❌ `campaign-hydrate` - MISSING
- ❌ `community-hydrate` - MISSING
- ❌ `benefits-hydrate` - MISSING
- ❌ `employee-cause-hydrate` - MISSING
- ❌ `leader-engagement-hydrate` - MISSING

**Workaround:** Use generic `[type]/parse` endpoint, but requires passing `rawText` instead of just `id`.

**Recommendation:** Create hydrate endpoints for remaining types OR make `[type]/parse` accept `{ id: string }` as alternative to `{ rawText: string }`.

### 2. Save Endpoints Missing for Some Types

**Current Status:**
- ✅ `training-save` - EXISTS
- ✅ `career-save` - EXISTS
- ✅ `impact-event-save` - EXISTS
- ❌ `event-save` - MISSING
- ❌ `campaign-save` - MISSING
- ❌ `community-save` - MISSING
- ❌ `benefits-save` - MISSING
- ❌ `employee-cause-save` - MISSING
- ❌ `leader-engagement-save` - MISSING

**Workaround:** Use `/api/workforcestuff/save` which handles all types, but doesn't support the two-stage review/edit flow.

### 3. Ingest Pages Missing for Some Types

**Current Status:**
- ✅ `/mycompany/workforcestuff/training/ingest/[trainingId]` - EXISTS
- ✅ `/mycompany/workforcestuff/career/ingest/[careerId]` - EXISTS
- ❌ Other types - MISSING (no review/edit UI)

**Impact:** Users can't review/edit parsed data before saving for most types.

---

## 🔧 Can We Hydrate Using API?

**YES!** ✅ Hydration via API is fully supported:

### Option 1: Hydrate by ID (Training, Career, Impact Event)

```typescript
// POST /api/workstuff/ingest/training-hydrate
const response = await api.post('/api/workstuff/ingest/training-hydrate', {
  trainingId: 'clxxx...'
})
// Returns: { success: true, model: TrainingModel }
```

### Option 2: Parse Raw Text (All Types)

```typescript
// POST /api/workstuff/ingest/[type]/parse
const response = await api.post('/api/workstuff/ingest/training/parse', {
  rawText: 'Training announcement text...'
})
// Returns: { success: true, model: TrainingModel }
```

### Option 3: Unified Save (All Types - One Shot)

```typescript
// POST /api/workforcestuff/save
const response = await api.post('/api/workforcestuff/save', {
  type: 'training',
  rawText: 'Training announcement text...'
})
// Returns: { success: true, id: string, redirectTo: string }
// Does: Create → Parse → Save in one call
```

---

## 📋 Recommendations

### Short Term

1. **Extend `[type]/parse` to accept ID** - Allow `{ id: string }` as alternative to `{ rawText: string }`
   - This would make it work like hydrate endpoints for all types
   - File: `app/api/workstuff/ingest/[type]/parse/route.ts`

2. **Document API usage** - Create API docs showing all three hydration options

### Medium Term

3. **Create hydrate endpoints for remaining types** - For consistency with training/career/impact-event pattern

4. **Create save endpoints for remaining types** - To support two-stage review/edit flow

5. **Create ingest pages for remaining types** - So users can review/edit parsed data

### Long Term

6. **Consider consolidating** - Decide if we want:
   - Pattern A: Dedicated endpoints per type (current for training/career/impact-event)
   - Pattern B: Generic `[type]/*` endpoints (current for parse, but not hydrate/save)
   - Pattern C: Unified `/api/workforcestuff/save` for everything

---

## 📚 Related Files

### API Routes
- `app/api/workstuff/ingest/[type]/create/route.ts` - Stage 1: Create
- `app/api/workstuff/ingest/[type]/parse/route.ts` - Stage 2: Parse
- `app/api/workstuff/ingest/training-hydrate/route.ts` - Stage 2: Hydrate (Training)
- `app/api/workstuff/ingest/training-save/route.ts` - Stage 2: Save (Training)
- `app/api/workforcestuff/save/route.ts` - Unified: Create+Parse+Save

### Services
- `lib/services/companyx-mapper.ts` - `createCompanyXWithIngest()`
- `lib/services/companyx-unified-mapper.ts` - `parseCompanyXContent()`
- `lib/services/training-parser-service.ts` - `parseTraining()`
- `lib/services/companyx-save-handlers.ts` - `saveCompanyX()`

### UI Pages
- `app/mycompany/workforcestuff/training/ingest/[trainingId]/page.tsx` - Training review/edit
- `app/mycompany/workforcestuff/career/ingest/[careerId]/page.tsx` - Career review/edit
- `app/mycompany/workforcestuff/ingest/page.tsx` - Generic ingest page

---

## 🎯 Summary

**Current State:**
- ✅ Ingest (Stage 1) - Fully working for all CompanyX types
- ✅ Hydrate (Stage 2) - Working for Training, Career, Impact Event; can use parse endpoint for others
- ✅ Save (Stage 2) - Working for Training, Career, Impact Event; can use unified save for others
- ✅ Unified Save - Works for all types (one-shot flow)

**Answer to "Can we hydrate using API?":**
**YES!** ✅ Three options available:
1. Dedicated hydrate endpoints (training/career/impact-event)
2. Generic parse endpoint (all types)
3. Unified save endpoint (all types, one-shot)

**Missing:**
- Hydrate/save endpoints for remaining 6 CompanyX types (event, campaign, community, benefits, employee-cause, leader-engagement)
- Ingest review/edit pages for remaining types
