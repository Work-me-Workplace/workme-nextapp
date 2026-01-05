# WorkOps Flow - Quick Summary

## The Flow You're Imagining

```
Quick Capture → WorkOpsItem (in backlog) → Assign to Daily Outlook
```

**Yes, that's exactly right!**

## How It Works

### 1. Quick Capture Creates WorkOpsItem
- User opens "Add Work" modal
- Selects "Capture" 
- Types their thought/idea
- `CaptureForm` creates a `WorkOpsItem` with:
  - `itemType: 'capture'`
  - `title`: First 100 chars of capture
  - `body`: Full capture text
- **Item goes into Overall Outlook (backlog)**

### 2. Overall Outlook = Backlog
- Shows ALL work items (captures, tasks, meetings, etc.)
- Items live here until assigned to a day
- Can organize, prioritize, filter

### 3. Daily Outlook = Day Assignment
- Shows items assigned to specific days
- Uses `WorkOpsDailyAssignment` to link items to days
- **This is where you "bolt on" items from the backlog**

## The Missing Piece

**Daily Outlook page needs to be built!** Currently it just says "coming soon".

It should:
1. Show calendar/day view
2. Show items assigned to each day
3. Have "Add from Backlog" button
4. Let you drag/assign items from Overall Outlook to specific days
5. Create `WorkOpsDailyAssignment` records

## The "Bolt On" Mechanism

When you assign an item to a day:
- Item stays in Overall Outlook (backlog)
- `WorkOpsDailyAssignment` record created linking:
  - `itemId` → the WorkOpsItem
  - `day` → the specific date
  - `dayIndex` → order within that day
- Item appears in Daily Outlook for that day
- Same item can be assigned to multiple days

## Example Flow

1. **Quick Capture**: "Need to follow up with Sarah"
   - Creates WorkOpsItem in backlog
   - Appears in Overall Outlook

2. **Assign to Day**: Open Daily Outlook → Today
   - Click "Add from Backlog"
   - Select "Need to follow up with Sarah"
   - Creates WorkOpsDailyAssignment
   - Item now appears in Today's view

3. **View Both**:
   - Overall Outlook: Shows all items (including the capture)
   - Daily Outlook: Shows items assigned to today (including the capture)

## Current State

✅ **Working**:
- Overall Outlook page (shows backlog)
- Add Work modal with Capture option
- CaptureForm creates WorkOpsItem
- Database schema supports daily assignments

❌ **Missing**:
- Daily Outlook page implementation
- UI to assign items from backlog to days
- View of items assigned to specific days

## Next Steps

1. Build Daily Outlook page
2. Add "Assign to Day" functionality in Overall Outlook
3. Show which items are assigned to days
4. Make the connection between backlog and daily assignments clear

