# My Work - Deep Dive Documentation

**Date:** 2025-01-04  
**Purpose:** Comprehensive explanation of the "My Work" section and its three main components

---

## 🎯 Overview

The **"My Work"** section in Work.me is your personal workspace for managing work-related activities. It consists of three main areas:

1. **Work From Company Stuff** - Browse company items and create outputs from them
2. **Stuff I'm Working On** - View your active work outputs/products
3. **My Work Outlook** - **YOUR TASKS** (task management system)

---

## 📍 Navigation

**Location in Sidebar:** `MyWork` section  
**Base Route:** `/mywork`

### Sidebar Menu Items:
- **Create Output** → `/mywork/create`
- **Work From Company Stuff** → `/mywork/fromcompanystuff`
- **Stuff I'm Working On** → `/mywork/active`
- **My Work Outlook** → `/my/outlook` ⭐ **THIS IS WHERE YOUR TASKS ARE**
- **Admin** → `/my/admin`

---

## 1️⃣ Work From Company Stuff

**Route:** `/mywork/fromcompanystuff`  
**Purpose:** Browse company-level items and create work outputs from them

### What It Does:
- Provides a starting point to browse company items
- Links to `/mycompany/workforcestuff?select=true` to select items
- Allows you to create outputs from:
  - **Workforce Stuff Items** (events, trainings, benefits, campaigns, etc.)
  - **Company Milestones**
  - **Work Signals**

### Workflow:
1. Click "Browse Company Stuff"
2. Select a company item (event, training, milestone, etc.)
3. Create an output/product from that item
4. Output is created and can be viewed in "Stuff I'm Working On"

### Database Models:
- **WorkforceStuffItem** (interface, not yet in Prisma schema)
- **CompanyEvent**, **CompanyTraining**, **CompanyMilestone**, etc.
- **WorkOutput** or **WorkOutputStandalone** (the created output)

### Current Status:
✅ **Functional** - Page exists and links to company stuff browser

---

## 2️⃣ Stuff I'm Working On

**Route:** `/mywork/active`  
**Purpose:** View your active work outputs/products that you're currently working on

### What It Shows:
- **Active WorkOutputs** - Products/outputs you're creating
- **Archived WorkOutputs** - Past outputs
- Organized by status (active vs archived)

### WorkOutput Types:
WorkOutputs are **products** you create, such as:
- Email products
- Posters
- Need to Know (NTK) documents
- Digital signage
- Talking points
- Flyers
- SharePoint updates
- Photo/video content

### Database Models:
- **WorkOutput** - Outputs linked to WorkContext or WorkSupport
- **WorkOutputStandalone** - Standalone outputs not tied to a context
- **WorkCommsProduct** - Unified product model (newer)

### Current Status:
⚠️ **Partially Implemented** - Page exists but API call is TODO:
```typescript
// TODO: Implement API call to fetch active WorkOutputs
// Active = status !== archived AND createdAt < deadline
// Archive automatically when past certain date
```

### What You'll See:
- Cards showing each active output
- Output type badge
- Title
- Due date (if set)
- "Due Soon" indicator if deadline is within 7 days
- Link to view/edit the output

---

## 3️⃣ My Work Outlook ⭐ **YOUR TASKS**

**Route:** `/my/outlook`  
**Purpose:** **This is your task management system** - where you manage your personal work items/tasks

### What It Is:
**My Work Outlook** is your personal task tracker. This is where you:
- Add tasks/work items
- Track their status
- Set due dates
- Add notes and tags
- Organize your work

### Features:
- ✅ **Quick Add** - Add new tasks quickly
- ✅ **Status Management** - 4 statuses: `open`, `done`, `blocked`, `watch`
- ✅ **Due Dates** - Set and track deadlines
- ✅ **Tags** - Categorize tasks: `comms`, `admin`, `personal`, `project`, `meeting`
- ✅ **Notes** - Add detailed notes to each task
- ✅ **Kanban View** - Tasks grouped by status in columns

### Task Statuses:
1. **Open** - New/active tasks
2. **Done** - Completed tasks
3. **Blocked** - Tasks that are stuck/waiting
4. **Watch** - Tasks to monitor (not actively working on)

### Database Models:

#### MyWorkOutlook
```prisma
model MyWorkOutlook {
  id        String   @id @default(cuid())
  workMeId  String   @unique  // One outlook per user
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  items     MyWorkItem[]
}
```

#### MyWorkItem (Your Tasks)
```prisma
model MyWorkItem {
  id        String   @id @default(cuid())
  outlookId String
  title     String
  notes     String?
  status    String   @default("open")  // "open" | "done" | "blocked" | "watch"
  dueDate   DateTime?
  tag       String?  // "comms" | "admin" | "personal" | "project" | "meeting"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### API Endpoints:
- `GET /api/outlook` - Get your outlook (but this uses different model - see note below)
- `GET /api/outlook/item` - Get all MyWorkItems (via outlook page)
- `POST /api/outlook/item` - Create new task
- `PUT /api/outlook/item/[id]` - Update task
- `DELETE /api/outlook/item/[id]` - Delete task

### Current Status:
✅ **Fully Functional** - Complete CRUD operations implemented

### UI Features:
- **Quick Add Form** - Add tasks at the top
- **Status Columns** - 4 columns (Open, Done, Blocked, Watch)
- **Task Cards** - Each task shows:
  - Title
  - Notes (if any)
  - Due date (if set)
  - Tag badge (if tagged)
  - Status badge (clickable to toggle)
  - Edit button
  - Delete button
- **Inline Editing** - Click "Edit" to modify task details

---

## 🔄 Relationship Between Sections

```
Company Stuff (MyCompany)
    ↓
Work From Company Stuff (browse & select)
    ↓
Create Output (WorkOutput/Product)
    ↓
Stuff I'm Working On (view active outputs)
    ↓
My Work Outlook (manage tasks related to outputs)
```

### Example Workflow:
1. **Browse Company Stuff** → Find a company training event
2. **Work From Company Stuff** → Select that training
3. **Create Output** → Create an email product for the training
4. **Stuff I'm Working On** → See the email product in your active list
5. **My Work Outlook** → Add tasks like "Review email draft", "Get approval", "Send by Friday"

---

## 📊 Key Differences

| Feature | Work From Company Stuff | Stuff I'm Working On | My Work Outlook |
|---------|------------------------|---------------------|-----------------|
| **Purpose** | Browse & select company items | View work outputs/products | Manage personal tasks |
| **Data Type** | Company items (events, trainings, etc.) | WorkOutput/Product objects | MyWorkItem (tasks) |
| **Status** | Functional | Partially implemented | Fully functional |
| **CRUD** | Browse only | View only (for now) | Full CRUD |
| **Scope** | Company-level | Your outputs | Personal tasks |

---

## 🎯 Quick Answer: Where Are My Tasks?

**Your tasks are in "My Work Outlook"** at `/my/outlook`

This is a fully functional task management system where you can:
- ✅ Add tasks
- ✅ Set status (open/done/blocked/watch)
- ✅ Set due dates
- ✅ Add notes and tags
- ✅ Edit and delete tasks
- ✅ View tasks in a Kanban-style board

---

## 🔍 Additional Notes

### Legacy Routes:
- `/tasks` - Legacy route (placeholder, needs migration to `/mywork/tasks`)
- `/tasks/new` - Legacy route (placeholder)
- `/tasks/[taskId]` - Legacy route (placeholder)

**Note:** These legacy routes should eventually redirect to or be migrated under `/mywork/tasks/*`, but currently "My Work Outlook" at `/my/outlook` is the active task system.

### Two Different "Outlook" Models:
There are actually TWO different outlook systems in the codebase:

1. **MyWorkOutlook + MyWorkItem** (Used by `/my/outlook`)
   - Task management system
   - Fully implemented
   - This is what you want for tasks!

2. **WorkOutlookItem** (Used by `/api/outlook`)
   - Date-based outlook items
   - Different purpose (daily planning)
   - Not the same as tasks

**For tasks, use MyWorkOutlook/MyWorkItem at `/my/outlook`**

---

## 📝 Summary

- **Work From Company Stuff** = Browse company items to create outputs from
- **Stuff I'm Working On** = View your active work outputs/products (partially implemented)
- **My Work Outlook** = **YOUR TASKS** - Full task management system ✅

**To see your tasks, go to `/my/outlook` or click "My Work Outlook" in the sidebar!**

