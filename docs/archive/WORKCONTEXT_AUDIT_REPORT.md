# WorkContext Architecture Audit Report

**Date:** 2025-01-24  
**Repository:** workme-nextapp  
**Purpose:** Complete audit of existing WorkContext implementation before Event specialization refactor

---

## SECTION A — Prisma Model(s) Found

### A.1 Core Router Model: `WorkContext`

**Location:** `prisma/schema.prisma` (lines 356-374)

```prisma
model WorkContext {
  id        String      @id @default(cuid())
  createdAt DateTime    @default(now())
  type      ContextType
  typeRefId String // references the typed context model

  companyId    String
  company      Company @relation("WorkContextCompany", fields: [companyId], references: [id], onDelete: Cascade)
  originatorId String
  originator   WorkMe  @relation("WorkContextOriginator", fields: [originatorId], references: [id], onDelete: Cascade)

  outputs  WorkOutput[]
  supports WorkSupport[]

  @@index([companyId])
  @@index([originatorId])
  @@index([createdAt])
  @@index([type, typeRefId])
}
```

**Key Characteristics:**
- **Router Pattern:** Thin reference layer that points to typed context models
- **Required Fields:** `id`, `createdAt`, `type`, `typeRefId`, `companyId`, `originatorId`
- **Optional Fields:** None (all fields required)
- **Relations:**
  - `1:many` → `Company` (via `companyId`)
  - `1:many` → `WorkMe` (via `originatorId`)
  - `1:many` → `WorkOutput[]` (via `outputs`)
  - `1:many` → `WorkSupport[]` (via `supports`)
- **Indexes:** Company scoping, originator lookup, creation date sorting, type+refId lookup

### A.2 Typed Context Models

All typed context models follow the same pattern: they store the actual data fields and are referenced by `WorkContext.typeRefId`.

#### A.2.1 `WorkContextEvent` (Event Type)

**Location:** `prisma/schema.prisma` (lines 446-467)

```prisma
model WorkContextEvent {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  title         String
  description   String?
  startDate     DateTime?
  endDate       DateTime?
  location      String?
  eventCategory String?
  pocFirstName  String?
  pocLastName   String?
  pocEmail      String?
  pocPhone      String?

  companyId    String
  company      Company @relation("WorkContextEventCompany", fields: [companyId], references: [id], onDelete: Cascade)
  originatorId String
  originator   WorkMe  @relation("WorkContextEventOriginator", fields: [originatorId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([originatorId])
}
```

**Fields:**
- **Required:** `id`, `createdAt`, `title`, `companyId`, `originatorId`
- **Optional:** `description`, `startDate`, `endDate`, `location`, `eventCategory`, all POC fields
- **Event-Specific Field:** `eventCategory` (String, optional) - currently a free-text field
- **No Event Specialization:** Currently, `eventCategory` is just a string field. There is NO enum, no "Holiday Open House" specialization, no EventType enum.

#### A.2.2 Other Typed Context Models

The following typed context models exist (all follow same pattern as `WorkContextEvent`):

1. **`WorkContextCampaign`** (lines 377-398)
   - Fields: `title`, `description`, `windowStart`, `windowEnd`, `ctaLink`, `sponsor`, POC fields
   
2. **`WorkContextImpactEvent`** (lines 400-420)
   - Fields: `title`, `description`, `effectiveDate`, `impactedPopulation`, `urgency`, POC fields
   
3. **`WorkContextTraining`** (lines 422-444)
   - Fields: `title`, `description`, `trainingDate`, `deadline`, `link`, `mandatory`, `sponsoringOffice`, POC fields
   
4. **`WorkContextCommunity`** (lines 469-490)
   - Fields: `title`, `description`, `partnerOrg`, `date`, `location`, `signUpLink`, POC fields
   
5. **`WorkContextBenefits`** (lines 492-517)
   - Fields: `title`, `description`, `windowStart`, `windowEnd`, benefit links (`fehbLink`, `fedvipLink`, etc.), `annualRecurrence`, POC fields
   
6. **`WorkContextCareer`** (lines 519-540)
   - Fields: `title`, `description`, `deadlines` (Json), `supervisorName`, `resourceLink`, POC fields
   
7. **`WorkContextEmployeeCause`** (lines 542-567)
   - Fields: `title`, `description`, `partnerOrg`, `windowStart`, `windowEnd`, `location`, `neededItems` (String[]), `collectionPoints` (String[]), `signUpLink`, POC fields

---

## SECTION B — Related Models (WorkSupport, WorkOutputs, etc.)

### B.1 `WorkSupport` Model

**Location:** `prisma/schema.prisma` (lines 572-599)

```prisma
model WorkSupport {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  contextId String
  context   WorkContext @relation(fields: [contextId], references: [id], onDelete: Cascade)

  companyId    String
  company      Company @relation("WorkSupportCompany", fields: [companyId], references: [id], onDelete: Cascade)
  originatorId String
  originator   WorkMe  @relation("WorkSupportOriginator", fields: [originatorId], references: [id], onDelete: Cascade)

  supportType String? // optional, e.g. "event_support", "training_support"

  selectedOutputs String[] // list of WorkOutput types chosen by user
  evolvingInfo    Json? // RSVP list, notes, last-minute requests, etc.
  assets          Json? // WorkOutput IDs created through this support
  status          String   @default("draft") // "draft" | "in_progress" | "complete"

  outputs WorkOutput[]

  @@unique([contextId]) // One WorkSupport per WorkContext (unless multiple needed later)
  @@index([contextId])
  @@index([companyId])
  @@index([originatorId])
  @@index([status])
}
```

**Key Characteristics:**
- **Relation to WorkContext:** `many:1` (one WorkSupport per WorkContext, enforced by `@@unique([contextId])`)
- **Purpose:** Support container for managing outputs and evolving information for a WorkContext
- **Fields:**
  - `supportType` (optional String) - can be "event_support", "training_support", etc.
  - `selectedOutputs` (String[]) - list of WorkOutput types chosen
  - `evolvingInfo` (Json) - RSVP lists, notes, last-minute requests
  - `assets` (Json) - WorkOutput IDs created through this support
  - `status` (String) - "draft" | "in_progress" | "complete"

### B.2 `WorkOutput` Model

**Location:** `prisma/schema.prisma` (lines 604-632)

```prisma
model WorkOutput {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  contextId String?
  context   WorkContext? @relation(fields: [contextId], references: [id], onDelete: Cascade)

  supportId String?
  support   WorkSupport? @relation(fields: [supportId], references: [id], onDelete: Cascade)

  companyId    String
  company      Company @relation("WorkOutputCompany", fields: [companyId], references: [id], onDelete: Cascade)
  originatorId String
  originator   WorkMe  @relation("WorkOutputOriginator", fields: [originatorId], references: [id], onDelete: Cascade)

  outputType String // "ntk_snippet" | "talking_points" | "digital_signage" | "print_product" | "sharepoint_block" | "quick_blurb" | "event_kit" | "photo_video"
  dataJson   Json? // saved content from builders

  status String @default("draft") // "draft" | "final"

  @@index([contextId])
  @@index([supportId])
  @@index([companyId])
  @@index([originatorId])
  @@index([outputType])
  @@index([status])
  @@index([updatedAt])
}
```

**Key Characteristics:**
- **Relations:** Can belong to either a `WorkContext` OR a `WorkSupport` (both optional)
- **Output Types:** String enum-like values: "ntk_snippet", "talking_points", "digital_signage", "print_product", "sharepoint_block", "quick_blurb", "event_kit", "photo_video"
- **Purpose:** Stores generated outputs/deliverables for a context or support

### B.3 `WorkOutputStandalone` Model

**Location:** `prisma/schema.prisma` (lines 651-678)

```prisma
model WorkOutputStandalone {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  outputType OutputCategory

  title        String
  description  String?
  draftContent Json? // email body, notes, fields, etc.
  metadata     Json? // any structured data needed later

  workSupportId String? // OPTIONAL: future relational hook (not used today)

  companyId    String
  company      Company @relation("WorkOutputStandaloneCompany", fields: [companyId], references: [id], onDelete: Cascade)
  originatorId String
  originator   WorkMe  @relation("WorkOutputStandaloneOriginator", fields: [originatorId], references: [id], onDelete: Cascade)

  @@index([originatorId])
  @@index([outputType])
  @@index([updatedAt])
  @@index([workSupportId])
}
```

**Key Characteristics:**
- **Standalone:** Not directly linked to WorkContext (future hook to WorkSupport exists but unused)
- **OutputCategory Enum:** Uses `OutputCategory` enum (workforce_comms_email, messaging_talking_points, digital_product, print_product, sharepoint_update, photo_video_support, ntk)

---

## SECTION C — ContextType or Related Enums

### C.1 `ContextType` Enum

**Location:** `prisma/schema.prisma` (lines 344-353)

```prisma
enum ContextType {
  campaign
  impact_event
  training
  event
  community
  benefits
  career
  employee_cause
}
```

**Key Points:**
- **8 Total Types:** All context types are defined here
- **Event Type Exists:** `event` is a valid `ContextType` value
- **No Event Subtypes:** There is NO enum for event subtypes (no "Holiday Open House" type)
- **No EventType Enum:** The `eventCategory` field in `WorkContextEvent` is a free-text String, not an enum

### C.2 Event Category Field

**Current Implementation:**
- **Field Name:** `eventCategory`
- **Type:** `String?` (optional, nullable)
- **Location:** `WorkContextEvent` model (line 454)
- **Usage:** Free-text field in frontend form (`app/mywork/context/new/event/page.tsx`)
- **No Validation:** No enum, no predefined categories, no "Holiday Open House" specialization

---

## SECTION D — API Routes Touching Context

### D.1 Context Creation Route

**Location:** `app/api/context/create/[type]/route.ts`

**Endpoint:** `POST /api/context/create/[type]`

**Supported Types:**
- `campaign`
- `impact_event`
- `training`
- `event` ✅
- `community`
- `benefits`
- `career`
- `employee_cause`

**Implementation:**
- Uses `createTypedContext()` from `lib/server/context-factory.ts`
- Validates with Zod schemas from `lib/server/context-schemas.ts`
- Creates both typed model and WorkContext router atomically in transaction
- Returns: `{ success: true, typed, router }`

### D.2 Context Retrieval Route

**Location:** `app/api/context/[contextId]/route.ts`

**Endpoints:**
- `GET /api/context/[contextId]` - Get single WorkContext with enriched typed data
- `PUT /api/context/[contextId]` - Update WorkContext's typed data

**Implementation:**
- Uses `getWorkContext()` from `lib/server/get-work-context.ts` for GET
- Uses `updateTypedContext()` from `lib/server/context-factory.ts` for PUT
- Enriches router with typed data using `getTypedContext()`
- Filters by `companyId` for multi-tenant security

### D.3 Context List Route

**Location:** `app/api/context/route.ts`

**Endpoint:** `GET /api/context`

**Implementation:**
- Lists all WorkContexts for authenticated user's company
- Enriches each with typed data using `getTypedContext()`
- Returns: `{ success: true, workContexts: [...] }`

### D.4 Factory Functions

**Location:** `lib/server/context-factory.ts`

**Functions:**
1. `createTypedContext(type, data, workMeId, companyId)` - Creates typed model + router atomically
2. `updateTypedContext(workContextId, type, data, workMeId, companyId)` - Updates typed model
3. `getTypedContext(type, typeRefId, companyId)` - Retrieves typed model data
4. `deleteTypedContext(workContextId, workMeId, companyId)` - Deletes both router and typed model

**Model Mapping:**
```typescript
const MODEL_MAP = {
  campaign: "workContextCampaign",
  impact_event: "workContextImpactEvent",
  training: "workContextTraining",
  event: "workContextEvent",  // ✅ Maps to WorkContextEvent
  community: "workContextCommunity",
  benefits: "workContextBenefits",
  career: "workContextCareer",
  employee_cause: "workContextEmployeeCause",
}
```

### D.5 Server Actions

**Location:** `lib/actions/typed-contexts.ts`

**Event-Specific Functions:**
- `createEvent(data)` - Creates WorkContextEvent + WorkContext router
- `updateEvent(workContextId, data)` - Updates WorkContextEvent
- Uses `eventSchema` from Zod for validation

---

## SECTION E — Frontend Components Using Context

### E.1 Event Creation Form

**Location:** `app/mywork/context/new/event/page.tsx`

**Fields Captured:**
- `title` (required)
- `description` (optional)
- `startDate` + `startTime` (optional)
- `endDate` + `endTime` (optional)
- `location` (optional)
- `eventCategory` (optional, free-text input)
- POC fields (firstName, lastName, email, phone)

**Implementation:**
- Client-side form component
- Calls `createEvent()` server action
- Redirects to success page on creation

### E.2 Context List Page

**Location:** `app/mywork/context/page.tsx`

**Features:**
- Lists all WorkContexts for authenticated user
- Search/filter functionality
- Delete functionality
- Links to detail pages

### E.3 Context Detail Page

**Location:** `app/mywork/context/[contextId]/page.tsx`

**Features:**
- Displays enriched WorkContext data
- Shows `eventCategory` if present (line 217-220)
- Displays all typed data fields
- Shows related WorkOutputs

### E.4 WorkSupport Pages

**Locations:**
- `app/mywork/support/[contextId]/page.tsx` - WorkSupport detail page
- `app/mywork/support/[contextId]/setup/page.tsx` - WorkSupport setup page
- `app/(authenticated)/worksupport/page.tsx` - WorkSupport list page

**Purpose:** Manage support requests and outputs for WorkContexts

### E.5 Context Type Selection

**Location:** `app/mywork/context/new/page.tsx`

**Purpose:** Allows user to select which type of context to create (campaign, event, training, etc.)

---

## SECTION F — Gaps or Inconsistencies Observed

### F.1 Event Specialization Gap

**Issue:** No Event specialization exists beyond the generic `WorkContextEvent` model.

**Current State:**
- `eventCategory` is a free-text String field
- No enum for event types
- No "Holiday Open House" or other event subtype models
- No EventType enum

**Impact:** Cannot distinguish between different event types programmatically. All events are treated the same.

### F.2 Event Category Field Usage

**Current Implementation:**
- Field exists but is optional and unvalidated
- Frontend allows any text input
- No predefined categories
- No relationship to event subtypes

### F.3 No Event-Specific WorkSupport Logic

**Observation:** `WorkSupport.supportType` can be "event_support" but there's no specialized logic for event-specific support workflows.

### F.4 Schema Documentation Mismatch

**Issue:** `workcontext-architecture.md` mentions `WorkContextEvent` but doesn't document the lack of event specialization.

### F.5 No Event-Specific Output Types

**Observation:** `WorkOutput.outputType` includes "event_kit" but no other event-specific output types beyond generic ones.

---

## SECTION G — What is Needed for Event-Specific Use Case (Holiday Open House)

### G.1 Current Capabilities

**What Works Today:**
- ✅ Can create a `WorkContext` with `type: "event"`
- ✅ Can store event data in `WorkContextEvent` model
- ✅ Can set `eventCategory` to "Holiday Open House" (as free text)
- ✅ Can create WorkSupport for the event
- ✅ Can generate WorkOutputs for the event

**What's Missing:**
- ❌ No validation that "Holiday Open House" is a valid event category
- ❌ No specialized fields for Holiday Open House (e.g., RSVP tracking, venue capacity, catering info)
- ❌ No event subtype model or enum
- ❌ No event-specific UI components
- ❌ No event-specific workflow logic

### G.2 Required Changes for Holiday Open House Support

**Option 1: Add EventType Enum to WorkContextEvent**
- Add `EventType` enum: `HOLIDAY_OPEN_HOUSE`, `TOWN_HALL`, `WORKSHOP`, etc.
- Add `eventType` field to `WorkContextEvent`
- Keep `eventCategory` as optional free-text for additional categorization

**Option 2: Create Specialized Event Models (Following Current Pattern)**
- Create `WorkContextHolidayOpenHouse` model
- Add `holiday_open_house` to `ContextType` enum
- Create specialized fields (RSVP fields, venue capacity, catering, etc.)
- Follow same router pattern as other typed contexts

**Option 3: Hybrid Approach**
- Add `EventType` enum for categorization
- Add optional specialized fields to `WorkContextEvent` (Json field for event-specific data)
- Keep single model but allow structured event-specific data

### G.3 Fields Needed for Holiday Open House

Based on typical event management needs:
- **RSVP Tracking:** RSVP deadline, RSVP link, RSVP count, max capacity
- **Venue Information:** Venue name, address, capacity, parking info
- **Event Details:** Start/end times, dress code, agenda items
- **Catering/Logistics:** Food options, dietary restrictions, special accommodations
- **Communication:** Pre-event reminders, post-event follow-up

### G.4 Integration Points

**WorkSupport Integration:**
- WorkSupport could track RSVP responses in `evolvingInfo` Json field
- WorkSupport could manage event logistics in `assets` Json field

**WorkOutput Integration:**
- Event-specific outputs: invitations, RSVP forms, event programs, signage
- Output types: "event_invitation", "event_program", "event_signage"

---

## Summary

### Current State
- ✅ **WorkContext router architecture is fully implemented**
- ✅ **WorkContextEvent model exists with basic event fields**
- ✅ **Event creation, reading, updating works via API routes**
- ✅ **Frontend forms exist for event creation**
- ❌ **No event specialization beyond generic model**
- ❌ **No "Holiday Open House" or other event subtype support**
- ❌ **eventCategory is free-text, not validated**

### Architecture Strengths
- Clean router pattern separating routing from data
- Consistent pattern across all context types
- Multi-tenant security via companyId scoping
- Transaction-safe CRUD operations
- Well-structured API routes and server actions

### Architecture Gaps
- Event type is just a generic model with no specialization
- No enum or validation for event categories
- No event-specific fields beyond basic POC and date/location
- No event-specific workflows or UI components

### Next Steps (When Ready)
1. Decide on approach: enum extension vs. specialized models vs. hybrid
2. Add event specialization fields to support Holiday Open House use case
3. Update validation schemas
4. Update frontend forms
5. Add event-specific WorkSupport and WorkOutput logic

---

**End of Audit Report**

