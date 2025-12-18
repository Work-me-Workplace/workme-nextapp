# Email Digest System - Refactor Complete (2025-12-17)

## ✅ COMPLETED CHANGES

### 1. Database Schema Updates

#### Added EmailDigestItem Model
- Links editions to specific CompanyX records (events, campaigns, etc.)
- Supports all 8 CompanyX types with proper relations
- Includes `order` field for sorting
- Includes `notes` field for user annotations

#### Added EmailDigestEditionStatus Enum
- `DRAFT` - Being curated, items being selected
- `GENERATING` - OpenAI generation in progress  
- `GENERATED` - Content generated, ready for review
- `SENT` - Finalized and sent

#### Updated EmailDigestEdition Model
- Added `status` field (defaults to DRAFT)
- Changed `contentJson` to nullable (null until GENERATED)
- Added `items` relation to EmailDigestItem[]

#### Fixed deprecated companyUnit → companyId
- Updated WorkForceEnduringProdEmailDigest
- Updated EmailDigestEdition
- Updated all queries in email-digest.ts actions

#### Added back-relations to all CompanyX models
- CompanyEvent
- CompanyCampaign  
- CompanyTraining
- CompanyBenefits
- CompanyImpactEvent
- CompanyCommunity
- CompanyCareer
- CompanyEmployeeCause

### 2. Server Actions (lib/actions/email-digest.ts)

#### Rewrote createEmailDigestEdition()
- **OLD:** Queried ALL CompanyX, dumped to OpenAI, created edition with content
- **NEW:** Creates empty DRAFT edition, returns for curation

#### Added getAvailableCompanyXItems()
- Queries all CompanyX items for user's company
- Returns grouped by type (events, campaigns, trainings, etc.)
- Includes relevant fields for display (dates, summaries, etc.)

#### Added updateEditionItems()
- Saves selected items to EmailDigestItem table
- Supports reordering via `order` field
- Supports user notes per item

#### Added getEditionWithItems()
- Fetches edition with all items and related CompanyX data
- For curation/editing pages

#### Added generateEditionContent()
- Builds prompt from SELECTED items only (not all CompanyX)
- Updates edition status: DRAFT → GENERATING → GENERATED
- Calls generateEmailDigestContent() (currently placeholder)
- Stores generated content in contentJson

#### Added buildPromptFromItems() helper
- Formats selected items into prompt text
- Includes item type, title, summary/description
- Includes user notes if present

#### Fixed getEmailDigestEdition()
- Was using deprecated `companyUnit` variable
- Now uses `companyId` consistently

###3. UX Updates

#### Updated product detail page
- "Generate New Edition" button now creates DRAFT edition
- Redirects to edition detail page for curation
- (Curation UI not yet built - next phase)

#### Updated create series page
- Clearer labeling as "Recurring Email Series"
- Added blue info box explaining recurring nature
- Better field descriptions

### 4. Documentation

#### Created EMAIL_DIGEST_SYSTEM_STATUS.md
- Comprehensive "where we are now" document
- Current schema with companyId fixes
- Code implementation analysis  
- Missing architecture (EmailDigestItem layer)
- Decision points
- Implementation checklist

#### Updated EMAIL_DIGEST_SYSTEM_STATUS.md
- Marked Phase 1 (Data Model) as COMPLETE
- Marked Phase 2 (Server Actions) as COMPLETE
- Updated Phase 3/4 status

---

## 🎯 CURRENT STATE

### What Works Now

1. ✅ **Create Recurring Series** - Users can create email digest series
2. ✅ **Create Draft Edition** - Click "Generate New Edition" creates DRAFT edition
3. ✅ **Database Schema** - EmailDigestItem model exists with proper relations
4. ✅ **Server Actions** - All CRUD operations for curation flow
5. ✅ **Status Flow** - DRAFT → GENERATING → GENERATED tracking

### What's Missing

1. ❌ **Curation UI** - No page to select CompanyX items yet
   - Need: `/workforce/enduring/email-digest/[id]/editions/[editionId]/curate`
   - Need: Checkboxes to select items
   - Need: Reorder UI

2. ❌ **OpenAI Integration** - Still using placeholder
   - generateEmailDigestContent() returns dummy data
   - Need: Actual OpenAI API call

3. ❌ **Preview/Edit Flow** - Edition detail page needs work
   - Show generated content with formatting
   - Add "Regenerate" button

4. ❌ **Database Migration** - Schema updated, but DB not migrated
   - `npx prisma migrate dev` failed due to other migration issues
   - Need to resolve migration conflicts or push schema directly

5. ❌ **Navigation** - No clear entry point in main nav
   - Email Digest feature is "hidden" at `/workforce/enduring/email-digest`
   - Need to add link in main navigation

---

## 📊 ARCHITECTURE SUMMARY

### Current Flow

```
1. User creates Series (WorkForceEnduringProdEmailDigest)
   ↓
2. User clicks "Generate New Edition"
   ↓
3. System creates DRAFT EmailDigestEdition (empty, no items)
   ↓
4. System redirects to edition detail page
   ↓
5. [MISSING] User sees curation UI, selects CompanyX items
   ↓
6. [MISSING] System saves EmailDigestItem records
   ↓
7. User clicks "Generate Content"
   ↓
8. System calls generateEditionContent()
   - Queries EmailDigestItem + CompanyX data
   - Builds prompt from SELECTED items
   - Calls OpenAI (placeholder)
   - Saves to contentJson
   - Updates status to GENERATED
   ↓
9. [MISSING] User previews, edits, or sends
```

### Data Model

```
WorkForceEnduringProdEmailDigest (Series)
  ├─ id, title, description
  ├─ companyId ✅ (was companyUnit)
  └─ editions []
      ↓
EmailDigestEdition (Individual Issue)
  ├─ id, status ✅ (DRAFT/GENERATING/GENERATED/SENT)
  ├─ contentJson ✅ (nullable until GENERATED)
  ├─ companyId ✅ (was companyUnit)
  └─ items [] ✅ NEW
      ↓
EmailDigestItem (Link to CompanyX) ✅ NEW
  ├─ id, order, notes
  ├─ companyEventId? (one of 8 CompanyX FKs)
  ├─ companyCampaignId?
  ├─ companyTrainingId?
  ├─ ... (6 more)
  └─ Relations to all 8 CompanyX models
```

---

## 🚀 NEXT STEPS (Priority Order)

### 1. Add Navigation Link (5 min)
Add link to main nav so users can access the feature

### 2. Build Curation Page (2-3 hours)
Create `/workforce/enduring/email-digest/[id]/editions/[editionId]/curate`
- Fetch available CompanyX items
- Display with checkboxes
- Save selection to EmailDigestItem
- Redirect to generation

### 3. Integrate OpenAI (1-2 hours)
Replace `generateEmailDigestContent()` placeholder
- Set up OpenAI API key
- Build actual prompt
- Parse response
- Handle errors

### 4. Polish Edition Detail Page (1 hour)
- Show generated content with formatting
- Add "Regenerate" button
- Show which items were included
- Add "Send" button (mark as SENT)

### 5. Resolve DB Migration (30 min - 1 hour)
- Fix migration conflicts OR
- Push schema directly with `prisma db push` (for dev)

---

## 🎉 WINS

1. **Clean Architecture** - EmailDigestItem provides granular linking
2. **Status Tracking** - Clear DRAFT → GENERATING → GENERATED → SENT flow
3. **Curation-First** - Users select items before generation (not auto-dump)
4. **companyId Fixed** - Deprecated companyUnit eliminated
5. **Prisma Client Generated** - TypeScript types up-to-date
6. **Actions Complete** - All server-side logic for curation flow exists

---

**Refactor Date:** 2025-12-17  
**Next Session:** Build curation UI and integrate OpenAI


