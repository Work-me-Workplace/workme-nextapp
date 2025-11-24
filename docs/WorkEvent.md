# WorkEvent Architecture

**Last Updated:** 2025-01-24  
**Purpose:** Create shared awareness and specific work-related products for company events

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

### WorkEvent Model

**Location:** `prisma/schema.prisma` (lines 446-480)

```prisma
model WorkEvent {
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

  // Event-specific fields
  eventDate         DateTime?
  startTime         String?
  endTime           String?
  registrationRequired String? // "Yes" or "No"
  registrationLink String?
  speakers          String[] @default([])
  foodProvided     String? // "Yes" or "No"
  foodTypes         String? // free text
  promotionNeeds   String[] @default([]) // checkbox string values

  companyId    String
  company      Company @relation("WorkEventCompany", fields: [companyId], references: [id], onDelete: Cascade)
  originatorId String
  originator   WorkMe  @relation("WorkEventOriginator", fields: [originatorId], references: [id], onDelete: Cascade)

  items EventItem[]

  @@index([companyId])
  @@index([originatorId])
}
```

**Key Fields:**
- **Container Identity:** `id` (eventId) - Unique identifier for the event
- **Event Details:** `title`, `description`, `location`, `eventCategory`
- **Timing:** `startDate`, `endDate`, `eventDate`, `startTime`, `endTime`
- **Registration:** `registrationRequired`, `registrationLink`
- **Logistics:** `speakers[]`, `foodProvided`, `foodTypes`
- **Promotion:** `promotionNeeds[]` - Array of promotion requirements
- **POC:** Point of contact fields (firstName, lastName, email, phone)
- **Relations:** `items EventItem[]` - Child items

### EventItem Model

**Location:** `prisma/schema.prisma` (lines 482-495)

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

**Server Action:** `createWorkEvent(data)`  
**Location:** `lib/actions/typed-contexts.ts`

Creates both:
1. `WorkEvent` (typed data)
2. `WorkEventRouter` (router entry)

**API Route:** `POST /api/context/create/event`  
**Location:** `app/api/context/create/[type]/route.ts`

### Retrieval

**Server Action:** `getWorkContext(id)`  
**Location:** `lib/actions/work-context.ts`

Enriches WorkEventRouter with WorkEvent data via factory pattern.

**API Route:** `GET /api/context/[contextId]`  
**Location:** `app/api/context/[contextId]/route.ts`

### EventItem Management

**Current Status:** EventItem model exists but CRUD operations not yet implemented.

**Planned Operations:**
- `createEventItem(eventId, data)` - Add item to event
- `updateEventItem(eventItemId, data)` - Update item
- `deleteEventItem(eventItemId)` - Remove item
- `getEventItems(eventId)` - Get all items for an event

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
- `EventTemplatePicker` - Previous event selector

### Form Fields

The event creation form includes:
- Basic: title, description, location, category
- Dates/Times: startDate, endDate, eventDate, startTime, endTime
- Registration: registrationRequired, registrationLink
- Logistics: speakers[], foodProvided, foodTypes
- Promotion: promotionNeeds[]
- POC: firstName, lastName, email, phone

---

## Use Cases

### 1. Holiday Open House Event

**WorkEvent Container:**
- `title`: "Holiday Open House 2025"
- `eventDate`: 2025-12-15
- `startTime`: "5:00 PM"
- `endTime`: "8:00 PM"
- `location`: "Main Auditorium"
- `registrationRequired`: "Yes"
- `registrationLink`: "https://..."
- `foodProvided`: "Yes"
- `foodTypes`: "Vegetarian, Gluten-free options"
- `promotionNeeds`: ["Email announcement", "Digital signage", "Intranet post"]

**EventItems:**
- Agenda item: "Welcome & Introductions"
- Agenda item: "Holiday Performance"
- Deliverable: "Event program"
- Deliverable: "Name tags"
- Task: "Set up catering"

### 2. All-Hands Meeting

**WorkEvent Container:**
- `title`: "Q1 All-Hands Meeting"
- `eventDate`: 2025-03-15
- `startTime`: "10:00 AM"
- `endTime`: "11:30 AM"
- `location`: "Virtual - Teams"
- `speakers`: ["CEO", "CFO", "VP Engineering"]
- `promotionNeeds`: ["Calendar invite", "Slack announcement"]

**EventItems:**
- Agenda: "Q1 Results Review"
- Agenda: "Product Roadmap"
- Deliverable: "Meeting recording"
- Deliverable: "Slides deck"

---

## Data Flow

### Creating an Event

```
1. User fills event form (Manual/AI/Template)
2. Frontend calls createWorkEvent(data)
3. Server creates WorkEvent (typed data)
4. Server creates WorkEventRouter (router entry)
5. Returns { success: true, event, workEventRouter }
6. Frontend redirects to event detail page
```

### Adding EventItems

```
1. User creates EventItem via form/API
2. Server creates EventItem with eventId reference
3. EventItem stored with title, description, metadata
4. Items can be queried by eventId
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

## Future Enhancements

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

---

**End of WorkEvent Architecture Documentation**

