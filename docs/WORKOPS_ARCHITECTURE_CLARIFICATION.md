# WorkOps Architecture - Clarification

## The Intended Flow

### Core Concept
**WorkOpsItems** are the atomic unit of work. They live in your **Overall Outlook** (backlog) and can be assigned to specific days via **Daily Outlook**.

### The Flow

```
Quick Capture → WorkOpsItem → Daily Assignment
     ↓              ↓              ↓
  "My thought"   Lives in      "Bolt it to
  or idea        Overall        today/tomorrow"
                  Outlook
```

## Architecture Breakdown

### 1. Overall Outlook = Your Work Backlog
- **Purpose**: Central repository of all work items
- **Contains**: All `WorkOpsItem` records
- **Function**: 
  - View all your work
  - Organize and prioritize
  - Filter by type, status, urgency
  - **NOT** about specific days - just the backlog

### 2. Daily Outlook = Day-Specific Assignment
- **Purpose**: Assign items from backlog to specific days
- **Mechanism**: `WorkOpsDailyAssignment` table
  - Links `WorkOpsItem` to a specific `day` (DateTime)
  - Same item can be assigned to multiple days
  - `dayIndex` for ordering within a day
- **Function**:
  - "Grab" items from Overall Outlook
  - "Bolt them on" to specific days
  - See what's planned for today, tomorrow, next week

### 3. Quick Capture = Fast Item Creation
- **Purpose**: Quickly capture thoughts/ideas as WorkOpsItems
- **Item Type**: `capture`
- **Flow**:
  1. User has a thought/idea
  2. Quick capture creates a `WorkOpsItem` with `itemType: 'capture'`
  3. Item appears in Overall Outlook
  4. User can later assign it to a day in Daily Outlook

## Data Model

```prisma
// The backlog - all work items
model WorkOpsOutlook {
  items WorkOpsItem[]  // All your work items
  dailyAssignments WorkOpsDailyAssignment[]  // Day assignments
}

// A work item (lives in backlog)
model WorkOpsItem {
  itemType WorkOpsItemType  // capture, task, meeting, etc.
  // ... other fields
  dailyAssignments WorkOpsDailyAssignment[]  // Can be assigned to days
}

// Assignment of item to specific day
model WorkOpsDailyAssignment {
  itemId String  // Which item
  day DateTime   // Which day
  dayIndex Int?  // Order within day
}
```

## User Experience Flow

### Scenario 1: Quick Capture
1. User thinks: "I need to follow up with Sarah about the project"
2. Opens Quick Capture (maybe keyboard shortcut or button)
3. Types: "Follow up with Sarah about project"
4. Creates `WorkOpsItem` with:
   - `itemType: 'capture'`
   - `title: "Follow up with Sarah about project"`
   - Lives in Overall Outlook backlog

### Scenario 2: Assign to Daily Outlook
1. User opens Daily Outlook (today's view)
2. Sees list of items already assigned to today
3. Clicks "Add from Backlog" or similar
4. Sees items from Overall Outlook (including the capture from Scenario 1)
5. Drags/drops or clicks to assign item to today
6. Creates `WorkOpsDailyAssignment` linking item to today's date

### Scenario 3: View Overall Outlook
1. User opens Overall Outlook
2. Sees ALL work items (captures, tasks, meetings, etc.)
3. Can filter, organize, prioritize
4. Can see which items are assigned to days (via dailyAssignments)
5. Can create new items via "Add Work" modal

## The "Add Work" Modal

The modal with all the source types (Boss Tasking, Capture, Manual Entry, etc.) is for **creating WorkOpsItems** in the backlog. Each source type maps to an `itemType`:

- **Boss Tasking** → `itemType: 'boss_request'`
- **Capture** → `itemType: 'capture'`
- **Manual Entry** → `itemType: 'task'` (or user selects)
- **Workforce Stuff** → `itemType: 'workforce_comms'`
- **Company Milestones** → `itemType: 'task'` (or specific type)
- **Employee Highlights** → `itemType: 'task'`
- **Products** → `itemType: 'task'`
- **External Pressures** → `itemType: 'external_pressure'`

## Key Insight: Two Separate Views

### Overall Outlook
- **What**: All your work items (backlog)
- **When**: Not time-specific
- **Action**: Create, organize, prioritize items

### Daily Outlook
- **What**: Items assigned to specific days
- **When**: Time-specific (today, tomorrow, next week)
- **Action**: Assign items from backlog to days

## The Confusion

The current UX is confusing because:
1. **Overall Outlook** looks like a task list (which it is, but it's the BACKLOG)
2. **Daily Outlook** is empty/not implemented
3. The connection between them isn't clear
4. Users don't understand: "I create items here, then assign them to days there"

## What Needs to Be Built

### 1. Daily Outlook Page
- Show calendar/day view
- Show items assigned to each day (via `WorkOpsDailyAssignment`)
- "Add from Backlog" button/modal
- Drag items from backlog to days
- See what's planned for today, this week, etc.

### 2. Overall Outlook Improvements
- Make it clear this is the BACKLOG
- Show which items are assigned to days
- Better filtering/organization
- "Assign to Day" action on items

### 3. Quick Capture
- Fast way to create `capture` type items
- Maybe keyboard shortcut
- Maybe floating button
- Creates item in backlog immediately

## The "Bolt On" Concept

When user says "bolt on to daily outlook", they mean:
- Take an item from Overall Outlook (backlog)
- Assign it to a specific day
- Create `WorkOpsDailyAssignment` record
- Item appears in Daily Outlook for that day
- Item still exists in Overall Outlook (it's just assigned to a day)

This is like:
- **Overall Outlook** = Your todo list
- **Daily Outlook** = Your calendar/day planner
- You "bolt" items from your todo list onto specific days

