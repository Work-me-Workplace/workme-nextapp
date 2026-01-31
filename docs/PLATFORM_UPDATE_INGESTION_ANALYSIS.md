# Platform Update Ingestion Flow Analysis

**Date:** 2026-01-30  
**Purpose:** Clarify the platform update ingestion flow, address confusion about one-off updates vs. platform ingest → unit → unit update pattern, and document the ideal flow for product development.

---

## The Core Question

**Can we do one-off updates, or is it:**
```
Platform Ingest → Unit → Unit Update
```

**Answer:** Both patterns exist, but they serve different purposes.

---

## Current State: Multiple Update Patterns

### Pattern 1: Platform Ingest → Unit → Unit Update (Full Flow)

**When to Use:** When you have a news article about a platform unit (e.g., "USS Gerald R. Ford completes builders trials")

**Flow:**
```
1. News Article (raw text)
   ↓
2. Platform Product Creation (if platform doesn't exist)
   - Creates CompanyPlatformProduct
   - Creates CompanyPlatformUnit(s)
   ↓
3. Platform Unit Update Creation
   - Creates CompanyPlatformUnitStatement (stores raw article)
   - Creates CompanyPlatformUnitUpdate (parsed update info)
   ↓
4. Optional: Extract Milestone from Update
   - Creates CompanyMilestone (if update contains milestone event)
```

**Code Locations:**
- Platform creation: `app/api/company/products/platform/create-with-units/route.ts`
- Unit update creation: `app/api/company/products/platform/unit/update/create/route.ts`
- Update parsing: `lib/services/platform-update-service.ts`

**Example:** "USS Gerald R. Ford completes builders trials"
- Platform: "Gerald R. Ford-class aircraft carrier"
- Unit: "USS Gerald R. Ford (CVN-78)"
- Update: "Builders trials completed on [date]"

---

### Pattern 2: One-Off Unit Update (Direct Update)

**When to Use:** When the platform and unit already exist, and you just need to add an update

**Flow:**
```
1. News Article (raw text)
   ↓
2. Direct Unit Update Creation
   - Creates CompanyPlatformUnitStatement
   - Creates CompanyPlatformUnitUpdate
   ↓
3. Optional: Extract Milestone from Update
```

**Code Location:**
- `app/api/company/products/platform/unit/update/create/route.ts`
- UI: `app/mycompany/platforms/units/[id]/updates/create/page.tsx`

**Example:** "USS Gerald R. Ford begins sea trials"
- Unit already exists: "USS Gerald R. Ford (CVN-78)"
- Just create update with new information

---

### Pattern 3: News Artifact → Milestone (Company-Wide Only)

**When to Use:** For BIG PICTURE company-wide milestones only (NOT platform-specific events)

**Flow:**
```
1. News Article (raw text)
   ↓
2. CompanyNewsArtifact (stores raw text)
   ↓
3. Parse for Company-Wide Milestone
   - AI extracts milestone info
   - User confirms
   ↓
4. Create CompanyMilestone
```

**Code Location:**
- `app/api/company/milestones/upsert/route.ts`
- UI: `app/mycompany/milestones/new/page.tsx`

**Important:** This is ONLY for company-wide milestones (entire company does something), NOT platform-specific events like "carrier goes out to sea"

---

## The "Carrier Goes Out to Sea" Example

**What It Is:** A platform unit update (specifically, sea trials or commissioning)

**Correct Flow:**
```
1. News Article: "USS Gerald R. Ford goes out to sea for builders trials"
   ↓
2. Check if platform/unit exists:
   - Platform: "Gerald R. Ford-class aircraft carrier" ✅ (exists)
   - Unit: "USS Gerald R. Ford (CVN-78)" ✅ (exists)
   ↓
3. Create Platform Unit Update (Pattern 2 - One-Off)
   - Statement: Store raw article text
   - Update: Extract structured info:
     * statusUpdate: "Builders trials"
     * seaTrialsStartDate: [extracted date]
     * narrativeSummary: [AI summary]
   ↓
4. Optional: Track as Milestone
   - If this is a discrete event (e.g., "sea trials begin")
   - Could create CompanyMilestone linked to update
   - BUT: Currently NOT IMPLEMENTED (see docs/PLATFORM_UNIT_UPDATE_MILESTONE_ARCHITECTURE.md)
```

**Wrong Flow (Don't Use):**
```
❌ CompanyMilestone creation (this is for company-wide events only)
❌ Platform product creation (platform/unit already exists)
```

---

## Ideal Flow for Product Development

**User's Desired Flow:**
```
Ingest (from news source) → Store as source of truth → Use for products
```

**Current Implementation:**

### Step 1: Ingest from News Source

**Option A: News Artifact Flow (Recommended)**
```
1. Create CompanyNewsArtifact from URL/text
   - POST /api/utils/news-artifact/create
   - Stores rawText as source of truth
   ↓
2. Parse artifact for platform unit update
   - POST /api/company/products/platform/unit/[id]/update
   - Uses artifact.rawText
```

**Option B: Direct Update Creation**
```
1. POST /api/company/products/platform/unit/update/create
   - rawText: article text
   - platformUnitId: unit ID
   - Creates statement + update in one call
```

### Step 2: Store as Source of Truth

**Models Created:**
- `CompanyPlatformUnitStatement` - Raw article text (source of truth)
- `CompanyPlatformUnitUpdate` - Parsed structured data

**Fields Tracked:**
- `statusUpdate` - "Builders trials", "Sea trials", "Keel laid", etc.
- `seaTrialsStartDate`, `keelLaidDate`, `deliveryDate`, `commissioningDate`
- `percentComplete` - Construction progress
- `scheduleNote` - Timeline information ("on time", "ahead of schedule")
- `narrativeSummary` - AI-generated summary

### Step 3: Use for Products

**Current Usage:**
- Updates displayed on platform unit pages
- Can generate digital signage from updates
- Can track unit progress over time

**Future Usage (Not Yet Implemented):**
- Extract milestones from updates
- Generate products from milestone events
- Track unit-specific timelines ("is it on time?")

---

## Tracking Specific Units: "Builders Trials" and "On Time"

**Current Model Support:**

### CompanyPlatformUnitUpdate Fields

```prisma
model CompanyPlatformUnitUpdate {
  // Status tracking
  statusUpdate String? // "Builders trials", "Sea trials", etc.
  
  // Date tracking
  seaTrialsStartDate DateTime?
  keelLaidDate DateTime?
  deliveryDate DateTime?
  commissioningDate DateTime?
  
  // Progress tracking
  percentComplete Int?
  
  // Timeline tracking
  scheduleNote String? // "On time", "Ahead of schedule", "Delayed"
  
  // Narrative
  narrativeSummary String?
}
```

**Example: "Builders Trials"**
- `statusUpdate`: "Builders trials"
- `seaTrialsStartDate`: [date when trials started]
- `scheduleNote`: "On time" or "Delayed by 2 weeks"
- `narrativeSummary`: "USS Gerald R. Ford completed builders trials successfully..."

**Tracking "On Time":**
- `scheduleNote` field captures timeline status
- Can query updates by `scheduleNote` to find units that are on time/delayed
- Can track changes over time (update 1: "on time", update 2: "delayed")

---

## Update Patterns: When to Use What

| Scenario | Pattern | Endpoint | Creates |
|----------|---------|----------|---------|
| New platform from article | Pattern 1 | `/api/company/products/platform/create-with-units` | Platform + Units + Updates |
| Update existing unit | Pattern 2 | `/api/company/products/platform/unit/update/create` | Statement + Update |
| Company-wide milestone | Pattern 3 | `/api/company/milestones/upsert` | Milestone (company-wide only) |

---

## Current Gaps & Issues

### 1. Update → Milestone Flow Not Implemented

**Problem:** Schema supports `CompanyMilestone.updateId`, but code doesn't create milestones from updates.

**Current State:**
- ✅ Schema: `CompanyMilestone.updateId` exists
- ✅ Documentation describes the flow
- ❌ No code to extract milestones from updates
- ❌ No UI to trigger milestone extraction

**Impact:** Can't automatically track discrete events (like "builders trials complete") as milestones.

**Workaround:** Create milestone manually, or use company milestone flow (but that's for company-wide only).

---

### 2. Unclear When to Use CompanyMilestone vs. PlatformUnitUpdate

**Problem:** Users don't know when to use which model.

**Clarification:**
- **CompanyMilestone:** Entire company does something (company-wide reorganization, major contract affecting entire company)
- **PlatformUnitUpdate:** Specific platform/unit does something (ship commissioning, keel laying, builders trials)

**"Carrier goes out to sea":**
- ✅ Use: `CompanyPlatformUnitUpdate`
- ❌ Don't use: `CompanyMilestone` (this is platform-specific, not company-wide)

---

### 3. No Direct "One-Off Update" UI for News Articles

**Current State:**
- Can create updates from unit detail page
- Can create updates from platform creation flow
- No direct "paste article → create update" flow

**Ideal Flow:**
```
1. User pastes article URL/text
2. System detects platform unit mentioned
3. Creates update directly (if unit exists)
4. Or prompts to create unit first (if unit doesn't exist)
```

---

## Recommendations

### For Product Development Slide

**Ideal Flow:**
```
News Source → Ingest → Store as Source of Truth → Use for Products
```

**Implementation:**
1. **Ingest:** Create `CompanyPlatformUnitStatement` (stores raw article)
2. **Store:** Create `CompanyPlatformUnitUpdate` (parsed structured data)
3. **Use:** Display updates, track progress, generate products

**Key Models:**
- `CompanyPlatformUnitStatement` - Source of truth (raw text)
- `CompanyPlatformUnitUpdate` - Structured data (status, dates, progress)
- `CompanyPlatformUnit` - The unit being tracked

**Tracking Specific Units:**
- Use `statusUpdate` field for event types ("builders trials", "sea trials")
- Use `scheduleNote` for timeline status ("on time", "delayed")
- Use date fields (`seaTrialsStartDate`, etc.) for specific milestones

---

### For Implementation

**Short Term:**
1. ✅ Use Pattern 2 (one-off updates) for existing units
2. ✅ Use Pattern 1 (platform ingest) for new platforms/units
3. ✅ Store raw text in `CompanyPlatformUnitStatement` as source of truth

**Medium Term:**
1. ⏳ Implement update → milestone extraction (if needed)
2. ⏳ Add UI for direct article → update creation
3. ⏳ Clarify CompanyMilestone vs. PlatformUnitUpdate usage

**Long Term:**
1. ⏳ Auto-detect platform units from articles
2. ⏳ Auto-create updates from news feeds
3. ⏳ Generate products automatically from updates

---

## Code Locations

### Platform Update Creation
- **API:** `app/api/company/products/platform/unit/update/create/route.ts`
- **UI:** `app/mycompany/platforms/units/[id]/updates/create/page.tsx`
- **Service:** `lib/services/platform-update-service.ts`

### Platform Creation
- **API:** `app/api/company/products/platform/create-with-units/route.ts`
- **UI:** `app/mycompany/platforms/create/page.tsx`

### Milestone Creation
- **API:** `app/api/company/milestones/upsert/route.ts`
- **UI:** `app/mycompany/milestones/new/page.tsx`

### News Artifact
- **API:** `app/api/utils/news-artifact/create/route.ts`

---

## Summary

**Answer to Core Question:**
- ✅ **Yes, you can do one-off updates** (Pattern 2)
- ✅ **Yes, you can do platform ingest → unit → unit update** (Pattern 1)
- ✅ **Both patterns exist** - use Pattern 2 for existing units, Pattern 1 for new platforms

**For "Carrier Goes Out to Sea":**
- Use Pattern 2 (one-off update) if unit exists
- Use Pattern 1 (platform ingest) if platform/unit doesn't exist
- Store raw article in `CompanyPlatformUnitStatement` (source of truth)
- Parse structured data into `CompanyPlatformUnitUpdate`
- Track "builders trials" via `statusUpdate` field
- Track "on time" via `scheduleNote` field

**Ideal Flow:**
```
News Source → Ingest (Statement) → Store (Update) → Use (Products)
```

**Current State:**
- ✅ Ingest and store working
- ✅ Can track specific units and events
- ⏳ Product generation from updates (partial - digital signage works, milestone extraction doesn't)
