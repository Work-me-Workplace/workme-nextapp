# Update Page Params and Ingest Flow Analysis

## The Problem

User is confused about:
1. **Multiple params** - company params, platform unit params, query params
2. **What the ingest is doing** - it's not clear what happens when you click "Ingest with AI"

---

## Current URL Structure

**Page:** `/mycompany/platforms/[platformId]/units/[unitId]/update`

**Params:**
- `platformId` - Route param (from URL path)
- `unitId` - Route param (from URL path)  
- `companyId` - Query param (added automatically, probably from auth context)

**Why So Many Params?**

1. **Route Params (`platformId`, `unitId`):**
   - Needed to identify which unit you're updating
   - Used for navigation (back to unit page)
   - Used when creating the update

2. **Query Param (`companyId`):**
   - Added automatically by the app (probably from auth/session)
   - Used for multi-tenant scoping
   - Not actually needed for this page (unit already belongs to company)

**The Confusion:**
- `companyId` query param is redundant here (unit already has `companyId` via platform)
- But it's probably added automatically by some middleware/helper

---

## What the Ingest Actually Does

### Current Flow (What Happens Now)

1. **User pastes article text or URL**
   - URL: Fetches article content via `/api/utils/fetch-article`
   - Text: User pastes directly

2. **User clicks "Ingest with AI"**
   - Calls `/api/utils/news-artifact/ingest`
   - AI parses the article and extracts:
     * `artifactType` (e.g., "MILESTONE")
     * `sentiment` (POSITIVE, NEGATIVE, NEUTRAL)
     * `aiSummary` (summary of article)
     * `humanElements` (leaders, sponsors, attendees)
     * `noteworthyItems` (key facts, dates, milestones)
     * `leaderStatement` (quotes from leaders)

3. **Shows "Article Intelligence" Summary**
   - Displays parsed data
   - User can review/edit

4. **User clicks "Save as News Artifact"**
   - Calls `/api/utils/news-artifact/create`
   - Creates `CompanyNewsArtifact` record
   - **STOPS HERE** - doesn't create unit update!

### The Problem

**The page says "Add Update" but:**
- ❌ Doesn't actually create a `CompanyPlatformUnitUpdate`
- ❌ Only creates a `CompanyNewsArtifact` (unlinked to the unit!)
- ❌ "Bolt to Unit Update" button is disabled ("Coming soon")
- ❌ "Create Comms Product" button is disabled ("Coming soon")

**So the ingest flow is incomplete:**
- It ingests and parses the article ✅
- It saves as news artifact ✅
- But it doesn't create the unit update ❌
- And it doesn't link the artifact to the unit ❌

---

## What It SHOULD Do

### Ideal Flow

1. **Ingest Article** (same as now)
   - Parse with AI
   - Show Article Intelligence summary

2. **Create Unit Update**
   - Create `CompanyPlatformUnitStatement` (linked to unit)
   - Create `CompanyPlatformUnitUpdate` (parsed structured data)
   - Link statement to update

3. **Optional: Link News Artifact**
   - Create `CompanyNewsArtifact` (source of truth)
   - Link artifact to statement (optional)

### Current vs. Ideal

| Step | Current | Ideal |
|------|---------|-------|
| Parse article | ✅ Works | ✅ Works |
| Save news artifact | ✅ Works (but unlinked) | ✅ Works (linked to unit) |
| Create unit statement | ❌ Missing | ✅ Should create |
| Create unit update | ❌ Missing | ✅ Should create |
| Link everything | ❌ Missing | ✅ Should link |

---

## The "Bolt to Unit Update" Button

**Current State:** Disabled ("Coming soon")

**What It Should Do:**
1. Take the parsed Article Intelligence data
2. Create `CompanyPlatformUnitStatement` from raw text
3. Create `CompanyPlatformUnitUpdate` from parsed data:
   - Extract `statusUpdate` from artifactType
   - Extract dates from noteworthyItems
   - Extract `scheduleNote` if mentioned
   - Extract `leadershipQuote` from leaderStatement
   - Extract `narrativeSummary` from aiSummary
4. Link statement to update
5. Optionally link news artifact to statement

---

## Params Breakdown

### Route Params (Required)

**`platformId`** - From URL path
- Used for: Navigation back to platform
- Used for: Getting platform context
- **Needed:** Yes (for navigation)

**`unitId`** - From URL path  
- Used for: Creating the update
- Used for: Navigation back to unit
- **Needed:** Yes (required for update creation)

### Query Params (Probably Redundant)

**`companyId`** - From query string
- Used for: Multi-tenant scoping (probably)
- **Needed:** No (unit already belongs to company via platform)
- **Why it's there:** Probably added automatically by auth middleware

---

## Recommendations

### Short Term Fix

1. **Enable "Bolt to Unit Update" button**
   - Implement the flow to create statement + update
   - Use parsed Article Intelligence data

2. **Link News Artifact to Unit**
   - When saving artifact, link it to the unit statement
   - Or create statement first, then link artifact

3. **Remove Redundant Params**
   - Don't require `companyId` query param
   - Get company from unit/platform relationship

### Long Term Fix

1. **Unified Flow**
   - One button: "Create Unit Update"
   - Automatically creates: News Artifact → Statement → Update
   - All linked together

2. **Clearer UI**
   - Show what will be created
   - Show relationships between models
   - Make it clear this is for unit updates, not just news artifacts

---

## Code Locations

**Update Page:**
- `app/mycompany/platforms/[id]/units/[unitId]/update/page.tsx`

**Ingest API:**
- `app/api/utils/news-artifact/ingest/route.ts`

**Create News Artifact:**
- `app/api/utils/news-artifact/create/route.ts`

**Create Unit Update:**
- `app/api/company/products/platform/unit/update/create/route.ts`

---

## Summary

**Params:**
- `platformId` - Route param (needed for navigation)
- `unitId` - Route param (needed for update creation)
- `companyId` - Query param (redundant, probably auto-added)

**Ingest Flow:**
- ✅ Parses article with AI
- ✅ Shows Article Intelligence summary
- ✅ Can save as News Artifact
- ❌ Doesn't create unit update
- ❌ Doesn't link artifact to unit

**The Gap:**
- Page says "Add Update" but only creates news artifact
- "Bolt to Unit Update" button is disabled
- Need to implement the actual update creation flow
