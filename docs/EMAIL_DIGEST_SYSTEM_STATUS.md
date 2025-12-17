# Email Digest System - Current State

**Last Updated:** 2025-12-17  
**Status:** 🚧 Partially Implemented - Needs Architecture Clarity

---

## 🎯 EXECUTIVE SUMMARY

The email digest system is **partially implemented** with a foggy architecture. We have:
- ✅ Product/Series creation (WorkForceEnduringProdEmailDigest)
- ✅ Edition generation (EmailDigestEdition)
- ❌ **MISSING**: Item-level linking to CompanyX models
- ❌ **MISSING**: Clear UX for curating which CompanyX items go into each edition

**Current Implementation:** Dumps ALL CompanyX data into a prompt → OpenAI generates content → Store as JSON

**Intended Architecture (from memory):**
```
WorkForceEnduringProdEmailDigest (Series)
  ↓
EmailDigestEdition (Container for one issue)
  ↓
EmailDigestItem (Individual pieces linking to CompanyX)
  ↓
CompanyEvent, CompanyCampaign, CompanyTraining, etc.
```

---

## 📊 CURRENT DATABASE SCHEMA

### WorkForceEnduringProdEmailDigest
**Purpose:** Recurring email digest series (e.g., "Weekly Workforce Update")

```prisma
model WorkForceEnduringProdEmailDigest {
  id                String   @id @default(uuid())
  title             String
  description       String?
  companyId         String   // ✅ FIXED: Was companyUnit (deprecated)
  createdByWorkMeId String   @db.Uuid
  createdAt         DateTime @default(now())

  createdBy WorkMe               @relation(...)
  editions  EmailDigestEdition[]

  @@index([companyId])
  @@index([createdByWorkMeId])
  @@index([createdAt])
}
```

**What Exists:**
- ✅ Can create a series (product)
- ✅ Has title, description
- ✅ Scoped to companyId
- ❌ No metadata about frequency (weekly, monthly, etc.)
- ❌ No configuration for which CompanyX types to include

---

### EmailDigestEdition
**Purpose:** Individual edition/issue of a digest series

```prisma
model EmailDigestEdition {
  id            String                           @id @default(uuid())
  emailDigestId String
  product       WorkForceEnduringProdEmailDigest @relation(...)

  contentJson  Json      // ⚠️ Currently stores entire generated content as blob
  generatedAt  DateTime  @default(now())
  originatorId String
  companyId    String    // ✅ FIXED: Was companyUnit (deprecated)

  @@index([emailDigestId])
  @@index([companyId])
  @@index([generatedAt])
}
```

**What Exists:**
- ✅ Can generate editions for a series
- ✅ Stores generated content as JSON
- ❌ No granular tracking of which CompanyX items are included
- ❌ No way to curate/select specific items before generation
- ❌ No relation to individual CompanyX records

---

### 🚨 MISSING: EmailDigestItem

**What We Expected (from memory):**
```prisma
model EmailDigestItem {
  id        String @id @default(cuid())
  editionId String
  edition   EmailDigestEdition @relation(...)
  
  // One of these would be set (links to CompanyX)
  companyEventId       String?
  companyCampaignId    String?
  companyTrainingId    String?
  companyBenefitsId    String?
  // ... etc
  
  order       Int     // Display order in digest
  generatedBy String? // "AI" or "MANUAL"
  contentJson Json?   // Item-specific generated content
}
```

**Status:** ❌ DOES NOT EXIST IN SCHEMA

---

## 💻 CURRENT CODE IMPLEMENTATION

### File: `lib/actions/email-digest.ts`

#### createEmailDigestProduct()
```typescript
// ✅ WORKS: Creates a series
const product = await prisma.workForceEnduringProdEmailDigest.create({
  data: {
    title: validated.title,
    description: validated.description,
    companyId,
    createdByWorkMeId: workMeId,
  },
})
```

**Status:** ✅ Working

---

#### createEmailDigestEdition()
```typescript
// 1. ⚠️ QUERIES ALL COMPANYX DATA (no filtering/curation)
const [events, campaigns, trainings, benefits, ...] = await Promise.all([
  prisma.companyEvent.findMany({ where: { companyId } }),
  prisma.companyCampaign.findMany({ where: { companyId } }),
  // ... etc for all 8 CompanyX models
])

// 2. ⚠️ BUILDS TEXT PROMPT FROM EVERYTHING
const summaries: string[] = []
if (events.length > 0) {
  summaries.push('EVENTS:')
  events.forEach((event) => {
    summaries.push(`- ${event.title}: ${event.summary || event.description}`)
  })
}
// ... repeat for all types

// 3. ⚠️ DUMPS EVERYTHING TO OPENAI (placeholder)
const generatedContent = await generateEmailDigestContent(promptText, product.title)

// 4. ⚠️ STORES ENTIRE RESULT AS JSON BLOB
const edition = await prisma.emailDigestEdition.create({
  data: {
    emailDigestId,
    contentJson: generatedContent,  // No granular tracking
    originatorId: workMeId,
    companyId,
  },
})
```

**Problems:**
- ❌ No way to select which items to include
- ❌ No way to exclude certain events/campaigns
- ❌ No tracking of which specific items are in the edition
- ❌ No way to reorder items
- ❌ OpenAI integration is just a placeholder (returns dummy data)

---

#### generateEmailDigestContent() (Placeholder)
```typescript
async function generateEmailDigestContent(promptText: string, productTitle: string): Promise<any> {
  // TODO: Implement actual OpenAI API integration
  return {
    subject: `${productTitle} - ${new Date().toLocaleDateString()}`,
    body: `This is a placeholder...\n\n${promptText.substring(0, 500)}...`,
    generatedAt: new Date().toISOString(),
  }
}
```

**Status:** ⚠️ Not implemented - just returns placeholder data

---

## 🎨 CURRENT UX

### Entry Points

1. **`/workforce/enduring/email-digest`** - List all series
   - Shows all email digest series (products)
   - Has "+ Create New Product" card
   - **Status:** ✅ Working

2. **`/workforce/enduring/email-digest/new`** - Create series
   - Form: Title, Description
   - Now clearly labeled as "Recurring Email Series"
   - **Status:** ✅ Working (just updated UX)

3. **`/workforce/enduring/email-digest/[id]`** - View series detail
   - Shows series info
   - Lists editions (most recent)
   - Has "+ Generate New Edition" button
   - **Status:** ✅ Working

4. **`/workforce/enduring/email-digest/[id]/editions`** - All editions
   - Lists all editions for a series
   - **Status:** ✅ Working

5. **`/workforce/enduring/email-digest/[id]/editions/[editionId]`** - View edition
   - Shows generated edition content
   - **Status:** ⚠️ Exists but probably needs work

---

### What's Missing in UX

❌ **NO CURATION STEP**
- When clicking "Generate New Edition", it immediately:
  1. Queries ALL CompanyX data
  2. Dumps to OpenAI
  3. Generates edition

- **Should be:**
  1. Show selection UI: "Which items do you want in this edition?"
  2. User checks events, campaigns, trainings, etc.
  3. User can reorder, add notes
  4. THEN generate edition with selected items

❌ **NO PREVIEW/EDIT FLOW**
- After generation, edition is stored as final JSON blob
- No way to edit/regenerate
- No way to see which items were included

❌ **NO ITEM TRACKING**
- Can't see "This edition included 3 events, 2 campaigns, 1 training"
- Can't click on an item to see the source CompanyEvent/etc.

---

## 🏗️ INTENDED ARCHITECTURE (Reconstructed)

Based on the "EmailDigestItem" concept you mentioned:

```
User Flow:
1. Create Series (WorkForceEnduringProdEmailDigest)
   ↓
2. Start New Edition (EmailDigestEdition created in DRAFT status)
   ↓
3. CURATION STEP (NEW - doesn't exist yet):
   - Show all available CompanyX items (events, campaigns, etc.)
   - User selects which to include
   - For each selected item, create EmailDigestItem record
   - User can reorder EmailDigestItem records
   ↓
4. GENERATE (OpenAI):
   - Read EmailDigestItem records for this edition
   - For each item, read linked CompanyX data
   - Build prompt with SELECTED items only
   - Generate content (subject, body, sections)
   - Store as EmailDigestEdition.contentJson
   ↓
5. PREVIEW/EDIT
   - Show generated content
   - Allow regeneration
   ↓
6. FINALIZE/SEND
   - Mark edition as SENT
   - Trigger email delivery
```

---

## 🔧 WHAT NEEDS TO BE BUILT

### 1. Database Changes

#### Add EmailDigestItem Model
```prisma
model EmailDigestItem {
  id        String   @id @default(cuid())
  editionId String
  edition   EmailDigestEdition @relation(...)
  
  // Link to one CompanyX model
  companyEventId         String?
  companyCampaignId      String?
  companyTrainingId      String?
  companyBenefitsId      String?
  companyImpactEventId   String?
  companyCommunityId     String?
  companyCareerId        String?
  companyEmployeeCauseId String?
  
  // Relations (nullable)
  companyEvent         CompanyEvent?         @relation(...)
  companyCampaign      CompanyCampaign?      @relation(...)
  companyTraining      CompanyTraining?      @relation(...)
  companyBenefits      CompanyBenefits?      @relation(...)
  companyImpactEvent   CompanyImpactEvent?   @relation(...)
  companyCommunity     CompanyCommunity?     @relation(...)
  companyCareer        CompanyCareer?        @relation(...)
  companyEmployeeCause CompanyEmployeeCause? @relation(...)
  
  order       Int      // Display order
  notes       String?  // User notes for this item
  createdAt   DateTime @default(now())
  
  @@index([editionId])
  @@index([companyEventId])
  // ... indexes for all CompanyX FKs
}
```

#### Add Edition Status
```prisma
enum EditionStatus {
  DRAFT       // Being curated
  GENERATING  // OpenAI in progress
  GENERATED   // OpenAI complete, ready for review
  SENT        // Finalized and sent
}

// Add to EmailDigestEdition:
model EmailDigestEdition {
  // ... existing fields
  status DigestEditionStatus @default(DRAFT)
  items  EmailDigestItem[]
}
```

---

### 2. UX/Pages to Build

#### `/workforce/enduring/email-digest/[id]/editions/new`
**Purpose:** Curation step before generation

**UI:**
```
┌─────────────────────────────────────────────────────────┐
│ Create New Edition: Weekly Workforce Update             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Select items to include in this edition:                │
│                                                          │
│ ┌─ EVENTS ─────────────────────────────────────────┐  │
│ │ ☑ Holiday Party (Dec 20, 2025)                   │  │
│ │ ☑ All Hands Meeting (Dec 18, 2025)               │  │
│ │ ☐ Team Building (Jan 5, 2026) [future event]     │  │
│ └──────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ CAMPAIGNS ──────────────────────────────────────┐  │
│ │ ☑ Blood Drive - ends Dec 22                      │  │
│ │ ☐ Q1 Wellness Challenge [not active]             │  │
│ └──────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ TRAININGS ──────────────────────────────────────┐  │
│ │ ☑ Cybersecurity Awareness Training (Due Dec 31)  │  │
│ └──────────────────────────────────────────────────┘  │
│                                                          │
│ [Cancel]  [Save Draft]  [Generate Edition →]           │
└─────────────────────────────────────────────────────────┘
```

**Actions:**
1. `saveEditionDraft()` - Create EmailDigestEdition (DRAFT) + EmailDigestItem records
2. `generateEdition()` - Trigger OpenAI generation

---

#### `/workforce/enduring/email-digest/[id]/editions/[editionId]/edit`
**Purpose:** Reorder items, add notes, regenerate

**UI:**
```
┌─────────────────────────────────────────────────────────┐
│ Edit Edition (Draft)                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Selected Items (3):                                      │
│                                                          │
│ ┌─ 1. Holiday Party ──────────────────────────────┐  │
│ │ [↑] [↓] [×]                                       │  │
│ │ CompanyEvent • Dec 20, 2025                       │  │
│ │ Notes: [Emphasize family-friendly aspect]        │  │
│ └──────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ 2. Blood Drive ────────────────────────────────┐  │
│ │ [↑] [↓] [×]                                       │  │
│ │ CompanyCampaign • Ends Dec 22                     │  │
│ │ Notes: [                                  ]       │  │
│ └──────────────────────────────────────────────────┘  │
│                                                          │
│ [+ Add More Items]                                      │
│                                                          │
│ [Cancel]  [Save Draft]  [Generate Edition →]           │
└─────────────────────────────────────────────────────────┘
```

---

### 3. Server Actions to Build/Update

#### `lib/actions/email-digest.ts`

**New Functions:**

```typescript
/**
 * Create edition in DRAFT status with selected items
 */
export async function createEditionDraft(data: {
  emailDigestId: string
  items: Array<{
    companyEventId?: string
    companyCampaignId?: string
    // ... other CompanyX FKs
    order: number
    notes?: string
  }>
})

/**
 * Update edition items (reorder, add, remove)
 */
export async function updateEditionItems(data: {
  editionId: string
  items: Array<{
    id?: string  // Existing item ID (if updating)
    companyEventId?: string
    // ... other CompanyX FKs
    order: number
    notes?: string
  }>
})

/**
 * Generate content using OpenAI (replaces current placeholder)
 */
export async function generateEditionContent(editionId: string)
```

**Updated Function:**

```typescript
/**
 * OLD: Queries ALL CompanyX and generates immediately
 * NEW: Should read EmailDigestItem records for this edition
 */
export async function createEmailDigestEdition(data: {
  emailDigestId: string
  // Removed: no longer queries all CompanyX here
}) {
  // 1. Create empty edition in DRAFT status
  const edition = await prisma.emailDigestEdition.create({
    data: {
      emailDigestId,
      status: 'DRAFT',
      companyId,
      originatorId: workMeId,
      contentJson: {},  // Empty until generated
    },
  })
  
  // 2. Return edition ID → redirect to curation page
  return { success: true, edition, redirectTo: `/workforce/enduring/email-digest/${emailDigestId}/editions/${edition.id}/curate` }
}
```

---

### 4. OpenAI Integration

**Current:** Placeholder function returning dummy data

**Needs:**
```typescript
async function generateEmailDigestContent(
  edition: EmailDigestEdition & {
    items: EmailDigestItem[] & {
      companyEvent?: CompanyEvent
      companyCampaign?: CompanyCampaign
      // ... etc
    }
  },
  productTitle: string
): Promise<{
  subject: string
  body: string
  sections: Array<{
    type: 'event' | 'campaign' | 'training' | ...
    sourceId: string  // CompanyX ID
    title: string
    content: string
  }>
}> {
  // 1. Build prompt from SELECTED items only
  const prompt = buildPromptFromItems(edition.items)
  
  // 2. Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a workforce communications expert...' },
      { role: 'user', content: prompt },
    ],
  })
  
  // 3. Parse response
  const generated = parseOpenAIResponse(response)
  
  // 4. Update edition
  await prisma.emailDigestEdition.update({
    where: { id: edition.id },
    data: {
      contentJson: generated,
      status: 'GENERATED',
    },
  })
  
  return generated
}
```

---

## 🎯 DECISION POINTS

### 1. Edition Status Flow

**Option A: Simple (2 states)**
- DRAFT → SENT
- User curates, generates, sends

**Option B: Full (4 states)**
- DRAFT → GENERATING → GENERATED → SENT
- Allows tracking of generation progress
- Allows preview before sending

**Recommendation:** Start with Option A, add states as needed

---

### 2. Item Linking Model

**Current Assumption:** EmailDigestItem with nullable FKs to each CompanyX model

**Alternative:** Use polymorphic JSON field
```prisma
model EmailDigestItem {
  itemType String // "CompanyEvent", "CompanyCampaign", etc.
  itemId   String // UUID of CompanyX record
  itemData Json?  // Cached snapshot of CompanyX data
}
```

**Recommendation:** Stick with explicit FKs (current assumption) for:
- Type safety
- Query efficiency
- Referential integrity

---

### 3. When to Query CompanyX Data

**Option A: At Curation Time**
- Query all CompanyX when showing selection UI
- Fresh data, may be slow

**Option B: Cache in Edition**
- Store snapshot of CompanyX data in EmailDigestItem
- Faster, but data may be stale

**Recommendation:** Option A (fresh data) for MVP

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Data Model ✅ **COMPLETE**
- [x] WorkForceEnduringProdEmailDigest model
- [x] EmailDigestEdition model
- [x] Fix companyUnit → companyId
- [x] Add EmailDigestItem model
- [x] Add EditionStatus enum
- [x] Add status field to EmailDigestEdition
- [x] Prisma Client generated
- [ ] Migration (skipped - schema updated, DB migration pending)

### Phase 2: Server Actions ✅ **COMPLETE**
- [x] API: `createEmailDigestEdition()` - create DRAFT edition
- [x] API: `getAvailableCompanyXItems()` - query all CompanyX for curation
- [x] API: `updateEditionItems()` - modify item selection
- [x] API: `getEditionWithItems()` - get edition with items and CompanyX data
- [x] API: `generateEditionContent()` - trigger OpenAI (placeholder)
- [x] Helper: `buildPromptFromItems()` - build prompt from selected items

### Phase 3: Curation UX ⚠️ **PARTIALLY DONE**
- [ ] Build `/workforce/enduring/email-digest/[id]/editions/[editionId]/curate` (selection page)
- [ ] UI: CompanyX item selector (checkboxes, categories)
- [ ] UI: Reorder items (drag-and-drop or arrows)
- [x] Updated product page to redirect to edition after creation

### Phase 4: Generation ⚠️ **READY FOR OPENAI**
- [x] API: `generateEditionContent()` implemented with status flow
- [ ] Implement actual OpenAI integration (currently placeholder)
- [x] Build prompt from EmailDigestItem records
- [x] Edition status flow (DRAFT → GENERATING → GENERATED)

### Phase 4: Preview/Edit
- [ ] Build `/workforce/enduring/email-digest/[id]/editions/[editionId]` (preview)
- [ ] Show generated content with formatting
- [ ] Add "Regenerate" button
- [ ] Add "Send" button

### Phase 5: Sending (Future)
- [ ] Email delivery integration
- [ ] Track sent status
- [ ] Recipient management

---

## 🚨 CURRENT BLOCKERS

1. **No EmailDigestItem model** - Can't link editions to specific CompanyX records
2. **No curation UX** - Goes straight from series → generate → done
3. **OpenAI is placeholder** - Just returns dummy text
4. **No edition status tracking** - Can't tell DRAFT vs GENERATED vs SENT
5. **companyUnit → companyId migration not run** - Schema updated, but DB not migrated

---

## 🎬 NEXT STEPS

### Recommended Path Forward:

1. **Clarify Requirements** (Do Now)
   - Review this doc with team
   - Decide on item linking model (explicit FKs vs polymorphic)
   - Decide on edition status flow (2-state vs 4-state)

2. **Add EmailDigestItem Model** (1-2 hours)
   - Update schema.prisma
   - Create migration
   - Run migration

3. **Build Curation UX** (4-6 hours)
   - Create selection page
   - API for draft creation
   - CompanyX item selector UI

4. **Implement OpenAI Generation** (2-4 hours)
   - Replace placeholder function
   - Integrate actual OpenAI API
   - Build prompt from items

5. **Polish & Test** (2-3 hours)
   - Preview page
   - Regeneration flow
   - End-to-end testing

**Total Estimate:** 10-15 hours to complete MVP

---

**End of Document**
