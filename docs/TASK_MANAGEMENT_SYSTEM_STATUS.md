# Task Management System Status & Issues

**Date:** March 2, 2026  
**Purpose:** Document current state of task management system, identify gaps, and clarify requirements

---

## Current System Overview

### Architecture
- **WorkOpsItem**: Tasks stored in backlog (one per user via `WorkOpsOutlook`)
- **WorkOpsDailyAssignment**: Links items to specific days
- **Flow**: Tasks exist in backlog → Assign to a day → Work on day → Mark complete

### Key Models
- `WorkOpsItem`: Has `title`, `body`, `itemType`, `urgency`, `status`, `source`, `derivedFrom`
- `WorkOpsDailyAssignment`: Links `itemId` to `day` (DateTime)

---

## Issue 1: How to Mark Tasks as Done ✅

### Current State
**The functionality EXISTS** - you can mark tasks as done by clicking the circle/checkmark button.

### How It Works
1. **UI**: Circle icon next to each task (empty circle = not done, filled green checkmark = done)
2. **Function**: `handleToggleComplete()` in `app/workops/daily/page.tsx` (line 294)
3. **API**: `PATCH /api/workops/item/[itemId]` with `{ status: 'done' }` or `{ status: 'open' }`
4. **Status Field**: `WorkOpsStatus` enum: `open`, `in_progress`, `blocked`, `done`

### Where It Appears
- ✅ Daily tasks list (main section)
- ✅ Uncompleted from past days section
- ✅ Previous day section
- ✅ Unassigned items section

### User Experience
- Clicking the circle toggles between `done` and `open`
- Done tasks show with strikethrough and green checkmark
- Done tasks don't appear in "uncompleted from past days" (filtered by `status != 'done'`)

**Status**: ✅ **Working as designed** - The UI could be more obvious, but the functionality exists.

---

## Issue 2: Auto Carryover Service ❌

### Current State
**Manual carryover only** - No automatic carryover service exists.

### What Exists
1. **Manual "Bring all forward"** button:
   - "From previous day" section → "Bring all forward" (brings all tasks from yesterday)
   - "From all previous days" section → "Bring all forward" (brings all uncompleted tasks from any past day)
2. **Manual "Add to Day"** button: Adds individual tasks to current day

### What's Missing
**Automatic carryover service** that:
- Runs daily (or on page load for "today")
- Automatically assigns uncompleted tasks from previous days to today
- Could be configurable (e.g., "auto-carryover from yesterday only" vs "from all past days")

### Implementation Needed
1. **Service**: `lib/server/workops/auto-carryover-service.ts`
   - Function: `autoCarryoverUncompletedTasks(outlookId, targetDay)`
   - Logic: Find all uncompleted tasks assigned to days before `targetDay`, create `DailyAssignment` for `targetDay`
   - Filter: Only tasks with `status != 'done'`

2. **Trigger Options**:
   - **Option A**: Run on page load when viewing "today" (in `loadDailyAssignments()`)
   - **Option B**: Scheduled job (cron) that runs daily at midnight
   - **Option C**: User preference toggle ("Auto-carryover enabled")

3. **API Endpoint**: `POST /api/workops/daily-assignments/auto-carryover`
   - Body: `{ day: '2026-03-02' }` (optional, defaults to today)
   - Returns: `{ success: true, carriedOver: number }`

**Status**: ❌ **Not implemented** - Needs to be built.

---

## Issue 3: Category vs Urgency Confusion ⚠️

### Current State
**"Medium" shown is URGENCY, not category** - There's confusion between two different concepts.

### What Exists
1. **Urgency Field** (`WorkOpsUrgency` enum):
   - Values: `low`, `medium`, `high`, `critical`
   - Purpose: Indicates urgency/priority level
   - Displayed as: Colored pill badge (yellow for medium, red for critical, etc.)

2. **ItemType Field** (`WorkOpsItemType` enum):
   - Values: `task`, `capture`, `meeting`, `signal`, `boss_request`, `tech_work`, `admin`, `workforce_comms`, `external_pressure`, `personal`
   - Purpose: Categorizes the nature/type of work item
   - Displayed as: Gray badge showing the type

### What User Wants
**Category field** separate from urgency and itemType, with values:
- `product` - Product-related work
- `planning` - Planning work
- `bossrequest` - Requests from boss
- `emergent` - Emergent/urgent items
- `companyevent` - Company events (require several waves of planning)

### Current Confusion
- User sees "medium" badge and thinks it's a category
- Actually it's urgency (low/medium/high/critical)
- User wants categories by work TYPE, not urgency

### Schema Gap
**No `category` field exists** on `WorkOpsItem` model. Need to add:
```prisma
enum WorkOpsCategory {
  product
  planning
  bossrequest
  emergent
  companyevent
}

model WorkOpsItem {
  // ... existing fields ...
  category WorkOpsCategory?  // NEW FIELD
}
```

### Implementation Needed
1. **Database Migration**: Add `category` field to `WorkOpsItem`
2. **Enum**: Create `WorkOpsCategory` enum
3. **UI Updates**:
   - Edit modal: Add category dropdown
   - Display: Show category badge (separate from urgency badge)
   - Filtering: Allow filtering by category
4. **API Updates**: Update create/update endpoints to accept `category`

**Status**: ⚠️ **Schema gap** - Category field doesn't exist. Urgency is being confused for category.

---

## Documentation Summary

### Existing Documentation
- `docs/WORKOPS_MODEL_ANALYSIS.md` - Model structure and relationships
- `docs/WORKOPS_ARCHITECTURE_CLARIFICATION.md` - Architecture overview
- `docs/WORKOPS_FLOW_SUMMARY.md` - User flow documentation
- `docs/TASK_UX_AND_PREVIOUS_DAY.md` - Task UX details

### Key Files
- **Daily Page**: `app/workops/daily/page.tsx` - Main UI for daily task management
- **API Routes**: 
  - `app/api/workops/item/[itemId]/route.ts` - Update/delete items
  - `app/api/workops/daily-assignments/route.ts` - Daily assignment CRUD
- **Services**:
  - `lib/server/workops/items.ts` - Item database operations
  - `lib/server/workops/daily-assignments.ts` - Assignment operations

---

## Recommendations

### Priority 1: Fix Category Confusion
1. Add `category` field to schema
2. Update UI to show category separately from urgency
3. Update edit modal to include category dropdown
4. Migrate existing data (if needed)

### Priority 2: Implement Auto Carryover
1. Create auto-carryover service
2. Add API endpoint
3. Integrate into daily page (run on "today" view)
4. Consider user preference toggle

### Priority 3: Improve "Mark as Done" UX
1. Make the circle button more obvious
2. Add keyboard shortcut (e.g., spacebar to toggle)
3. Add bulk "mark all visible as done" option
4. Show completion animation/feedback

---

## Questions to Clarify

1. **Category vs ItemType**: Should `category` replace `itemType`, or coexist? (Recommendation: coexist - itemType is about nature of work, category is about work classification)

2. **Auto Carryover Scope**: 
   - Only from yesterday? 
   - From all past days?
   - User-configurable?

3. **Category Defaults**: Should existing tasks get a default category based on `itemType`? (e.g., `boss_request` itemType → `bossrequest` category)

---

**Last Updated:** March 2, 2026
