# Platform Unit Update & Milestone Architecture Analysis

**Last Updated:** 2025-12-15  
**Purpose:** Explore the relationship between `CompanyPlatformUnitUpdate` and `CompanyMilestone`, and design post-creation workflow options

---

## Current Schema Relationships

### Entity Overview

```
CompanyPlatformUnit
├── statements: CompanyPlatformUnitStatement[]
├── updates: CompanyPlatformUnitUpdate[]
├── milestones: CompanyMilestone[]
├── namesake: CompanyPlatformUnitNamesake? (1:1)
└── livingHomage: CompanyPlatformUnitLivingHomage? (1:1)
```

### Current Relationships

#### 1. **CompanyPlatformUnitStatement** → **CompanyPlatformUnitUpdate**
- **Relationship:** One-to-Many (Statement can have multiple Updates)
- **Purpose:** A statement (article/release) can generate multiple updates over time
- **Link:** `CompanyPlatformUnitUpdate.statementId` (optional)

#### 2. **CompanyPlatformUnitUpdate** → **CompanyMilestone**
- **Relationship:** One-to-Many (Update can trigger multiple Milestones)
- **Purpose:** An update can contain milestone information that gets extracted
- **Link:** `CompanyMilestone.updateId` (optional, unique - one milestone per update)

---

## Key Questions

### Q1: Can Updates Exist Independently?

**Current State:** ✅ **YES**
- `CompanyPlatformUnitUpdate.statementId` is **optional**
- Updates can be created manually without a statement
- Updates can track ongoing status/progress independently

**Use Cases:**
- Manual status updates ("Construction at 60%")
- Progress tracking without source article
- Internal notes/observations

---

### Q2: Can Milestones Exist Independently?

**Current State:** ✅ **YES**
- `CompanyMilestone.updateId` is **optional**
- Milestones can be created manually
- Milestones represent discrete events (keel laying, launch, etc.)

**Use Cases:**
- Manual milestone entry
- Historical milestone recording
- Milestones from non-article sources (internal records, ceremonies)

---

### Q3: Should Updates "Bolt On" as Milestones?

**Current Architecture:**
- Updates can **trigger** milestones (via `updateId`)
- But updates and milestones serve **different purposes**:
  - **Update:** Ongoing status, progress, signals, narrative
  - **Milestone:** Discrete event with type, date, description

**Analysis:**

#### Option A: Updates Can Create Milestones (Current)
```
Article → Statement → Update → Milestone
```
- Update extracts milestone info (e.g., "keel laid on 2024-01-15")
- System creates Milestone from Update
- Milestone links back to Update via `updateId`

**Pros:**
- ✅ Preserves traceability (milestone came from update)
- ✅ Automatic milestone extraction from articles
- ✅ Update contains rich context (narrative, quotes, etc.)

**Cons:**
- ⚠️ Update must exist first (can't create milestone directly from statement)
- ⚠️ One milestone per update (unique constraint on `updateId`)

#### Option B: Updates ARE Milestones (Not Recommended)
- Would flatten updates into milestones
- Loses rich update context (narrative, quotes, industrial base notes)
- Milestones become too heavy

#### Option C: Updates and Milestones Are Independent (Hybrid)
- Updates track ongoing status/progress
- Milestones track discrete events
- They can be related but don't require each other

**Recommendation:** ✅ **Option A (Current)** - Updates can trigger milestones, but both can exist independently

---

## Post-Creation Workflow Options

After successfully creating a platform unit via AI ingest, present these options:

### 1. **Add Namesake**
- **Model:** `CompanyPlatformUnitNamesake`
- **Relationship:** 1:1 with unit (unique constraint)
- **Fields:**
  - `fullName` (required)
  - `knownAs` (optional)
  - `role` (optional)
  - `whyKnown` (optional)
  - `legacySummary` (optional)
  - `era` (optional)
  - `honors` (array)
  - `notes` (optional)

**UI Flow:**
- Form to enter namesake information
- Can be added anytime after unit creation
- Replaces existing namesake if one exists

---

### 2. **Add Living Homage**
- **Model:** `CompanyPlatformUnitLivingHomage`
- **Relationship:** 1:1 with unit (unique constraint)
- **Fields:**
  - `fullName` (required)
  - `role` (optional) - e.g., "Ship Sponsor"
  - `relation` (optional) - e.g., "Granddaughter-in-law of namesake"
  - `notes` (optional)

**UI Flow:**
- Form to enter living homage information
- Can be added anytime after unit creation
- Replaces existing living homage if one exists

**Inference Rule (from schema):**
- If `milestoneType === KEEL_LAYING`, the platform unit should have a `CompanyPlatformUnitLivingHomage`
- This ensures narrative signal is preserved

---

### 3. **Add Update**
- **Model:** `CompanyPlatformUnitUpdate`
- **Relationship:** Many-to-One with unit
- **Fields:**
  - `statementId` (optional) - link to statement if created from article
  - `percentComplete` (optional)
  - `statusUpdate` (optional) - e.g., "Keel Laid", "Construction 60% complete"
  - `scheduleNote` (optional)
  - `industrialBaseNote` (optional)
  - `leadershipQuote` (optional)
  - `keelLaidDate` (optional)
  - `seaTrialsStartDate` (optional)
  - `deliveryDate` (optional)
  - `commissioningDate` (optional)
  - `narrativeSummary` (optional)
  - `tags` (array)

**UI Flow Options:**

**Option 3A: Manual Update Entry**
- Form to enter update information directly
- No statement required
- Can track ongoing status/progress

**Option 3B: Update from Article (Statement + Update)**
- Paste article text
- Create statement first
- Parse statement to create update
- Optionally extract milestones from update

**Recommendation:** Support both flows

---

### 4. **Add Statement**
- **Model:** `CompanyPlatformUnitStatement`
- **Relationship:** Many-to-One with unit
- **Fields:**
  - `sourceName` (optional)
  - `sourceUrl` (optional)
  - `headline` (optional)
  - `rawText` (required)
  - `aiSummary` (optional)
  - `aiTags` (array)

**UI Flow:**
- Paste article/release text
- AI extracts metadata (source, headline, summary, tags)
- Creates statement record
- **Optionally** create update from statement (separate action)

**Note:** Statements are separate from initial ingest - they represent ongoing article processing

---

## Update vs Milestone: When to Use What?

### Use **Update** When:
- ✅ Tracking ongoing status/progress
- ✅ Recording narrative context (quotes, notes, industrial base issues)
- ✅ Processing articles that contain multiple signals
- ✅ Need rich context beyond just an event

### Use **Milestone** When:
- ✅ Recording discrete events (keel laying, launch, commissioning)
- ✅ Need structured event type (enum: `PlatformMilestoneType`)
- ✅ Event has specific date and description
- ✅ Event should be linked to update that triggered it

### Use **Both** When:
- ✅ Article contains milestone information
- ✅ Flow: Article → Statement → Update → Milestone
- ✅ Update provides context, Milestone provides structured event

---

## Proposed Post-Creation UI Flow

After unit creation success:

```
┌─────────────────────────────────────┐
│  Unit Created Successfully!         │
│                                     │
│  What would you like to do next?    │
│                                     │
│  [1] Add Namesake                   │
│  [2] Add Living Homage              │
│  [3] Add Update                     │
│  [4] Add Statement                  │
│  [5] View Unit                      │
└─────────────────────────────────────┘
```

### Option 3: Add Update - Sub-Options

```
┌─────────────────────────────────────┐
│  Add Update                         │
│                                     │
│  How would you like to add it?     │
│                                     │
│  [A] Manual Entry                   │
│      - Enter update info directly   │
│                                     │
│  [B] From Article                   │
│      - Paste article text           │
│      - Creates Statement + Update   │
│      - Optionally extract Milestone │
└─────────────────────────────────────┘
```

### Option 4: Add Statement - Flow

```
┌─────────────────────────────────────┐
│  Add Statement                      │
│                                     │
│  Paste article/release text:        │
│  [Text area]                        │
│                                     │
│  [Parse with AI]                    │
│                                     │
│  After parsing:                     │
│  - Review extracted metadata        │
│  - Create Statement                 │
│  - [Optional] Create Update from    │
│    this Statement                   │
└─────────────────────────────────────┘
```

---

## Implementation Recommendations

### 1. **Update Independence**
- ✅ Keep updates independent (can exist without statements)
- ✅ Support manual update creation
- ✅ Support update creation from statements

### 2. **Milestone Independence**
- ✅ Keep milestones independent (can exist without updates)
- ✅ Support manual milestone creation
- ✅ Support milestone creation from updates (when update contains milestone info)

### 3. **Update → Milestone Relationship**
- ✅ Keep current architecture (update can trigger milestone)
- ✅ When update contains milestone info (e.g., "keel laid on 2024-01-15"):
  - Extract milestone from update
  - Create milestone with `updateId` link
  - Preserve update context (narrative, quotes, etc.)

### 4. **Post-Creation Options**
- ✅ Implement all 4 options (Namesake, Living Homage, Update, Statement)
- ✅ Make each option independent (can be done in any order)
- ✅ Support both manual and AI-assisted flows for Update and Statement

---

## API Endpoints Needed

### Namesake
- `POST /api/company/products/platform/unit/[id]/namesake` - Create/Update namesake
- `GET /api/company/products/platform/unit/[id]/namesake` - Get namesake

### Living Homage
- `POST /api/company/products/platform/unit/[id]/living-homage` - Create/Update living homage
- `GET /api/company/products/platform/unit/[id]/living-homage` - Get living homage

### Update
- `POST /api/company/products/platform/unit/[id]/update` - Create update (manual)
- `POST /api/company/products/platform/unit/[id]/update/from-statement` - Create update from statement

### Statement
- `POST /api/company/products/platform/unit/[id]/statement` - Create statement
- `POST /api/company/products/platform/unit/[id]/statement/parse` - Parse article and create statement

---

## Questions to Resolve

1. **Should updates be able to create multiple milestones?**
   - Current: One milestone per update (`updateId` is unique)
   - Question: Can one update contain multiple milestone events?
   - Example: Update says "Keel laid on Jan 15, hull completed on Mar 20"

2. **Should milestones be able to exist without dates?**
   - Current: `date` is optional
   - Use case: Future milestones, milestones with approximate dates

3. **Should updates automatically create milestones?**
   - Current: Manual process
   - Question: Auto-detect milestone info in updates and prompt user?

4. **Should statements automatically create updates?**
   - Current: Manual process
   - Question: Auto-create update when creating statement?

---

## Next Steps

1. ✅ Document current architecture (this doc)
2. ⏳ Implement post-creation options UI
3. ⏳ Create API endpoints for each option
4. ⏳ Test update → milestone relationship
5. ⏳ Decide on auto-creation rules (if any)



