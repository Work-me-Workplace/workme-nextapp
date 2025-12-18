# Email Digest System - Data Hierarchy & Nesting

**Last Updated:** 2025-12-17  
**Status:** ✅ Schema Complete, 🚧 UX In Progress

---

## 🏗️ THE HIERARCHY (How Things Nest)

```
┌─────────────────────────────────────────────────────────────────┐
│ WorkForceEnduringProdEmailDigest                                │  ← TOP LEVEL
│ (The recurring series)                                          │
│                                                                 │
│ • id, title, description                                        │
│ • companyId (scoping)                                           │
│ • createdByWorkMeId (who created it)                            │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ EmailDigestEdition                                          │ │  ← EDITION (Instance)
│ │ (One issue of the series)                                   │ │
│ │                                                             │ │
│ │ • id, emailDigestId (FK to parent series)                   │ │
│ │ • status: DRAFT | GENERATING | GENERATED | SENT             │ │
│ │ • contentJson (AI-generated content)                        │ │
│ │ • originatorId, companyId                                   │ │
│ │                                                             │ │
│ │ ┌───────────────────────────────────────────────────────┐  │ │
│ │ │ EmailDigestItem                                       │  │ │  ← ITEM (Bolt-on)
│ │ │ (Links edition to specific CompanyX content)         │  │ │
│ │ │                                                       │  │ │
│ │ │ • id, editionId (FK to parent edition)                │  │ │
│ │ │ • order (display sequence)                            │  │ │
│ │ │ • notes (user notes for this item)                    │  │ │
│ │ │                                                       │  │ │
│ │ │ ONE OF THESE (nullable FKs):                          │  │ │
│ │ │   • companyEventId         → CompanyEvent         ──────────► CompanyX Models
│ │ │   • companyCampaignId      → CompanyCampaign      ──────────►
│ │ │   • companyTrainingId      → CompanyTraining      ──────────►
│ │ │   • companyBenefitsId      → CompanyBenefits      ──────────►
│ │ │   • companyImpactEventId   → CompanyImpactEvent   ──────────►
│ │ │   • companyCommunityId     → CompanyCommunity     ──────────►
│ │ │   • companyCareerId        → CompanyCareer        ──────────►
│ │ │   • companyEmployeeCauseId → CompanyEmployeeCause ──────────►
│ │ │                                                       │  │ │
│ │ └───────────────────────────────────────────────────────┘  │ │
│ │                                                             │ │
│ │ Can have MANY items (0 to N)                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Can have MANY editions (0 to N)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE MODELS (Current Schema)

### 1. WorkForceEnduringProdEmailDigest (TOP LEVEL)

**Purpose:** The recurring email series container

```prisma
model WorkForceEnduringProdEmailDigest {
  id                String   @id @default(uuid())
  title             String   // "Weekly Update", "Monthly Digest"
  description       String?
  companyId         String   // Which company this belongs to
  createdByWorkMeId String   @db.Uuid
  createdAt         DateTime @default(now())

  createdBy WorkMe               @relation("EmailDigestProductCreator", ...)
  editions  EmailDigestEdition[] // Has many editions

  @@index([companyId])
  @@index([createdByWorkMeId])
  @@index([createdAt])
}
```

**What it is:**
- ✅ A recurring email series (e.g., "Weekly Team Update")
- ✅ Container for multiple editions over time
- ✅ Scoped to one company
- ❌ NOT a one-off email (that's `WorkForceOneOffEmailDigest`)

**Real-world example:**
```
title: "Weekly Workforce Digest"
description: "Weekly roundup of events, benefits, and opportunities"
companyId: "acme-corp-123"
editions: [Edition #1, Edition #2, Edition #3, ...]
```

---

### 2. EmailDigestEdition (EDITION - Child of Series)

**Purpose:** One issue/instance of the recurring series

```prisma
enum EmailDigestEditionStatus {
  DRAFT       // Being curated, items being selected
  GENERATING  // OpenAI generation in progress
  GENERATED   // Content generated, ready for review
  SENT        // Finalized and sent
}

model EmailDigestEdition {
  id            String                   @id @default(uuid())
  emailDigestId String                   // FK to parent series
  product       WorkForceEnduringProdEmailDigest @relation(...)

  status       EmailDigestEditionStatus @default(DRAFT)
  contentJson  Json?                    // AI-generated content (null until GENERATED)
  generatedAt  DateTime                 @default(now())
  originatorId String
  companyId    String

  items EmailDigestItem[] // Has many items (bolted on)

  @@index([emailDigestId])
  @@index([companyId])
  @@index([generatedAt])
  @@index([status])
}
```

**What it is:**
- ✅ One specific edition (e.g., "December 17, 2025 edition")
- ✅ Contains links to specific CompanyX items via `EmailDigestItem`
- ✅ Stores the final AI-generated content in `contentJson`
- ✅ Has a lifecycle status (DRAFT → GENERATING → GENERATED → SENT)

**Real-world example:**
```
emailDigestId: "weekly-digest-123"
status: "GENERATED"
contentJson: {
  subject: "Weekly Update - December 17, 2025",
  body: "<html>...",
  sections: [...]
}
items: [
  EmailDigestItem(companyEventId: "holiday-party"),
  EmailDigestItem(companyCampaignId: "blood-drive"),
  EmailDigestItem(companyTrainingId: "cybersec-training")
]
```

---

### 3. EmailDigestItem (ITEM - Bolted on to Edition)

**Purpose:** Links an edition to specific CompanyX content

```prisma
model EmailDigestItem {
  id        String             @id @default(cuid())
  editionId String
  edition   EmailDigestEdition @relation(fields: [editionId], references: [id], onDelete: Cascade)

  // ONE of these will be set (nullable FKs)
  companyEventId         String?
  companyCampaignId      String?
  companyTrainingId      String?
  companyBenefitsId      String?
  companyImpactEventId   String?
  companyCommunityId     String?
  companyCareerId        String?
  companyEmployeeCauseId String?

  // Relations to CompanyX models (nullable)
  companyEvent         CompanyEvent?         @relation("EmailDigestItemEvent", ...)
  companyCampaign      CompanyCampaign?      @relation("EmailDigestItemCampaign", ...)
  companyTraining      CompanyTraining?      @relation("EmailDigestItemTraining", ...)
  companyBenefits      CompanyBenefits?      @relation("EmailDigestItemBenefits", ...)
  companyImpactEvent   CompanyImpactEvent?   @relation("EmailDigestItemImpactEvent", ...)
  companyCommunity     CompanyCommunity?     @relation("EmailDigestItemCommunity", ...)
  companyCareer        CompanyCareer?        @relation("EmailDigestItemCareer", ...)
  companyEmployeeCause CompanyEmployeeCause? @relation("EmailDigestItemEmployeeCause", ...)

  order     Int      // Display order in edition (1, 2, 3, ...)
  notes     String?  // User notes for this item
  createdAt DateTime @default(now())

  @@index([editionId])
  @@index([companyEventId])
  @@index([companyCampaignId])
  @@index([companyTrainingId])
  @@index([companyBenefitsId])
  @@index([companyImpactEventId])
  @@index([companyCommunityId])
  @@index([companyCareerId])
  @@index([companyEmployeeCauseId])
  @@index([order])
}
```

**What it is:**
- ✅ A "pointer" from an edition to a specific CompanyX item
- ✅ Allows curation (user picks which items to include)
- ✅ Has order (for sequencing in the digest)
- ✅ Has notes (user can add context for AI generation)
- ✅ One item = one link to one CompanyX model

**Real-world example:**
```
editionId: "edition-dec-17-2025"
companyEventId: "holiday-party-123"
companyCampaignId: null
companyTrainingId: null
... (all other FKs are null)
order: 1
notes: "Emphasize family-friendly, mention gift exchange"
```

---

## 🔄 THE LIFECYCLE (How Data Flows)

### Creating a Recurring Email Digest (Full Flow)

```
STEP 1: Create Series
─────────────────────────────────────────────────────────────
User creates WorkForceEnduringProdEmailDigest
  ↓
{
  id: "series-123",
  title: "Weekly Team Update",
  description: "Weekly roundup",
  companyId: "acme-corp",
  editions: []  ← Empty at first
}


STEP 2: Start New Edition (Auto-created on series creation - A3)
─────────────────────────────────────────────────────────────
System creates EmailDigestEdition in DRAFT status
  ↓
{
  id: "edition-456",
  emailDigestId: "series-123",  ← Links to parent series
  status: "DRAFT",
  contentJson: null,  ← Empty until generated
  items: []  ← Empty at first
}


STEP 3: Curate Content (SELECT ITEMS) ← 🚧 UX TO BUILD
─────────────────────────────────────────────────────────────
User selects which CompanyX items to include
  ↓
For each selected item, create EmailDigestItem:

{
  id: "item-1",
  editionId: "edition-456",  ← Links to parent edition
  companyEventId: "holiday-party-123",  ← Links to CompanyEvent
  order: 1,
  notes: "Emphasize family-friendly"
}

{
  id: "item-2",
  editionId: "edition-456",
  companyCampaignId: "blood-drive-456",  ← Links to CompanyCampaign
  order: 2,
  notes: null
}

{
  id: "item-3",
  editionId: "edition-456",
  companyTrainingId: "cybersec-789",  ← Links to CompanyTraining
  order: 3,
  notes: "Deadline is Dec 31"
}


STEP 4: Generate Content (AI) ← ⚠️ OpenAI Placeholder Now
─────────────────────────────────────────────────────────────
User clicks "Generate"
  ↓
1. Set edition.status = "GENERATING"
  ↓
2. Query EmailDigestItem records for this edition
  ↓
3. For each item, load linked CompanyX data:
   - EmailDigestItem → companyEventId → CompanyEvent { title, description, ... }
   - EmailDigestItem → companyCampaignId → CompanyCampaign { ... }
   - etc.
  ↓
4. Build prompt from selected items ONLY (not all CompanyX)
   Prompt: "Create email digest with these items:
            1. Holiday Party (event): ...
            2. Blood Drive (campaign): ...
            3. Cybersecurity Training: ..."
  ↓
5. Call OpenAI API
  ↓
6. Store result in edition.contentJson
  ↓
7. Set edition.status = "GENERATED"
  ↓
{
  id: "edition-456",
  status: "GENERATED",  ← Updated
  contentJson: {  ← Populated by AI
    subject: "Weekly Update - December 17, 2025",
    body: "<html>...",
    sections: [
      { type: "event", sourceId: "holiday-party-123", title: "...", content: "..." },
      { type: "campaign", sourceId: "blood-drive-456", title: "...", content: "..." },
      { type: "training", sourceId: "cybersec-789", title: "...", content: "..." }
    ]
  }
}


STEP 5: Preview/Edit ← 🚧 UX TO BUILD
─────────────────────────────────────────────────────────────
User reviews generated content
Can click "Regenerate" to go back to Step 4
Can click "Send" to proceed to Step 6


STEP 6: Send ← 🚧 Future
─────────────────────────────────────────────────────────────
Set edition.status = "SENT"
Trigger email delivery
```

---

## 🎯 KEY CONCEPTS

### "Bolt-on" Explanation

**EmailDigestItem is "bolted on" to EmailDigestEdition**

This means:
- ✅ **Optional relationship** - Edition can exist without items (during DRAFT)
- ✅ **Many-to-one** - One edition has many items
- ✅ **Independent lifecycle** - Items are created/updated separately from edition
- ✅ **Granular linking** - Each item links to ONE specific CompanyX record

**Visual:**
```
Edition (container)
  ├─ Item 1 → CompanyEvent "Holiday Party"
  ├─ Item 2 → CompanyCampaign "Blood Drive"
  └─ Item 3 → CompanyTraining "Cybersecurity"
```

---

### Recurring vs One-Off

**Recurring Series (WorkForceEnduringProdEmailDigest):**
```
Series "Weekly Update"
  ├─ Edition: Dec 10, 2025
  ├─ Edition: Dec 17, 2025
  ├─ Edition: Dec 24, 2025
  └─ Edition: Dec 31, 2025
```

**One-Off Email (WorkForceOneOffEmailDigest):**
```
One-Off "Important Announcement - System Downtime"
  └─ Items (same structure as edition items)
  └─ contentJson (same generation flow)
```

**Key Difference:**
- Recurring: **Parent series** → Many editions over time
- One-Off: **Single email** → No parent, no editions, just items + content

---

## 🗂️ COMPARISON: Series vs One-Off

| Feature | Recurring Series | One-Off Email |
|---------|------------------|---------------|
| **Top Model** | `WorkForceEnduringProdEmailDigest` | `WorkForceOneOffEmailDigest` |
| **Container** | `EmailDigestEdition` | (The one-off IS the container) |
| **Items** | `EmailDigestItem` | `OneOffEmailItem` |
| **Status** | `EmailDigestEditionStatus` | `OneOffEmailStatus` |
| **Lifecycle** | Series → Edition → Items → Generate | One-Off → Items → Generate |
| **Use Case** | Weekly/monthly digests | Special announcements |

---

## 📋 CURRENT STATUS

### ✅ COMPLETE
- [x] Schema defined for all 3 models
- [x] Relations set up correctly
- [x] Prisma client generated
- [x] Database synced (`prisma db push`)
- [x] Server actions written (CRUD, generation, curation helpers)
- [x] Landing page with choice cards (A1)
- [x] Auto-redirect to curation after series creation (A3)
- [x] One-off email page placeholder (A4)

### 🚧 IN PROGRESS
- [ ] Curation UI (select items from CompanyX)
- [ ] Edition detail/preview page
- [ ] Actual OpenAI integration (currently placeholder)

### 🔮 FUTURE
- [ ] Email delivery
- [ ] Recipient management
- [ ] Scheduling/automation

---

## 🎬 NEXT: Building the Curation UX

Now that the hierarchy is clear, the next step is to build the **curation page**:

**Page:** `/workforce/enduring/email-digest/[id]/editions/[editionId]/curate`

**Flow:**
1. Query all CompanyX items for this company
2. Show categorized checkboxes (Events, Campaigns, Trainings, etc.)
3. User selects which to include
4. For each selected, create `EmailDigestItem` record
5. Allow reordering, notes
6. Click "Generate" → Trigger AI generation

**End of Document**
