# WorkSupport Forensic Architecture Audit

**Date:** 2025-01-24  
**Purpose:** Complete diagnostic mapping of WorkSupport system, its dependencies, and breaking points after WorkContext → WorkEvent refactor

---

## EXECUTIVE SUMMARY

The WorkSupport system was originally built to be a **support container** that sat between WorkContext and WorkOutput. It has been partially migrated to use `WorkEventRouter` instead of `WorkContext`, but critical breaking points remain:

1. **Route paths still use `[contextId]`** - but this is actually an `eventRouterId` now
2. **UI components reference `contextId`** - causing confusion and potential bugs
3. **WorkOutput still has `contextId` field** - but schema shows it's been renamed to `eventRouterId`
4. **Support pages call `getWorkContext()`** - which is now an alias for `getWorkEventRouter()`
5. **Output builder references `workOutput.contextId`** - which may not exist in new schema

---

## STEP 1 — ALL LOCATIONS WHERE WorkSupport IS USED

### 1.1 Server Actions

**File:** `lib/actions/work-support.ts`

**Functions:**
- `createWorkSupport()` - Creates WorkSupport linked to `eventRouterId` (line 40)
- `updateWorkSupport()` - Updates WorkSupport (line 98)
- `getWorkSupport()` - Gets WorkSupport by ID (line 145)
- `getWorkSupportByContext()` - Gets WorkSupport by `eventRouterId` (line 177) - **NOTE: Function name says "ByContext" but uses eventRouterId**
- `deleteWorkSupport()` - Deletes WorkSupport (line 217)

**Purpose:** Core CRUD operations for WorkSupport  
**Role in Old Architecture:** WorkSupport was the container between WorkContext and WorkOutput  
**Current State:** ✅ **MIGRATED** - Uses `eventRouterId` instead of `contextId`

---

### 1.2 API Routes

**File:** `app/api/worksupport/route.ts`
- `GET /api/worksupport` - Lists all WorkSupport records (line 9)
- `POST /api/worksupport` - Creates WorkSupport (line 51) - **NOTE: Currently just returns message, delegates to server action**

**File:** `app/api/worksupport/[id]/route.ts`
- `GET /api/worksupport/[id]` - Gets single WorkSupport (line 7)
- `PUT /api/worksupport/[id]` - Updates WorkSupport (line 56) - **NOTE: Currently just returns message, delegates to server action**
- `DELETE /api/worksupport/[id]` - Deletes WorkSupport (line 89) - **NOTE: Currently just returns message, delegates to server action**

**Purpose:** REST API endpoints for WorkSupport  
**Role in Old Architecture:** Provided HTTP interface to WorkSupport operations  
**Current State:** ⚠️ **PARTIALLY MIGRATED** - API routes exist but delegate to server actions

---

### 1.3 Components/Pages Under Support Paths

**File:** `app/mywork/support/[contextId]/page.tsx`
- **Path:** `/mywork/support/[contextId]`
- **Purpose:** Main WorkSupport detail page showing selected outputs and created outputs
- **Key Issues:**
  - Route param is named `contextId` but is actually `eventRouterId` (line 17)
  - Calls `getWorkContext(contextId, ...)` which is now alias for `getWorkEventRouter()` (line 41)
  - Creates outputs with `eventRouterId: contextId` (line 72) - **confusing naming**
  - Links back to `/mywork/context/${contextId}` (line 126) - **may break if contextId doesn't map correctly**

**File:** `app/mywork/support/[contextId]/setup/page.tsx`
- **Path:** `/mywork/support/[contextId]/setup`
- **Purpose:** Setup page to select which WorkOutput types are needed
- **Key Issues:**
  - Route param is named `contextId` but is actually `eventRouterId` (line 13)
  - Calls `getWorkContext(contextId, ...)` (line 39)
  - Creates WorkSupport with `eventRouterId: contextId` (line 90) - **confusing naming**
  - Links back to `/mywork/context/${contextId}` (line 140, 205)

**File:** `app/(authenticated)/worksupport/page.tsx`
- **Path:** `/worksupport`
- **Purpose:** List page showing all WorkContexts (but should show WorkEventRouters)
- **Key Issues:**
  - Calls `/api/context` which returns WorkEventRouters (line 31)
  - Links to `/mywork/support/${context.id}` (line 89) - **using context.id as if it's contextId**

**File:** `app/(authenticated)/worksupport/[workSupportId]/page.tsx`
- **Path:** `/worksupport/[workSupportId]`
- **Purpose:** Detail page for WorkSupport by ID (not by contextId)
- **Key Issues:**
  - Uses `getWorkSupport(workSupportId)` directly (line 34)
  - This is a different pattern than the `/mywork/support/[contextId]` pages

**Purpose:** UI pages for managing WorkSupport  
**Role in Old Architecture:** Provided user interface for WorkSupport workflows  
**Current State:** ⚠️ **BROKEN** - Route params use `contextId` name but expect `eventRouterId` values

---

### 1.4 Imports of WorkSupport Functions

**Files importing `createWorkSupport`:**
- `app/mywork/support/[contextId]/setup/page.tsx` (line 7)

**Files importing `updateWorkSupport`:**
- `app/mywork/support/[contextId]/setup/page.tsx` (line 7)

**Files importing `getWorkSupport`:**
- `app/(authenticated)/worksupport/[workSupportId]/page.tsx` (line 7)

**Files importing `getWorkSupportByContext`:**
- `app/mywork/support/[contextId]/page.tsx` (line 7)
- `app/mywork/support/[contextId]/setup/page.tsx` (line 7)

**Files importing `listWorkSupports`:**
- ❌ **NONE** - No function exists with this name

**Purpose:** Client-side usage of WorkSupport operations  
**Current State:** ✅ **FUNCTIONAL** - Functions work but naming is confusing

---

### 1.5 UI Elements Taking "supportId"

**File:** `app/mywork/support/[contextId]/page.tsx`
- Line 73: Creates WorkOutput with `supportId: workSupport.id`

**File:** `lib/actions/work-output.ts`
- Line 11: Schema accepts `supportId: z.string().optional().nullable()`
- Line 32-42: Validates supportId if provided
- Line 50: Creates WorkOutput with `supportId: validated.supportId`

**File:** `app/mywork/outputs/builder/[outputId]/page.tsx`
- Line 104: Checks `workOutput.supportId` to determine back link
- Line 169: Checks `output.supportId` to determine back link

**Purpose:** Links WorkOutput to WorkSupport  
**Current State:** ✅ **FUNCTIONAL** - WorkOutput can optionally link to WorkSupport

---

### 1.6 Business Logic Branching on Support Status

**File:** `app/mywork/support/[contextId]/page.tsx`
- Line 155-161: Displays status badge (draft, in_progress, complete)

**File:** `app/mywork/support/[contextId]/setup/page.tsx`
- Line 79: Sets status to 'in_progress' if outputs selected, 'draft' otherwise

**File:** `lib/actions/work-support.ts`
- Line 37: Schema validates status as 'draft' | 'in_progress' | 'complete'
- Line 123: Update function accepts status changes

**Purpose:** Workflow state management  
**Current State:** ✅ **FUNCTIONAL** - Status field works correctly

---

### 1.7 Mapping of WorkOutput → supportId

**File:** `lib/actions/work-output.ts`
- Line 44-45: If supportId provided, uses support's `eventRouterId` for WorkOutput
- Line 49: Creates WorkOutput with both `eventRouterId` and `supportId`
- Line 64-70: Updates WorkSupport.assets array with new output ID

**File:** `prisma/schema.prisma`
- Line 682-683: WorkOutput has optional `supportId` field

**Purpose:** Links outputs to their support container  
**Current State:** ✅ **FUNCTIONAL** - WorkOutput can belong to WorkSupport

---

### 1.8 Legacy Mapping WorkSupport → contextId

**File:** `prisma/schema.prisma`
- Line 647-648: WorkSupport has `eventRouterId` (NOT `contextId`) - **ALREADY MIGRATED**

**File:** `lib/actions/work-support.ts`
- Line 32: Schema uses `eventRouterId` (NOT `contextId`) - **ALREADY MIGRATED**

**File:** `app/mywork/support/[contextId]/page.tsx`
- Line 17: Route param named `contextId` but used as `eventRouterId` - **NAMING MISMATCH**

**File:** `app/mywork/support/[contextId]/setup/page.tsx`
- Line 13: Route param named `contextId` but used as `eventRouterId` - **NAMING MISMATCH**

**Purpose:** WorkSupport's parent anchor  
**Current State:** ⚠️ **SCHEMA MIGRATED, ROUTES NOT** - Schema uses `eventRouterId` but routes still use `contextId` name

---

## STEP 2 — ALL DEPENDENCIES OF WorkSupport

### 2.1 How WorkSupport Referenced WorkContext (OLD)

**Original Architecture:**
```prisma
model WorkSupport {
  contextId String
  context   WorkContext @relation(fields: [contextId], references: [id])
  @@unique([contextId]) // One WorkSupport per WorkContext
}
```

**Current Architecture:**
```prisma
model WorkSupport {
  eventRouterId String
  eventRouter   WorkEventRouter @relation(fields: [eventRouterId], references: [id])
  @@unique([eventRouterId]) // One WorkSupport per WorkEventRouter
}
```

**Migration Status:** ✅ **SCHEMA MIGRATED** - `contextId` → `eventRouterId`, `WorkContext` → `WorkEventRouter`

---

### 2.2 How WorkOutput Referenced WorkSupport

**Current Architecture:**
```prisma
model WorkOutput {
  eventRouterId String?
  eventRouter   WorkEventRouter? @relation(...)
  
  supportId String?
  support   WorkSupport? @relation(fields: [supportId], references: [id])
}
```

**Relationship:** WorkOutput can optionally belong to WorkSupport. If `supportId` is provided, WorkOutput also gets the support's `eventRouterId`.

**Current State:** ✅ **FUNCTIONAL** - WorkOutput can link to WorkSupport

---

### 2.3 UI Flows Assumed WorkContext → WorkSupport → WorkOutput

**Old Flow:**
1. User creates WorkContext
2. User creates WorkSupport for that WorkContext
3. User selects output types in WorkSupport
4. User creates WorkOutputs linked to WorkSupport
5. WorkOutputs are grouped by WorkSupport

**Current Flow (After Migration):**
1. User creates WorkEvent (or other typed context)
2. System creates WorkEventRouter
3. User creates WorkSupport for that WorkEventRouter
4. User selects output types in WorkSupport
5. User creates WorkOutputs linked to WorkSupport
6. WorkOutputs are grouped by WorkSupport

**Breaking Point:** Step 1-2 changed, but steps 3-6 still work the same way

---

### 2.4 Logic Assuming "One Support Per Context"

**File:** `lib/actions/work-support.ts`
- Line 49-58: Checks if WorkSupport already exists for `eventRouterId`
- Line 57: Returns error if WorkSupport already exists

**File:** `prisma/schema.prisma`
- Line 664: `@@unique([eventRouterId])` - Enforces one WorkSupport per WorkEventRouter

**Assumption:** One WorkSupport per WorkEventRouter (previously one per WorkContext)  
**Current State:** ✅ **ENFORCED** - Unique constraint still works

---

### 2.5 Workflows Assuming "Support is the Parent Container"

**File:** `app/mywork/support/[contextId]/page.tsx`
- Line 67-88: Creates WorkOutputs with `supportId: workSupport.id`
- Line 102-103: Displays `workSupport.selectedOutputs` and `workSupport.outputs`

**File:** `lib/actions/work-output.ts`
- Line 64-70: Updates WorkSupport.assets array when output is created

**Assumption:** WorkSupport is the container that groups outputs  
**Current State:** ✅ **STILL VALID** - WorkSupport still functions as output container

---

### 2.6 Architecture Diagram (OLD)

```
┌─────────────────┐
│   WorkContext   │
│   (Campaign,    │
│    Event, etc.) │
└────────┬────────┘
         │
         │ 1:1 (unique)
         │
┌────────▼────────┐
│  WorkSupport    │
│  - selectedOutputs│
│  - status        │
│  - evolvingInfo  │
└────────┬────────┘
         │
         │ 1:many
         │
┌────────▼────────┐
│   WorkOutput    │
│   - outputType  │
│   - dataJson    │
└─────────────────┘
```

---

### 2.7 Architecture Diagram (CURRENT - PARTIALLY MIGRATED)

```
┌─────────────────┐
│  WorkEvent      │
│  (or Campaign,  │
│   Training, etc)│
└────────┬────────┘
         │
         │ 1:1
         │
┌────────▼────────┐
│ WorkEventRouter │
│  - type         │
│  - eventRefId   │
└────────┬────────┘
         │
         │ 1:1 (unique)
         │
┌────────▼────────┐
│  WorkSupport    │
│  - selectedOutputs│
│  - status        │
│  - evolvingInfo  │
└────────┬────────┘
         │
         │ 1:many
         │
┌────────▼────────┐
│   WorkOutput    │
│   - outputType  │
│   - dataJson    │
│   - eventRouterId│
│   - supportId?   │
└─────────────────┘
```

**Key Change:** WorkContext removed, WorkEventRouter inserted as routing layer

---

## STEP 3 — REMAINING LEGACY CONTEXT REFERENCES

### 3.1 Route Parameters Named "contextId"

**File:** `app/mywork/support/[contextId]/page.tsx`
- Line 17: `const contextId = params.contextId as string`
- Line 41: `getWorkContext(contextId, clientWorkMeId)` - **Function name says "Context" but accepts eventRouterId**
- Line 42: `getWorkSupportByContext(contextId)` - **Function name says "ByContext" but uses eventRouterId**
- Line 72: `eventRouterId: contextId` - **Variable named contextId but used as eventRouterId**
- Line 104: `workOutput.contextId` - **May not exist in schema**

**File:** `app/mywork/support/[contextId]/setup/page.tsx`
- Line 13: `const contextId = params.contextId as string`
- Line 39: `getWorkContext(contextId, clientWorkMeId)`
- Line 40: `getWorkSupportByContext(contextId)`
- Line 90: `eventRouterId: contextId` - **Variable named contextId but used as eventRouterId**

**Issue:** Route param is named `contextId` but contains `eventRouterId` value. This causes confusion and potential bugs.

---

### 3.2 Function Names Containing "Context"

**File:** `lib/actions/work-support.ts`
- Line 177: `getWorkSupportByContext(eventRouterId: string)` - **Function name says "ByContext" but parameter is eventRouterId**

**File:** `lib/actions/work-output.ts`
- Line 283: `getWorkOutputsByContext(contextId: string)` - **Function name says "ByContext" but uses eventRouterId internally**

**File:** `lib/server/get-work-context.ts`
- Line 83: `export const getWorkContext = getWorkEventRouter` - **Legacy alias**

**Issue:** Function names reference "Context" but actually work with WorkEventRouter. This is misleading.

---

### 3.3 WorkOutput.contextId References

**File:** `app/mywork/outputs/builder/[outputId]/page.tsx`
- Line 104: `href={workOutput.supportId ? `/mywork/support/${workOutput.contextId}` : `/mywork/context/${workOutput.contextId}`}`
- Line 169: `href={output.supportId ? `/mywork/support/${output.contextId}` : `/mywork/context/${output.contextId}`}`

**Schema Check:**
```prisma
model WorkOutput {
  eventRouterId String?  // ✅ EXISTS
  contextId String?      // ❌ DOES NOT EXIST
}
```

**Issue:** Code references `workOutput.contextId` but schema only has `eventRouterId`. This will cause runtime errors.

---

### 3.4 Router Logic Linking Support to contextRefId

**File:** `app/(authenticated)/worksupport/page.tsx`
- Line 31: Calls `/api/context` which returns WorkEventRouters
- Line 89: Links to `/mywork/support/${context.id}` - **Uses router ID correctly**

**File:** `app/mywork/context/[contextId]/success/page.tsx`
- Line 117: `router.push(`/mywork/support/${contextId}/setup`)` - **contextId is actually eventRouterId**
- Line 120: `router.push(`/mywork/support/${contextId}`)` - **contextId is actually eventRouterId**

**Issue:** Router logic works but uses confusing variable names.

---

### 3.5 Summary of Invalid Assumptions

| Location | Assumption | Reality | Status |
|----------|-----------|---------|--------|
| Route params `[contextId]` | Contains WorkContext ID | Contains WorkEventRouter ID | ⚠️ NAMING MISMATCH |
| `getWorkContext()` | Returns WorkContext | Returns WorkEventRouter | ⚠️ MISLEADING NAME |
| `getWorkSupportByContext()` | Takes contextId | Takes eventRouterId | ⚠️ MISLEADING NAME |
| `workOutput.contextId` | Field exists | Field doesn't exist | ❌ BROKEN |
| Support pages | Work with WorkContext | Work with WorkEventRouter | ⚠️ WORKS BUT CONFUSING |

---

## STEP 4 — WHAT NOW BREAKS AFTER EVENT REFACTOR

### 4.1 Broken Assumptions

#### ❌ **CRITICAL: workOutput.contextId Does Not Exist**

**Location:** `app/mywork/outputs/builder/[outputId]/page.tsx` (lines 104, 169)

**Error:** Code references `workOutput.contextId` but schema only has `eventRouterId`

**Impact:** Runtime error when trying to access `workOutput.contextId` - will be `undefined`

**Fix Required:** Change to `workOutput.eventRouterId`

---

#### ⚠️ **ROUTE PARAM NAMING MISMATCH**

**Location:** All `/mywork/support/[contextId]/*` routes

**Error:** Route param named `contextId` but contains `eventRouterId` value

**Impact:** Confusing for developers, potential bugs if code assumes it's a WorkContext ID

**Fix Required:** Rename route param to `[eventRouterId]` or `[routerId]`

---

#### ⚠️ **FUNCTION NAME MISMATCH**

**Location:** `getWorkSupportByContext()`, `getWorkOutputsByContext()`, `getWorkContext()`

**Error:** Function names reference "Context" but work with WorkEventRouter

**Impact:** Misleading for developers, but functionally works

**Fix Required:** Rename functions or add deprecation warnings

---

#### ⚠️ **BACK LINKS MAY BREAK**

**Location:** `app/mywork/support/[contextId]/page.tsx` (line 126)

**Error:** Links to `/mywork/context/${contextId}` - but `contextId` is actually `eventRouterId`

**Impact:** May work if `/mywork/context/[id]` accepts WorkEventRouter IDs, but confusing

**Fix Required:** Verify that `/mywork/context/[id]` accepts WorkEventRouter IDs, or update links

---

### 4.2 What Still Works

#### ✅ **WorkSupport Schema Migration**

**Status:** Schema correctly uses `eventRouterId` and `WorkEventRouter` relation

**Impact:** Database layer is correct

---

#### ✅ **WorkSupport CRUD Operations**

**Status:** Server actions correctly use `eventRouterId`

**Impact:** Create, read, update, delete operations work

---

#### ✅ **WorkOutput → WorkSupport Relationship**

**Status:** WorkOutput can link to WorkSupport via `supportId`

**Impact:** Output grouping by support still works

---

#### ✅ **One Support Per Router**

**Status:** Unique constraint enforces one WorkSupport per WorkEventRouter

**Impact:** Business logic constraint still enforced

---

### 4.3 Exact Breaking Points

1. **Runtime Error:** `workOutput.contextId` access will return `undefined`
   - **File:** `app/mywork/outputs/builder/[outputId]/page.tsx`
   - **Lines:** 104, 169
   - **Severity:** ❌ **CRITICAL**

2. **Route Confusion:** Route params named `contextId` but contain `eventRouterId`
   - **Files:** All support route pages
   - **Severity:** ⚠️ **MEDIUM** (works but confusing)

3. **Function Name Confusion:** Functions named with "Context" but work with routers
   - **Files:** Multiple action files
   - **Severity:** ⚠️ **LOW** (works but misleading)

---

## STEP 5 — WHERE WorkSupport COULD STILL BE USEFUL

### 5.1 Files/Components That Can Be Repointed to SupportSession Logic

**File:** `app/mywork/support/[contextId]/page.tsx`
- **Current:** Shows WorkSupport for a WorkEventRouter
- **Future:** Could become "SupportSession" that groups multiple product requests
- **Value:** UI already exists and works well for grouping outputs

**File:** `app/mywork/support/[contextId]/setup/page.tsx`
- **Current:** Setup page for selecting output types
- **Future:** Could become "SupportSession Setup" for selecting products
- **Value:** Setup flow is useful for configuring what products are needed

**File:** `lib/actions/work-support.ts`
- **Current:** CRUD operations for WorkSupport
- **Future:** Could be repurposed for SupportSession operations
- **Value:** Business logic for grouping and status management is solid

---

### 5.2 Support Flows That Are Still Conceptually Useful

**Selected Outputs Flow:**
- User selects which output types they need
- System tracks which outputs have been created
- **Value:** ✅ **USEFUL** - Helps users plan what products to create

**Status Workflow:**
- draft → in_progress → complete
- **Value:** ✅ **USEFUL** - Tracks progress of support session

**Assets Tracking:**
- WorkSupport.assets array tracks created output IDs
- **Value:** ✅ **USEFUL** - Links outputs back to their support session

**Evolving Info:**
- WorkSupport.evolvingInfo stores RSVP lists, notes, etc.
- **Value:** ✅ **USEFUL** - Flexible storage for session-specific data

---

### 5.3 Places Where Grouping Outputs/Products Makes Sense

**WorkEvent Support:**
- Multiple outputs needed for a single event
- Group by event via WorkEventRouter
- **Value:** ✅ **MAKES SENSE** - Events need multiple products

**Campaign Support:**
- Multiple outputs needed for a campaign
- Group by campaign via WorkEventRouter
- **Value:** ✅ **MAKES SENSE** - Campaigns need multiple products

**Training Support:**
- Multiple outputs needed for training
- Group by training via WorkEventRouter
- **Value:** ✅ **MAKES SENSE** - Training needs multiple products

---

### 5.4 Places Where Workflow Status Still Matters

**Support Session Status:**
- `draft` - Planning phase, outputs not yet selected
- `in_progress` - Outputs selected, some created
- `complete` - All outputs created and finalized
- **Value:** ✅ **USEFUL** - Tracks session progress

**Output Status:**
- `draft` - Output being worked on
- `final` - Output completed
- **Value:** ✅ **USEFUL** - Tracks individual output progress

---

### 5.5 Summary: What Should Survive

| Component | Should Survive? | Reason |
|-----------|----------------|--------|
| WorkSupport model | ✅ **YES** | Core container concept is useful |
| Selected outputs flow | ✅ **YES** | Helps users plan products |
| Status workflow | ✅ **YES** | Tracks progress |
| Assets tracking | ✅ **YES** | Links outputs to session |
| Evolving info | ✅ **YES** | Flexible data storage |
| Support UI pages | ✅ **YES** | Good UX for grouping |
| Support CRUD actions | ✅ **YES** | Solid business logic |
| Route param naming | ❌ **NO** | Should be renamed |
| Function naming | ⚠️ **MAYBE** | Should be clarified |

---

## STEP 6 — DIAGRAM OF CURRENT (BROKEN) SYSTEM

### Diagram 1: Old Architecture (WorkContext → WorkSupport → WorkOutput)

```
┌─────────────────────────────────────────────────────────┐
│                    OLD ARCHITECTURE                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────┐
│  WorkContext    │  (Campaign, Event, Training, etc.)
│  - id           │
│  - type         │
│  - typed data   │
└────────┬────────┘
         │
         │ 1:1 (unique constraint)
         │ contextId
         │
┌────────▼────────┐
│  WorkSupport    │
│  - id           │
│  - contextId    │  ← Links to WorkContext
│  - selectedOutputs│
│  - status       │
│  - evolvingInfo │
│  - assets       │
└────────┬────────┘
         │
         │ 1:many
         │ supportId
         │
┌────────▼────────┐
│   WorkOutput    │
│   - id          │
│   - contextId   │  ← Optional link to WorkContext
│   - supportId   │  ← Optional link to WorkSupport
│   - outputType  │
│   - dataJson    │
└─────────────────┘

FLOW:
1. Create WorkContext
2. Create WorkSupport (one per context)
3. Select outputs in WorkSupport
4. Create WorkOutputs linked to WorkSupport
5. Outputs grouped by WorkSupport
```

---

### Diagram 2: New Architecture (WorkEvent → EventItem/PromotionalWorkItem → Outputs)

```
┌─────────────────────────────────────────────────────────┐
│                 NEW ARCHITECTURE (INTENDED)              │
└─────────────────────────────────────────────────────────┘

┌─────────────────┐
│   WorkEvent      │  (Event container)
│   - id           │
│   - title        │
│   - dates        │
└────────┬────────┘
         │
         │ 1:many
         │
┌────────▼────────┐      ┌──────────────────┐
│   EventItem     │      │PromotionalWorkItem│
│   - id           │      │  - id             │
│   - eventId      │      │  - eventId        │
│   - title        │      │  - title          │
└──────────────────┘      └──────────────────┘
         │
         │
         │ (via WorkEventRouter)
         │
┌────────▼────────┐
│WorkEventRouter  │  (Routing layer)
│  - id           │
│  - type: "event"│
│  - eventRefId   │  ← Links to WorkEvent.id
└────────┬────────┘
         │
         │ 1:1 (unique constraint)
         │ eventRouterId
         │
┌────────▼────────┐
│  WorkSupport    │  ← DANGLING: Still uses old pattern
│  - id           │
│  - eventRouterId│  ← Links to WorkEventRouter
│  - selectedOutputs│
│  - status       │
└────────┬────────┘
         │
         │ 1:many
         │ supportId
         │
┌────────▼────────┐
│   WorkOutput    │
│   - id          │
│   - eventRouterId│  ← Links to WorkEventRouter
│   - supportId?  │  ← Optional link to WorkSupport
│   - outputType  │
└─────────────────┘

FLOW (INTENDED):
1. Create WorkEvent + EventItems
2. System creates WorkEventRouter
3. Create WorkSupport for WorkEventRouter (optional)
4. Create WorkOutputs linked to WorkEventRouter or WorkSupport

ISSUE:
- WorkSupport still assumes "one support per router" pattern
- Should eventually become "SupportSession" that groups multiple requests
- EventItem/PromotionalWorkItem not yet integrated with WorkSupport
```

---

### Diagram 3: Where Old Support Code is Dangling

```
┌─────────────────────────────────────────────────────────┐
│              CURRENT STATE (BROKEN POINTS)                │
└─────────────────────────────────────────────────────────┘

✅ WORKING:
┌─────────────────┐
│  WorkEvent      │
└────────┬────────┘
         │
┌────────▼────────┐
│WorkEventRouter  │  ← Schema migrated
└────────┬────────┘
         │
┌────────▼────────┐
│  WorkSupport    │  ← Schema migrated (eventRouterId)
│  - eventRouterId│     But routes still use [contextId]
└────────┬────────┘
         │
┌────────▼────────┐
│   WorkOutput    │  ← Schema migrated (eventRouterId)
│   - eventRouterId│    But code references .contextId
└─────────────────┘

❌ BROKEN:
1. Route params: [contextId] but contains eventRouterId
   └─> app/mywork/support/[contextId]/*

2. Code references: workOutput.contextId (doesn't exist)
   └─> app/mywork/outputs/builder/[outputId]/page.tsx

3. Function names: "ByContext" but use eventRouterId
   └─> getWorkSupportByContext(), getWorkOutputsByContext()

4. Back links: /mywork/context/${contextId} (contextId is eventRouterId)
   └─> May work but confusing

⚠️ CONFUSING BUT WORKS:
- getWorkContext() is alias for getWorkEventRouter()
- Support pages work but use wrong variable names
```

---

## STEP 7 — FIX PLAN (NO IMPLEMENTATION)

### 7.1 What Needs to Be Deleted

**Nothing needs to be deleted.** All WorkSupport functionality is still useful and should be preserved.

---

### 7.2 What Needs to Be Renamed

#### Route Parameters

**Current:** `app/mywork/support/[contextId]/*`  
**Proposed:** `app/mywork/support/[eventRouterId]/*` or `app/mywork/support/[routerId]/*`

**Files to Update:**
- `app/mywork/support/[contextId]/page.tsx` → `app/mywork/support/[eventRouterId]/page.tsx`
- `app/mywork/support/[contextId]/setup/page.tsx` → `app/mywork/support/[eventRouterId]/setup/page.tsx`

**Impact:** Breaking change for URLs, but necessary for clarity

---

#### Function Names

**Current:** `getWorkSupportByContext(eventRouterId: string)`  
**Proposed:** `getWorkSupportByEventRouter(eventRouterId: string)` or `getWorkSupportByRouter(eventRouterId: string)`

**Files to Update:**
- `lib/actions/work-support.ts` (line 177)
- All files importing this function

**Current:** `getWorkOutputsByContext(contextId: string)`  
**Proposed:** `getWorkOutputsByEventRouter(eventRouterId: string)`

**Files to Update:**
- `lib/actions/work-output.ts` (line 283)
- All files importing this function

**Impact:** Breaking change for function calls, but improves clarity

---

#### Variable Names

**Current:** `const contextId = params.contextId`  
**Proposed:** `const eventRouterId = params.eventRouterId` or `const routerId = params.routerId`

**Files to Update:**
- `app/mywork/support/[contextId]/page.tsx`
- `app/mywork/support/[contextId]/setup/page.tsx`
- `app/mywork/context/[contextId]/success/page.tsx` (support links)

**Impact:** Internal change, improves code clarity

---

### 7.3 What Needs to Be Moved

**Nothing needs to be moved.** File structure is appropriate.

---

### 7.4 What Should Become Part of WorkEvent

**Nothing.** WorkSupport should remain separate from WorkEvent. WorkSupport is a support container that can be used for any WorkEventRouter type (events, campaigns, training, etc.).

---

### 7.5 What Should Eventually Move into a New SupportSession Container

**Future Consideration:** WorkSupport could be renamed to `SupportSession` to better reflect its role as a "session that groups multiple product requests."

**Current WorkSupport Fields:**
- `selectedOutputs` - ✅ Keep (what products are needed)
- `status` - ✅ Keep (session progress)
- `evolvingInfo` - ✅ Keep (session-specific data)
- `assets` - ✅ Keep (created product IDs)
- `supportType` - ⚠️ Consider removing or repurposing

**Future SupportSession Could:**
- Group multiple product requests across different events
- Track session-level metadata (RSVP lists, notes, etc.)
- Manage workflow status for the entire session
- Link to multiple WorkEventRouters (if needed)

**Migration Path:**
1. Keep WorkSupport as-is for now
2. Add SupportSession model when multi-router grouping is needed
3. Migrate WorkSupport → SupportSession gradually

---

### 7.6 Priority Fix List

#### 🔴 **CRITICAL (Must Fix)**

1. **Fix `workOutput.contextId` references**
   - **File:** `app/mywork/outputs/builder/[outputId]/page.tsx`
   - **Change:** `workOutput.contextId` → `workOutput.eventRouterId`
   - **Lines:** 104, 169
   - **Impact:** Prevents runtime errors

---

#### 🟡 **HIGH (Should Fix Soon)**

2. **Rename route parameters**
   - **Files:** All support route pages
   - **Change:** `[contextId]` → `[eventRouterId]`
   - **Impact:** Improves clarity, prevents confusion

3. **Rename function parameters**
   - **Files:** Support and output action files
   - **Change:** `contextId` → `eventRouterId` in function signatures
   - **Impact:** Improves code clarity

---

#### 🟢 **MEDIUM (Nice to Have)**

4. **Rename functions with "Context" in name**
   - **Files:** `lib/actions/work-support.ts`, `lib/actions/work-output.ts`
   - **Change:** `getWorkSupportByContext()` → `getWorkSupportByEventRouter()`
   - **Impact:** Improves developer experience

5. **Update back links**
   - **Files:** Support pages
   - **Change:** Verify `/mywork/context/[id]` accepts WorkEventRouter IDs
   - **Impact:** Ensures navigation works correctly

---

#### 🔵 **LOW (Future Consideration)**

6. **Consider renaming WorkSupport → SupportSession**
   - **Impact:** Better reflects future multi-router grouping capability
   - **Timing:** When multi-router support is needed

---

### 7.7 Migration Strategy

**Phase 1: Critical Fixes (Immediate)**
- Fix `workOutput.contextId` → `workOutput.eventRouterId`
- Test all support flows

**Phase 2: Route Renaming (Next Sprint)**
- Rename route params from `[contextId]` to `[eventRouterId]`
- Update all route references
- Update navigation links

**Phase 3: Function Renaming (Future)**
- Rename functions with "Context" in name
- Add deprecation warnings for old names
- Update all call sites

**Phase 4: SupportSession (Future)**
- Design SupportSession model (if multi-router grouping needed)
- Migrate WorkSupport → SupportSession
- Update all references

---

## SUMMARY

### Current State

✅ **Schema:** Fully migrated to use `eventRouterId` and `WorkEventRouter`  
✅ **Server Actions:** Correctly use `eventRouterId`  
✅ **Business Logic:** WorkSupport still functions as output container  
❌ **Routes:** Still use `[contextId]` param name  
❌ **Code:** References non-existent `workOutput.contextId`  
⚠️ **Naming:** Functions and variables use "Context" terminology

### Breaking Points

1. **Runtime Error:** `workOutput.contextId` access (CRITICAL)
2. **Route Confusion:** `[contextId]` param contains `eventRouterId` (HIGH)
3. **Function Naming:** Misleading "Context" names (MEDIUM)

### What Should Survive

- WorkSupport model and all its fields
- Selected outputs flow
- Status workflow
- Assets tracking
- Evolving info storage
- Support UI pages
- Support CRUD operations

### Recommended Fix Order

1. Fix `workOutput.contextId` → `workOutput.eventRouterId` (CRITICAL)
2. Rename route params `[contextId]` → `[eventRouterId]` (HIGH)
3. Rename function parameters for clarity (HIGH)
4. Consider renaming functions with "Context" (MEDIUM)
5. Future: Consider SupportSession for multi-router grouping (LOW)

---

**END OF AUDIT**


