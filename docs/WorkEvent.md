# WorkEvent Architecture

**Last Updated:** 2025-11-24  
**Status:** ⚠️ **SCHEMA MISMATCH DETECTED** - Database has both old and new columns  
**Purpose:** Create shared awareness and specific work-related products for company events

---

## ⚠️ **CRITICAL: Current Schema Status**

### Database Reality (from `prisma db pull`)

The database currently has **BOTH old and new columns**, creating confusion:

**OLD Columns (should be removed eventually):**
- `startDate` (DateTime?)
- `endDate` (DateTime?)
- `location` (String?)
- `pocFirstName` (String?)
- `pocLastName` (String?)
- `promotionNeeds` (String[])

**NEW Columns (current schema):**
- `updatedAt` (DateTime @updatedAt) ✅
- `theme` (String?) ✅
- `audience` (String?) ✅
- `vibe` (String?) ✅
- `perks` (String[] @default([])) ✅
- `participation` (String[] @default([])) ✅

### Prisma Schema Definition

**Location:** `prisma/schema.prisma` (lines 446-494)

```prisma
model WorkEvent {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Core identity
  title       String
  theme       String? // NEW (tagline / theme)
  description String?

  // Timing
  eventDate DateTime?
  startTime String?
  endTime   String?

  // Category (string, validated by mapper)
  eventCategory String?

  // Registration
  registrationRequired String?
  registrationLink     String?

  // Highlights extracted from GPT
  audience      String?
  vibe          String?
  perks         String[] @default([])      // ⚠️ ARRAY TYPE
  participation String[] @default([])      // ⚠️ ARRAY TYPE

  // Food
  foodProvided String?
  foodTypes    String?

  // Speaker + POC
  speakers String[] @default([])
  pocEmail String?
  pocPhone String?

  companyId    String
  company      Company @relation("WorkEventCompany", fields: [companyId], references: [id], onDelete: Cascade)
  originatorId String
  originator   WorkMe  @relation("WorkEventOriginator", fields: [originatorId], references: [id], onDelete: Cascade)

  // Relations
  eventItems           EventItem[]
  promotionalWorkItems PromotionalWorkItem[]

  @@index([companyId])
  @@index([originatorId])
}
```

### ⚠️ **TYPE MISMATCH ISSUE**

**Problem:** `perks` and `participation` are defined as **arrays** (`String[]`) in Prisma schema, but some forms and PromotionalWorkItem are treating them as **strings**.

**Where the mismatch occurs:**
1. **PromotionalWorkItem schema** (`lib/actions/promotional-work-item.ts`):
   - `perks: z.string().optional().nullable()` ❌ Should be array
   - `participation: z.string().optional().nullable()` ❌ Should be array

2. **Promo scratch form** (`app/attention/events/[eventId]/promo/new/scratch/page.tsx`):
   - Uses text inputs instead of array inputs ❌

3. **Promo AI ingest** (`app/api/ingest/promotional/ai/route.ts`):
   - Returns `perks: string | null` ❌ Should be array

**Correct Type:**
- `perks: String[]` - Array of perk strings (e.g., `["Free lunch", "Raffle prizes", "Live music"]`)
- `participation: String[]` - Array of participation strings (e.g., `["Bring a dish", "RSVP required", "Family welcome"]`)

**Fix Needed:**
1. Update PromotionalWorkItem schema to use arrays
2. Update promo forms to handle arrays (tag input or multi-select)
3. Update AI ingest to return arrays
4. Consider migration to remove old columns from database

---

## Premise

The WorkEvent system enables organizations to:
- **Create shared awareness** of company events across the workforce
- **Generate specific work-related products** (communications, materials, outputs) for events
- **Manage event details** and track event-specific items and deliverables

---

## Architecture Overview

### Two-Layer Container Model

The WorkEvent system uses a **container-item pattern**:

1. **WorkEvent (Container)** - The overall event with `eventId`
   - Stores event metadata, dates, location, POC information
   - Contains all event-level configuration
   - Links to WorkEventRouter for routing and relations

2. **EventItem (Items)** - Specific items within an event, defined by `eventItemId`
   - Flexible items that can represent agenda items, deliverables, tasks, or any event-specific work products
   - Each item has its own title, description, and metadata
   - Items cascade delete with the parent event

---

## Data Models

### WorkEvent Model - CURRENT SCHEMA

**Key Fields:**
- **Identity:** `id` (cuid), `createdAt`, `updatedAt`
- **Core Details:** `title`, `theme`, `description`
- **Timing:** `eventDate`, `startTime`, `endTime`
- **Category:** `eventCategory` (String, validated by mapper)
- **Registration:** `registrationRequired`, `registrationLink`
- **Highlights (from GPT):** `audience`, `vibe`, `perks[]`, `participation[]`
- **Food:** `foodProvided`, `foodTypes`
- **Speakers:** `speakers[]` (String array)
- **POC:** `pocEmail`, `pocPhone`
- **Relations:** `eventItems EventItem[]`, `promotionalWorkItems PromotionalWorkItem[]`

**Important Notes:**
- `perks` and `participation` are **String arrays**, not strings
- `speakers` is a **String array**
- Old fields (`startDate`, `endDate`, `location`, `pocFirstName`, `pocLastName`, `promotionNeeds`) exist in database but are NOT in Prisma schema

### EventItem Model

**Location:** `prisma/schema.prisma` (lines 496-514)

```prisma
model EventItem {
  id        String   @id @default(cuid())
  eventId   String
  event     WorkEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)

  title       String
  description String?
  metadata    Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([eventId])
}
```

**Key Fields:**
- **Item Identity:** `id` (eventItemId) - Unique identifier for the item
- **Parent Reference:** `eventId` - Links to parent WorkEvent
- **Content:** `title`, `description` - Item details
- **Flexible Data:** `metadata Json?` - Can store any structured data for item-specific needs

**Use Cases for EventItem:**
- Agenda items or session topics
- Deliverables or work products needed for the event
- Tasks or action items
- Resources or materials
- Any event-specific structured data

---

## Router Architecture

### WorkEventRouter

WorkEvent is accessed through the **WorkEventRouter** system, which provides:
- Routing and navigation
- Relations to WorkSupport and WorkOutput
- Type-safe context type (`event`)

```prisma
model WorkEventRouter {
  id        String      @id @default(cuid())
  createdAt DateTime    @default(now())
  type      ContextType // "event"
  eventRefId String     // References WorkEvent.id

  companyId    String
  company      Company @relation("WorkEventRouterCompany", ...)
  originatorId String
  originator   WorkMe  @relation("WorkEventRouterOriginator", ...)

  outputs  WorkOutput[]
  supports WorkSupport[]

  @@index([type, eventRefId])
}
```

**Access Pattern:**
1. Query `WorkEventRouter` by `id` (router ID)
2. Get `eventRefId` from router
3. Query `WorkEvent` by `eventRefId` to get full event data
4. Query `EventItem[]` by `eventId` to get all items

---

## Relations & Integration

### WorkSupport Integration

WorkSupport can be created for a WorkEvent to manage:
- Event support workflows
- RSVP tracking (stored in `evolvingInfo` Json)
- Event logistics (stored in `assets` Json)
- Selected output types for event deliverables

```prisma
model WorkSupport {
  eventRouterId String
  eventRouter   WorkEventRouter @relation(...)
  // ... other fields
}
```

### WorkOutput Integration

WorkOutputs can be created for a WorkEvent to generate:
- Event invitations
- Event programs
- Digital signage
- Talking points
- Event kits
- Photo/video support

```prisma
model WorkOutput {
  eventRouterId String?
  eventRouter   WorkEventRouter? @relation(...)
  // ... other fields
}
```

---

## API & Server Actions

### Creation

**API Route:** `POST /api/ingest/event/save`  
**Location:** `app/api/ingest/event/save/route.ts`

Creates:
1. `WorkEvent` (typed data)
2. `EventItems` (from ingestion)
3. `WorkEventRouter` (router entry)

**Server Action:** `createWorkEvent(data)`  
**Location:** `lib/actions/typed-contexts.ts`

Creates both:
1. `WorkEvent` (typed data)
2. `WorkEventRouter` (router entry)

### Retrieval

**Server Action:** `getWorkEventRouter(id)`  
**Location:** `lib/server/get-work-context.ts`

Enriches WorkEventRouter with WorkEvent data via factory pattern.

**API Route:** `GET /api/context/[contextId]`  
**Location:** `app/api/context/[contextId]/route.ts`

### EventItem Management

**Current Status:** EventItem model exists and is created during event ingestion.

**Operations:**
- Created automatically during AI ingestion
- Can be queried via `event.eventItems` relation

---

## Frontend Components

### Event Creation Fork

**Location:** `app/mywork/context/new/event/page.tsx`

Three creation paths:
1. **Manual Input** - Direct form entry
2. **AI Assist** - Paste text, AI parses and fills form
3. **Template** - Copy from previous event

**Components:**
- `EventCreationFork` - Fork selection UI
- `EventManualForm` - Standard event form with all fields
- `EventAIForm` - AI parsing interface
- `EventReviewScreen` - Review and save parsed event

### Form Fields

The event creation form includes:
- Basic: title, theme, description, category
- Dates/Times: eventDate, startTime, endTime
- Registration: registrationRequired, registrationLink
- Logistics: speakers[] (array), foodProvided, foodTypes
- Highlights: audience, vibe, perks[] (array), participation[] (array)
- POC: email, phone

---

## Use Cases

### 1. Holiday Open House Event

**WorkEvent Container:**
- `title`: "Holiday Open House 2025"
- `theme`: "Celebrating the Force Behind the Fleet"
- `eventDate`: 2025-12-15
- `startTime`: "5:00 PM"
- `endTime`: "8:00 PM"
- `registrationRequired`: "Yes"
- `registrationLink`: "https://..."
- `foodProvided`: "Yes"
- `foodTypes`: "Vegetarian, Gluten-free options"
- `perks`: ["Free lunch", "Raffle prizes", "Live music"]
- `participation`: ["Bring a dish", "RSVP required", "Family welcome"]
- `audience`: "All employees and families"
- `vibe`: "Festive and inclusive"

**EventItems:**
- Agenda item: "Welcome & Introductions"
- Agenda item: "Holiday Performance"
- Deliverable: "Event program"
- Deliverable: "Name tags"
- Task: "Set up catering"

### 2. All-Hands Meeting

**WorkEvent Container:**
- `title`: "Q1 All-Hands Meeting"
- `theme`: "Looking Forward Together"
- `eventDate`: 2025-03-15
- `startTime`: "10:00 AM"
- `endTime`: "11:30 AM"
- `speakers`: ["CEO", "CFO", "VP Engineering"]
- `perks`: ["Lunch provided", "Q&A session"]

**EventItems:**
- Agenda: "Q1 Results Review"
- Agenda: "Product Roadmap"
- Deliverable: "Meeting recording"
- Deliverable: "Slides deck"

---

## Data Flow

### Creating an Event (AI Ingest)

```
1. User pastes event text into EventAIForm
2. Frontend calls POST /api/ingest/event/ai with rawText
3. AI parses and returns structured JSON
4. User reviews parsed data in EventReviewScreen
5. User clicks "Save Event"
6. Frontend calls POST /api/ingest/event/save with parsed data
7. Server normalizes GPT output via gptJsonMapperService
8. Server creates WorkEvent + EventItems + WorkEventRouter in transaction
9. Returns { success: true, eventId: routerId }
10. Frontend redirects to /mywork/context/{eventId}/success
```

### Adding EventItems

```
1. EventItems are created automatically during AI ingestion
2. Items extracted from GPT parsing of event text
3. Stored with title, description, metadata
4. Items can be queried via event.eventItems relation
```

### Generating Work Products

```
1. User creates WorkSupport for event
2. User selects output types (invitation, program, etc.)
3. System generates WorkOutputs
4. Outputs linked to WorkEventRouter
5. Outputs can reference EventItems in metadata
```

---

## Schema Migration Notes

### Completed Migrations

1. **20251124180629_add_updated_at_to_work_event**
   - Added `updatedAt` column

2. **20251124181000_sync_workevent_schema**
   - Added `theme`, `audience`, `vibe`, `perks[]`, `participation[]` columns
   - Ensured all required columns exist

### Pending Cleanup

The database still has **old columns** that should be removed in a future migration:
- `startDate`, `endDate`, `location` (replaced by `eventDate`, `startTime`, `endTime`)
- `pocFirstName`, `pocLastName` (replaced by `pocEmail`, `pocPhone`)
- `promotionNeeds` (replaced by promotional work items system)

**⚠️ DO NOT remove these columns yet** - they may contain data. Plan a data migration first.

---

## Future Enhancements

### Schema Cleanup

- [ ] Migrate data from old columns to new columns
- [ ] Remove old columns (`startDate`, `endDate`, `location`, `pocFirstName`, `pocLastName`, `promotionNeeds`)
- [ ] Fix type mismatch for `perks`/`participation` in PromotionalWorkItem

### EventItem Categories

Planned enum for EventItem types:
- `AGENDA_ITEM`
- `DELIVERABLE`
- `TASK`
- `RESOURCE`
- `SPEAKER`

### Event Templates

Pre-defined event templates:
- Holiday Open House
- All-Hands Meeting
- Town Hall
- Training Session
- Networking Event

### Event Recurrence

Support for recurring events:
- Weekly, monthly, quarterly patterns
- Series management
- Instance variations

---

## Summary

**Container-Item Pattern:**
- **WorkEvent** (`eventId`) = Overall event container
- **EventItem** (`eventItemId`) = Specific items within event

**Purpose:**
- Create shared awareness of company events
- Generate work-related products (communications, materials, outputs)
- Manage event details and track deliverables

**Integration:**
- WorkEventRouter for routing and relations
- WorkSupport for event support workflows
- WorkOutput for generating event deliverables
- EventItem for flexible event-specific items
- PromotionalWorkItem for CVI-ready promotional materials

**⚠️ Known Issues:**
- Schema mismatch: `perks`/`participation` are arrays in WorkEvent but strings in PromotionalWorkItem
- Old columns still exist in database (plan cleanup migration)
- Promo forms need to be updated to handle array types

---

**End of WorkEvent Architecture Documentation**
