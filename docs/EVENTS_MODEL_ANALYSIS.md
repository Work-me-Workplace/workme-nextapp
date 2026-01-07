# Events Model Analysis

## Overview

This document provides a comprehensive analysis of the `CompanyEvent` model and all submodels that reference events via `eventId` or `companyEventId`.

---

## 1. Core Event Models

### 1.1 `CompanyEvent` (General Events)

**Location:** `prisma/schema.prisma` (lines 546-591)

**Location:** `prisma/schema.prisma` (lines 546-591)

### Structure
```prisma
model CompanyEvent {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Core Identity
  title       String
  theme       String?
  description String?

  // Timing
  eventDate DateTime?
  startTime String?
  endTime   String?

  // Categorization
  eventCategory EventCategory?  // Enum: CELEBRATION, HERITAGE, COMMUNITY, RECOGNITION, APPRECIATION, FAMILY
  audience      EventAudience?  // Enum: ALL_WORKFORCE, LEADERS, WORKFORCE_AND_FAMILIES, COMMUNITY

  // Registration
  registrationRequired String?
  registrationLink     String?

  // Event Details
  vibe          String?
  perks         String[]       @default([])
  participation String[]       @default([])
  speakers      String[]       @default([])

  // Food
  foodProvided String?
  foodTypes    String?

  // Contact
  pocEmail String?
  pocPhone String?

  // Ingestion
  ingestRawText String?
  summary       String?

  // Relations
  companyId         String?
  company           Company? @relation("CompanyEventCompany", ...)
  createdByWorkMeId String   @db.Uuid
  createdBy         WorkMe   @relation("CompanyEventCreator", ...)

  // Direct Submodels
  eventItems       EventItem[]       @relation
  oneOffEmailItems OneOffEmailItem[] @relation("OneOffEmailItemEvent")
  companyWork      CompanyWork[]     @relation

  @@index([companyId])
  @@index([createdByWorkMeId])
}
```

---

### 1.2 `CompanyLeaderEngagement` (Leadership Engagement Events) ⭐ **NEW**

**Location:** `prisma/schema.prisma` (after CompanyEvent)

**Purpose:** Dedicated model for leadership engagement events (town halls, all-hands, state-of-the-org meetings) where leaders are the principal speakers.

```prisma
model CompanyLeaderEngagement {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  title       String
  description String?

  // Event timing
  engagementDate DateTime?
  startTime      String?
  endTime        String?
  location       String?

  // Leadership engagement specific fields
  topicAreas         String[] @default([]) // Topics that will be covered
  potentialQuestions String[] @default([]) // Anticipated questions from audience
  keyMessages        String[] @default([]) // Key messages the leader wants to convey
  talkingPoints      String? // Detailed talking points or script

  // Leader information
  leaderName  String? // Name of the principal speaker/leader
  leaderTitle String? // Title/role of the leader
  leaderId    String? // Optional FK to CompanyEmployee

  // Audience
  audience      EventAudience?
  registrationRequired String?
  registrationLink     String?

  // Format details
  format String? // "Town Hall", "All-Hands", "Leadership Briefing", etc.
  qAndAEnabled Boolean @default(false) // Whether Q&A is enabled

  // Contact
  pocEmail String?
  pocPhone String?

  // Ingestion
  ingestRawText String?
  summary       String?

  // Relations
  companyId         String?
  company           Company? @relation("CompanyLeaderEngagementCompany", ...)
  createdByWorkMeId String   @db.Uuid
  createdBy         WorkMe   @relation("CompanyLeaderEngagementCreator", ...)

  oneOffEmailItems OneOffEmailItem[] @relation("OneOffEmailItemLeaderEngagement")
  companyWork      CompanyWork[]     @relation

  @@index([companyId])
  @@index([createdByWorkMeId])
  @@index([engagementDate])
  @@index([leaderId])
}
```

**Key Features:**
- **State-of-the-Org Focus:** Designed for leadership communication events
- **Topic Areas:** Array of topics to be covered
- **Potential Questions:** Anticipated audience questions
- **Key Messages:** Structured messaging framework
- **Talking Points:** Detailed script/prep material
- **Leader Tracking:** Links to CompanyEmployee if leader exists in system
- **Q&A Support:** Flag for Q&A sessions

**Usage:**
- Town halls
- All-hands meetings
- Leadership briefings
- State-of-the-organization presentations
- Executive updates

---

## 2. Direct Submodels (Using `eventId`)

### 2.1 `EventItem` ⭐ **PRIMARY SUBMODEL**

**Location:** `prisma/schema.prisma` (lines 593-606)

**Relationship:** Direct child of `CompanyEvent` via `eventId` (CASCADE delete)

```prisma
model EventItem {
  id      String       @id @default(cuid())
  eventId String       // FK to CompanyEvent.id
  event   CompanyEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)

  title       String
  description String?
  metadata    Json?        // Flexible storage for agenda items, promotional data, etc.

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([eventId])
}
```

**Purpose:**
- Stores event-specific items (agenda items, promotional materials, deliverables)
- Flexible `metadata` JSON field allows for various item types
- Used for event detail management

**Usage Examples:**
- Agenda items for town halls
- Promotional items for events
- Event-specific structured data

---

## 3. Indirect Relationships (Using `companyEventId`)

These models reference `CompanyEvent` via `companyEventId` (not `eventId`), creating indirect relationships:

### 3.1 `OneOffEmailItem`

**Location:** `prisma/schema.prisma` (lines 962-1001)

**Relationship:** Optional reference to `CompanyEvent` via `companyEventId`

```prisma
model OneOffEmailItem {
  id            String
  oneOffEmailId String
  
  // Polymorphic reference (one of these will be set)
  companyEventId         String?
  companyCampaignId      String?
  companyTrainingId      String?
  // ... other CompanyX references
  
  companyEvent CompanyEvent? @relation("OneOffEmailItemEvent", 
    fields: [companyEventId], 
    references: [id], 
    onDelete: Cascade
  )
  
  // ... other fields
}
```

**Purpose:** Links events to one-off email digest items

---

### 3.2 `CompanyWork`

**Location:** `prisma/schema.prisma` (lines 2735-2781)

**Relationship:** Optional reference to `CompanyEvent` via `companyEventId`

```prisma
model CompanyWork {
  id        String @id @default(uuid())
  companyId String

  // Polymorphic reference (one of these will be set)
  companyEventId         String?
  companyCampaignId      String?
  companyTrainingId      String?
  // ... other CompanyX references

  companyEvent CompanyEvent? @relation(
    fields: [companyEventId], 
    references: [id], 
    onDelete: SetNull
  )

  // Generic metadata
  title       String
  description String?
  workType    String? // "event", "campaign", "training", etc.

  // Relations
  contributions MyContribution[]
  skillItems    SkillItem[]
  contributionSummaries ContributionSummary[]
}
```

**Purpose:** Generic container linking company work to personal contributions and skill items

---

### 3.3 `SkillItem`

**Location:** `prisma/schema.prisma` (lines 2601-2639)

**Relationship:** Optional reference to `CompanyEvent` via `companyEventId`

```prisma
model SkillItem {
  id           String @id @default(uuid())
  skillTopicId String @db.Uuid

  // Evidence description
  title        String
  description  String?
  evidenceType String? // "email", "event", "artifact", "meeting", "delivery", etc.

  occurredAt DateTime @default(now())

  // Optional reference to company work
  companyWorkId String?
  companyWork   CompanyWork? @relation(...)

  // Optional direct reference to specific company work types
  companyEventId         String?
  companyCampaignId      String?
  // ... other CompanyX references
  
  companyEvent CompanyEvent? @relation(...)
  
  // Relations
  skillTopic SkillTopic @relation(...)
}
```

**Purpose:** Links events to skill demonstration evidence

---

### 3.4 `PlannedItem`

**Location:** `prisma/schema.prisma` (lines 2370-2400)

**Relationship:** Optional reference via `sourceEventId` (not `companyEventId`)

```prisma
model PlannedItem {
  id                 String
  plannerContainerId String

  companyId      String
  divisionUnitId String?

  // Optional source links (nullable FK placeholders)
  sourceEventId    String?  // ⚠️ Note: This is a string, not a direct FK
  sourceCampaignId String?
  sourceProgramId  String?

  itemKind    String // e.g. "event", "series", "campaign", free text
  title       String
  description String?

  plannedTimeLabel  String // REQUIRED human-readable time
  plannedTimeAnchor DateTime? // nullable, for sorting only

  notes String?
}
```

**Purpose:** Planning/staging area for future events (conceptual, not actual events)

**Note:** `sourceEventId` is a string placeholder, not a direct foreign key relationship.

---

### 3.5 `ProductDigitalSignCompanyEvent`

**Location:** `prisma/schema.prisma` (lines 1088-1102)

**Relationship:** **NO DIRECT FK** - This is a variant model for digital signage products

```prisma
model ProductDigitalSignCompanyEvent {
  id            String @id @default(cuid())
  digitalSignId String @unique

  eventName        String
  eventDate        DateTime?
  startTime        String?
  endTime          String?
  location         String?
  description      String?
  perks            String[]  @default([])
  registrationLink String?

  signage ProductDigitalSign @relation(
    fields: [digitalSignId], 
    references: [id], 
    onDelete: Cascade
  )
}
```

**Purpose:** Digital signage product variant for displaying event information

**Important:** This model does **NOT** have a direct FK to `CompanyEvent`. It stores event information independently for digital signage display purposes. The relationship is conceptual - you could link them via `eventName` or other matching logic, but there's no enforced database relationship.

---

## 4. Event Categorization

### 4.1 `EventCategory` Enum

**Location:** `prisma/schema.prisma` (lines 144-151)

```prisma
enum EventCategory {
  CELEBRATION    // Holiday events, parties
  HERITAGE       // DEI, cultural events
  COMMUNITY      // Outreach, external events
  RECOGNITION    // Awards ceremonies
  APPRECIATION   // Thank-you events, morale
  FAMILY         // Family day events
}
```

### 4.2 `EventAudience` Enum

**Location:** `prisma/schema.prisma` (lines 137-142)

```prisma
enum EventAudience {
  ALL_WORKFORCE           // All employees
  LEADERS                 // Leadership only
  WORKFORCE_AND_FAMILIES  // Includes families
  COMMUNITY               // External community
}
```

---

## 5. Answer: Town Hall & Senior Leadership Engagement

### ❌ **No Dedicated Models**

There are **NO specific submodels** for:
- Town Hall events
- Senior Leadership Engagement events

### ✅ **How They're Represented**

These event types are represented as **`CompanyEvent` instances** with appropriate categorization:

**Town Hall Example:**
```typescript
{
  title: "Q4 Town Hall",
  eventCategory: "COMMUNITY", // or "CELEBRATION" depending on context
  audience: "ALL_WORKFORCE",  // or "LEADERS" if leadership-only
  speakers: ["CEO", "CFO", "CTO"],
  // ... other event fields
}
```

**Senior Leadership Engagement Example:**
```typescript
{
  title: "Senior Leadership Strategy Session",
  eventCategory: "RECOGNITION", // or appropriate category
  audience: "LEADERS",  // Key indicator
  speakers: ["Executive Director", "Deputy Director"],
  // ... other event fields
}
```

### Event Items for Town Halls

Town halls would use `EventItem` for:
- Agenda items (stored in `EventItem.metadata`)
- Q&A topics
- Presentation topics
- Discussion points

Example:
```typescript
// EventItem for town hall agenda
{
  eventId: "town-hall-event-id",
  title: "Q4 Financial Review",
  description: "CFO presents quarterly results",
  metadata: {
    type: "AGENDA_ITEM",
    speaker: "CFO",
    duration: "30 minutes",
    order: 1
  }
}
```

---

## 6. Summary Table

| Model | FK Field | Relationship Type | Delete Behavior | Purpose |
|-------|----------|-------------------|-----------------|---------|
| **EventItem** | `eventId` | Direct child | CASCADE | Event-specific items (agenda, promotional) |
| **OneOffEmailItem** | `companyEventId` | Optional reference | CASCADE | Link events to email digests |
| **CompanyWork** | `companyEventId` | Optional reference | SET NULL | Bridge to personal contributions |
| **SkillItem** | `companyEventId` | Optional reference | Not specified | Link events to skill evidence |
| **PlannedItem** | `sourceEventId` | String placeholder | N/A | Planning/staging (not FK) |
| **ProductDigitalSignCompanyEvent** | None | Conceptual only | N/A | Digital signage display |
| **CompanyLeaderEngagement** | N/A | Standalone model | N/A | Leadership engagement events (separate from CompanyEvent) |

---

## 7. Key Insights

1. **Primary Submodel:** `EventItem` is the only direct child model using `eventId`
2. **Flexible Structure:** `EventItem.metadata` JSON field allows for various event item types
3. **Dedicated Leadership Model:** `CompanyLeaderEngagement` is a separate model for leadership engagement events (town halls, all-hands, state-of-the-org)
4. **Indirect Relationships:** Most other models use `companyEventId` or `companyLeaderEngagementId` for optional references
5. **Digital Signage:** `ProductDigitalSignCompanyEvent` is independent - no FK relationship to `CompanyEvent`

---

## 8. Recommendations

### For Town Hall / Leadership Events:

1. **Use `CompanyLeaderEngagement` model** for leadership engagement events (town halls, all-hands, state-of-the-org)
2. **Use `topicAreas`** array for topics to be covered
3. **Use `potentialQuestions`** array for anticipated audience questions
4. **Use `keyMessages`** array for structured messaging
5. **Use `talkingPoints`** field for detailed script/prep material
6. **Link to `CompanyEmployee`** via `leaderId` if the leader exists in the system
7. **Use `format` field** to specify event type (e.g., "Town Hall", "All-Hands", "Leadership Briefing")

### Current Architecture Supports:
- ✅ Multiple event items per event
- ✅ Flexible metadata storage
- ✅ Event categorization via enums
- ✅ Audience targeting
- ✅ Integration with email digests
- ✅ Integration with work tracking (CompanyWork, SkillItem)

---

**Last Updated:** 2025-01-XX
**Schema Version:** Current (as of analysis date)

