# Email Digest - THE CORRECT ARCHITECTURE

**Last Updated:** 2025-12-17  
**Status:** ✅ **CLARITY ACHIEVED** - Now we know what to build

---

## 🎯 THE AHA MOMENT

Email digest is **TWO separate systems**:

1. **Item Factory** - Create individual digest items (with AI)
2. **Edition Builder** - Assemble items into editions (just concatenation)

---

## 🏭 SYSTEM 1: ITEM FACTORY (The Hard Part)

### Purpose
Create individual, formatted, reusable content pieces

### UX Flow
```
User → "Create Digest Item"
  ↓
SOURCE SELECTION:
  • Option A: "From WorkForce Stuff" (MAIN WAY)
    - Browse CompanyEvent, CompanyCampaign, CompanyTraining, etc.
    - Select: "Holiday Party" event
  • Option B: "Create My Own" (manual entry)
    - Free text input
  ↓
HYDRATE (load source data)
  ↓
USER CLICKS "GENERATE ITEM"
  ↓
AI FORMATS IT:
  Input:  CompanyEvent { title: "Holiday Party", description: "...", eventDate: "Dec 20" }
  Output: { 
    title: "🎄 Don't Miss Our Holiday Party!",
    body: "<p>Join us for our annual holiday celebration...</p>",
    cta: "RSVP Now",
    ctaUrl: "/events/holiday-party"
  }
  ↓
USER REVIEWS & EDITS
  - Can tweak the generated content
  - Can regenerate with different prompt
  ↓
SAVE TO CATALOGUE
  - EmailDigestItem created
  - Status: "READY"
  - Can be reused in multiple editions
```

### Database Model
```prisma
model EmailDigestItem {
  id String @id @default(cuid())
  
  // Optional link to source (can be null if manual)
  companyEventId         String?
  companyCampaignId      String?
  companyTrainingId      String?
  companyBenefitsId      String?
  companyImpactEventId   String?
  companyCommunityId     String?
  companyCareerId        String?
  companyEmployeeCauseId String?
  
  // Relations to sources
  companyEvent         CompanyEvent?         @relation(...)
  companyCampaign      CompanyCampaign?      @relation(...)
  // ... etc
  
  // THE ACTUAL FORMATTED CONTENT (this is the key!)
  formattedContent Json  // { title, body, cta, ctaUrl, imageUrl, ... }
  
  // Status lifecycle
  status String @default("DRAFT")  // DRAFT | READY | ARCHIVED
  
  // Metadata
  createdByWorkMeId String @db.Uuid
  companyId         String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Can be used in multiple editions (many-to-many)
  editionItems EmailDigestEditionItem[]
  
  @@index([companyId])
  @@index([status])
  @@index([createdByWorkMeId])
}
```

---

## 🏗️ SYSTEM 2: EDITION BUILDER (The Easy Part)

### Purpose
Assemble pre-made items into an edition

### UX Flow
```
User → Creates new edition for series
  ↓
BROWSE ITEM CATALOGUE
  - Shows all READY items for this company
  - Filter by type, date, etc.
  ↓
SELECT ITEMS
  - Check which items to include
  ↓
REORDER ITEMS
  - Drag and drop or arrows
  ↓
CLICK "COMPILE EDITION"
  ↓
CONCATENATE (no AI needed!):
  edition.contentJson = {
    subject: series.title + " - " + date,
    sections: selectedItems.map(item => item.formattedContent)
  }
  ↓
DONE! Preview available immediately
```

### Database Model
```prisma
model EmailDigestEdition {
  id            String @id @default(uuid())
  emailDigestId String
  product       WorkForceEnduringProdEmailDigest @relation(...)
  
  status       EmailDigestEditionStatus @default(DRAFT)
  contentJson  Json?  // Compiled output (just concatenation of items)
  generatedAt  DateTime @default(now())
  originatorId String
  companyId    String
  
  // Many-to-many with items
  editionItems EmailDigestEditionItem[]
  
  @@index([emailDigestId])
  @@index([companyId])
  @@index([status])
}

// Junction table for many-to-many
model EmailDigestEditionItem {
  id        String @id @default(cuid())
  editionId String
  itemId    String
  order     Int  // Display order in this edition
  
  edition EmailDigestEdition @relation(fields: [editionId], references: [id], onDelete: Cascade)
  item    EmailDigestItem    @relation(fields: [itemId], references: [id], onDelete: Cascade)
  
  @@unique([editionId, itemId])  // Can't add same item twice to one edition
  @@index([editionId])
  @@index([itemId])
  @@index([order])
}
```

---

## 🤖 WHERE AI IS USED

### AI Point 1: Generate Item (REQUIRED)
**Location:** Item Factory, "Generate Item" button

**Input:**
```
CompanyEvent {
  title: "Holiday Party",
  description: "Annual company holiday celebration for employees and families",
  eventDate: "2025-12-20",
  location: "Main Office"
}
```

**AI Prompt:**
```
"Convert this company event into an engaging email digest item.
Make it compelling, include emoji, format for email.
Return JSON with: title, body (HTML), cta, ctaUrl"
```

**Output:**
```json
{
  "title": "🎄 Join Us for the Annual Holiday Party!",
  "body": "<p>Get ready for a festive celebration! Our annual holiday party is coming up on <strong>December 20th</strong> at the Main Office.</p><p>Bring your family for an evening of fun, food, and holiday cheer!</p>",
  "cta": "RSVP Now",
  "ctaUrl": "/events/holiday-party",
  "imageUrl": null
}
```

### AI Point 2: Compile Edition (OPTIONAL - Maybe not even needed!)
**Location:** Edition Builder, "Compile" button

**What it does:**
- Usually: Just concatenate items (no AI)
- Optional: "✨ Enhance with AI" button to rewrite intro/transitions

---

## 📊 THE TWO SEPARATE UX AREAS

### Area 1: Item Catalogue (New!)
**URL:** `/workforce/enduring/email-digest/items`

**Pages:**
- `/items` - List all items (catalogue view)
- `/items/new` - Create new item
- `/items/[itemId]` - Edit/preview item

**Features:**
- Browse all items
- Filter by type, status, date
- Search
- Create new item (from WorkForce stuff or manual)
- Edit existing items
- Archive old items
- See "Used in X editions"

### Area 2: Edition Management (Existing concept)
**URL:** `/workforce/enduring/email-digest/[seriesId]/editions/[editionId]`

**Pages:**
- `/editions/[editionId]/curate` - Select items from catalogue
- `/editions/[editionId]/preview` - Preview compiled edition
- `/editions/[editionId]/send` - Send edition

**Features:**
- Browse item catalogue
- Select items for this edition
- Reorder selected items
- Compile edition (concatenate)
- Preview
- Send

---

## 🔄 FULL LIFECYCLE EXAMPLE

### Week 1: Build Items
```
Monday: Create item from "Holiday Party" event
  → AI generates formatted content
  → Review, edit, save
  → Item #1 in catalogue (READY)

Tuesday: Create item from "Blood Drive" campaign
  → AI generates formatted content
  → Review, save
  → Item #2 in catalogue (READY)

Wednesday: Create item manually "CEO Message"
  → Write content directly
  → Save
  → Item #3 in catalogue (READY)
```

### Week 2: Build Edition
```
Friday: Create new edition for "Weekly Update" series
  → Browse catalogue (sees 3 ready items)
  → Select items #1, #2, #3
  → Reorder: #3, #1, #2 (CEO message first)
  → Click "Compile"
  → Edition compiled in 0.1 seconds (just concatenation!)
  → Preview looks good
  → Send
```

### Week 3: Reuse Items
```
Next Friday: Create another edition
  → Browse catalogue
  → Item #1 (Holiday Party) still relevant
  → Item #4 (New training) just created
  → Select items #1, #4
  → Compile
  → Send
  
  → Item #1 has now been used in 2 editions!
```

---

## 🎯 KEY BENEFITS OF THIS ARCHITECTURE

### 1. Separation of Concerns
- **Item creation** = AI formatting + review (slow, careful)
- **Edition assembly** = Selection + ordering (fast, simple)

### 2. Reusability
- Create item once, use in multiple editions
- Update item, all future editions use new version

### 3. Batch Content Creation
- Content team can create items throughout the week
- Edition builder just selects from ready items

### 4. No Waiting
- No "generating..." spinner when building edition
- Items are already formatted and ready

### 5. Quality Control
- Every item reviewed before it enters catalogue
- Edition building is mechanical (less QA needed)

---

## 🚨 WHAT CHANGES FROM CURRENT DESIGN

### Current (WRONG) Design:
```
EmailDigestItem = just a pointer
  → Links edition to CompanyX
  → No formatted content
  → AI runs at edition compile time
  → Can't reuse across editions
```

### New (CORRECT) Design:
```
EmailDigestItem = formatted content piece
  → Can link to CompanyX (optional)
  → HAS formatted content (the actual item)
  → AI runs when creating item
  → Can be reused across editions
  → Many-to-many with editions
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Schema Refactor
- [ ] Add `formattedContent Json` to `EmailDigestItem`
- [ ] Add `status` field to `EmailDigestItem`
- [ ] Add `EmailDigestEditionItem` junction table
- [ ] Update relations (many-to-many)
- [ ] Remove old one-to-many relation
- [ ] Migrate database

### Phase 2: Item Factory UX
- [ ] `/workforce/enduring/email-digest/items` - List page
- [ ] `/items/new` - Create item page
  - [ ] Source selector (CompanyX vs manual)
  - [ ] AI "Generate Item" button
  - [ ] Review/edit interface
  - [ ] Save to catalogue
- [ ] `/items/[itemId]` - Edit/preview page

### Phase 3: Item Generator (AI)
- [ ] `generateDigestItem(source, type)` function
- [ ] OpenAI integration for formatting
- [ ] Prompt engineering
- [ ] JSON validation
- [ ] Handle different CompanyX types

### Phase 4: Edition Builder UX (Update)
- [ ] Update `/editions/[id]/curate` to browse catalogue
- [ ] Item selection (checkboxes)
- [ ] Reorder selected items
- [ ] "Compile" button (concatenation, no AI)
- [ ] Preview page

### Phase 5: Compilation Logic (Simple!)
- [ ] `compileEdition(editionId)` function
- [ ] Query selected items via junction table
- [ ] Order by `order` field
- [ ] Concatenate `formattedContent`
- [ ] Save to `edition.contentJson`
- [ ] Done!

---

## 🎨 UI MOCKUP: Item Factory

```
┌─────────────────────────────────────────────────────────────────┐
│ Digest Item Catalogue                            [+ Create Item]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Filter: [All Types ▼] [Status: Ready ▼]    Search: [        ] │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎄 Holiday Party                           [READY]   [Edit] │ │
│ │ From: CompanyEvent "Holiday Party"                          │ │
│ │ Created: Dec 10, 2025 • Used in 2 editions                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🩸 Blood Drive Campaign                    [READY]   [Edit] │ │
│ │ From: CompanyCampaign "Blood Drive"                         │ │
│ │ Created: Dec 11, 2025 • Used in 1 edition                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📢 CEO Year-End Message                    [DRAFT]   [Edit] │ │
│ │ From: Manual Entry                                          │ │
│ │ Created: Dec 12, 2025 • Not used yet                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI MOCKUP: Create Item

```
┌─────────────────────────────────────────────────────────────────┐
│ Create Digest Item                                       [Back] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ SOURCE                                                          │
│ ⚫ From WorkForce Stuff (recommended)                           │
│ ⚪ Create My Own (manual entry)                                │
│                                                                 │
│ SELECT SOURCE:                                                  │
│ [Events ▼]                                                      │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ☑ Holiday Party                                             │ │
│ │   Annual company holiday celebration                        │ │
│ │   Date: December 20, 2025                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                    [✨ Generate Item with AI] │
│                                                                 │
│ ─────────── GENERATED CONTENT (Review & Edit) ─────────────    │
│                                                                 │
│ Title: 🎄 Join Us for the Annual Holiday Party!                │
│                                                                 │
│ Body:                                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Get ready for a festive celebration! Our annual holiday     │ │
│ │ party is coming up on December 20th at the Main Office.     │ │
│ │                                                             │ │
│ │ Bring your family for an evening of fun, food, and holiday  │ │
│ │ cheer!                                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Call to Action: [RSVP Now              ]                       │
│ CTA URL:        [/events/holiday-party  ]                       │
│                                                                 │
│ [Regenerate] [Save as Draft] [Save as Ready]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

**End of Document**

This is the correct architecture. Let's build it! 🚀
