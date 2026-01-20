# WorkOps Model Analysis

## Overview

This document provides a comprehensive analysis of the `WorkOpsOutlook` model and all related submodels that support personal work operations and task management.

---

## 1. Core WorkOps Models

### 1.1 `WorkOpsOutlook` (Personal Work Container)

**Location:** `prisma/schema.prisma` (lines 1305-1316)

**Purpose:** Personal work operations container - one per user (WorkMe). Acts as the central hub for all work items, tasks, and operational activities.

### Structure
```prisma
model WorkOpsOutlook {
  id        String   @id @default(cuid())
  workMeId  String   @unique @db.Uuid
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workMe           WorkMe                   @relation(fields: [workMeId], references: [id], onDelete: Cascade)
  items            WorkOpsItem[]
  dailyAssignments WorkOpsDailyAssignment[]

  @@index([workMeId])
}
```

**Key Features:**
- **One-to-One with WorkMe:** Each user has exactly one outlook (enforced by `@unique`)
- **Cascade Delete:** When a WorkMe is deleted, their outlook and all items are deleted
- **Personal Container:** All work items belong to a single outlook per user

**Usage:**
- Personal task management
- Work backlog organization
- Strategic planning whiteboard
- Daily work assignments

---

### 1.2 `WorkOpsItem` (Work Items)

**Location:** `prisma/schema.prisma` (lines 1318-1342)

**Purpose:** Individual work items within a user's outlook. Supports various item types, status tracking, urgency levels, and whiteboard positioning.

### Structure
```prisma
model WorkOpsItem {
  id        String   @id @default(cuid())
  outlookId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  title String
  body  String?

  itemType WorkOpsItemType
  urgency  WorkOpsUrgency?
  status   WorkOpsStatus   @default(open)
  source   WorkOpsSource?

  priority   Int?
  dueDate    DateTime?
  assignedBy String?

  outlook          WorkOpsOutlook           @relation(fields: [outlookId], references: [id], onDelete: Cascade)
  dailyAssignments WorkOpsDailyAssignment[]

  @@index([outlookId])
  @@index([status])
  @@index([itemType])
}
```

**Key Features:**
- **Flexible Item Types:** Supports 11 different item types (task, capture, meeting, signal, fire, boss_request, tech_work, admin, workforce_comms, external_pressure, personal)
- **Status Tracking:** open, in_progress, blocked, done
- **Urgency Levels:** low, medium, high, critical
- **Source Tracking:** manual, ai, boss, system
- **Due Dates:** Optional deadline tracking
- **Priority:** Numeric priority field
- **Whiteboard Support:** Position tracking (positionX, positionY, groupId, targetQuarter) - stored in JSON or separate fields

**Usage Examples:**
- Tasks and to-dos
- Meeting notes and follow-ups
- Boss requests and assignments
- Captured thoughts and ideas
- Signals and important information
- Technical work items
- Administrative tasks
- Workforce communications
- External pressures
- Personal work items

---

### 1.3 `WorkOpsDailyAssignment` (Daily Work Planning)

**Location:** `prisma/schema.prisma` (lines 1344-1361)

**Purpose:** Links work items to specific days for daily planning and assignment tracking.

### Structure
```prisma
model WorkOpsDailyAssignment {
  id        String   @id @default(cuid())
  outlookId String
  itemId    String
  day       DateTime
  dayIndex  Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  outlook WorkOpsOutlook @relation(fields: [outlookId], references: [id], onDelete: Cascade)
  item    WorkOpsItem    @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([itemId, day])
  @@index([outlookId])
  @@index([itemId])
  @@index([day])
}
```

**Key Features:**
- **Daily Planning:** Assigns items to specific days
- **Unique Constraint:** Prevents duplicate assignments of the same item to the same day
- **Day Index:** Optional numeric index for ordering within a day
- **Cascade Delete:** Deleted when outlook or item is deleted

**Usage:**
- Daily work planning
- Task scheduling
- Daily standup preparation
- Work allocation tracking

---

## 2. Enumerations

### 2.1 `WorkOpsItemType` Enum

**Location:** `prisma/schema.prisma` (lines 1270-1282)

```prisma
enum WorkOpsItemType {
  task              // General tasks and to-dos
  capture           // Captured thoughts, ideas, notes
  meeting            // Meeting notes, follow-ups, action items
  signal             // Important signals, notifications
  fire               // Urgent/emergency items
  boss_request       // Requests from boss/supervisor
  tech_work          // Technical work items
  admin              // Administrative tasks
  workforce_comms    // Workforce communications
  external_pressure  // External pressures, deadlines
  personal           // Personal work items
}
```

**Purpose:** Categorizes work items by their nature and origin.

---

### 2.2 `WorkOpsUrgency` Enum

**Location:** `prisma/schema.prisma` (lines 1284-1289)

```prisma
enum WorkOpsUrgency {
  low       // Low priority
  medium    // Medium priority
  high      // High priority
  critical  // Critical/urgent
}
```

**Purpose:** Indicates the urgency level of work items.

---

### 2.3 `WorkOpsStatus` Enum

**Location:** `prisma/schema.prisma` (lines 1291-1296)

```prisma
enum WorkOpsStatus {
  open          // Not started (default)
  in_progress   // Currently being worked on
  blocked       // Blocked by something
  done          // Completed
}
```

**Purpose:** Tracks the current state of work items.

---

### 2.4 `WorkOpsSource` Enum

**Location:** `prisma/schema.prisma` (lines 1298-1303)

```prisma
enum WorkOpsSource {
  manual  // Manually created by user
  ai      // AI-generated or suggested
  boss    // Created from boss request
  system  // System-generated
}
```

**Purpose:** Tracks the origin of work items.

---

## 3. Relationships

### 3.1 WorkOpsOutlook → WorkMe

**Relationship Type:** One-to-One (unique constraint)

**Delete Behavior:** CASCADE (when WorkMe is deleted, outlook is deleted)

**Purpose:** Links work operations to user identity.

---

### 3.2 WorkOpsOutlook → WorkOpsItem

**Relationship Type:** One-to-Many

**Delete Behavior:** CASCADE (when outlook is deleted, all items are deleted)

**Purpose:** Container for all work items belonging to a user.

---

### 3.3 WorkOpsItem → WorkOpsDailyAssignment

**Relationship Type:** One-to-Many

**Delete Behavior:** CASCADE (when item is deleted, all daily assignments are deleted)

**Purpose:** Links items to specific days for planning.

---

### 3.4 WorkOpsOutlook → WorkOpsDailyAssignment

**Relationship Type:** One-to-Many

**Delete Behavior:** CASCADE (when outlook is deleted, all daily assignments are deleted)

**Purpose:** Tracks all daily assignments for a user's outlook.

---

## 4. API Structure

### 4.1 Outlook API

**Endpoint:** `GET /api/workops/outlook`

**Purpose:** Get or create WorkOpsOutlook for authenticated user

**Response:**
```typescript
{
  success: true,
  outlook: {
    id: string,
    workMeId: string,
    createdAt: DateTime,
    updatedAt: DateTime,
    items: WorkOpsItem[]
  }
}
```

**Service:** `lib/server/workops/outlook.ts`
- `getOrCreateOutlook(workMeId)` - Gets or creates outlook
- `getOutlook(workMeId)` - Gets existing outlook

---

### 4.2 Item API

**Endpoints:**
- `POST /api/workops/item/create` - Create new work item
- `GET /api/workops/item/[itemId]` - Get work item
- `PATCH /api/workops/item/[itemId]` - Update work item
- `POST /api/workops/item/analyze` - AI analysis of work items

**Service:** `lib/server/workops/items.ts`
- `createWorkOpsItem(data)` - Create new item
- `getWorkOpsItem(id)` - Get item by ID
- `listWorkOpsItems(outlookId)` - List all items for outlook
- `updateWorkOpsItem(id, data)` - Update item

---

## 5. UI Components

### 5.1 Pages

**Location:** `app/workops/`

- **`/workops/overall`** - Overall outlook view (whiteboard + list)
- **`/workops/daily`** - Daily work planning (coming soon)
- **`/workops/captures`** - Captured thoughts and ideas (coming soon)
- **`/workops/boss-briefing`** - Boss requests and briefings (coming soon)
- **`/workops/downstream`** - Downstream work generator (coming soon)

---

### 5.2 Components

**Location:** `components/workops/`

- **`AddWorkModal`** - Modal for adding new work items
- **`SourceSelector`** - Source selection (boss_tasking, capture, manual, workforce_stuff, etc.)
- **`DynamicForm`** - Dynamic form based on selected source
- **`WhiteboardView`** - Whiteboard visualization of work items
- **Form Components:**
  - `BossTaskingForm`
  - `CaptureForm`
  - `ManualEntryForm`
  - `WorkforceStuffForm`
  - `CompanyMilestonesForm`
  - `EmployeeHighlightsForm`
  - `ExternalPressuresForm`
  - `ProductsForm`

---

## 6. Work Item Sources

### 6.1 Supported Sources

The `AddWorkModal` supports the following source types:

1. **`boss_tasking`** - Tasks from boss/supervisor
2. **`capture`** - Captured thoughts and ideas
3. **`manual`** - Manually entered items
4. **`workforce_stuff`** - Company workforce items
5. **`company_milestones`** - Company milestones
6. **`employee_highlights`** - Employee highlights
7. **`products`** - Product-related work
8. **`external_pressures`** - External pressures

---

## 7. Whiteboard Features

### 7.1 Whiteboard Positioning

Work items support whiteboard positioning with:
- `positionX` - X coordinate on whiteboard
- `positionY` - Y coordinate on whiteboard
- `groupId` - Group/cluster identifier
- `targetQuarter` - Target quarter for strategic planning

**Usage:**
- Strategic planning visualization
- Work organization by quarter
- Grouping related items
- Visual work backlog management

---

## 8. Summary Table

| Model | FK Field | Relationship Type | Delete Behavior | Purpose |
|-------|----------|-------------------|-----------------|---------|
| **WorkOpsOutlook** | `workMeId` | One-to-One with WorkMe | CASCADE | Personal work container |
| **WorkOpsItem** | `outlookId` | Many-to-One with Outlook | CASCADE | Individual work items |
| **WorkOpsDailyAssignment** | `outlookId`, `itemId` | Many-to-Many (via junction) | CASCADE | Daily work planning |

---

## 9. Key Insights

1. **Personal Work System:** WorkOps is designed as a personal work operations system, not a team collaboration tool
2. **Flexible Item Types:** 11 different item types support various work scenarios
3. **Status Tracking:** Four-state status system (open, in_progress, blocked, done)
4. **Daily Planning:** Daily assignments enable day-by-day work planning
5. **Whiteboard Support:** Visual organization with positioning and grouping
6. **Source Tracking:** Tracks where work items come from (manual, AI, boss, system)
7. **Cascade Deletes:** All related data is cleaned up when outlook is deleted

---

## 10. Migration History

### 10.1 Initial Migration

**Migration:** `20250104140000_workops_refactor_stage1`

**Changes:**
- Created `WorkOpsOutlook`, `WorkOpsItem`, `WorkOpsDailyAssignment` models
- Dropped old `MyWorkOutlook`, `MyWorkItem`, `AdminWorkItem`, `WorkOutlookItem` models
- Introduced enums: `WorkOpsItemType`, `WorkOpsUrgency`, `WorkOpsStatus`, `WorkOpsSource`

**Purpose:** Refactored from multiple work models to unified WorkOps system.

---

## 11. Future Enhancements

### Planned Features (Coming Soon):

1. **Daily Outlook Page** - Full daily work planning interface
2. **Captures Page** - Dedicated view for captured thoughts and ideas
3. **Boss Briefing Page** - Boss requests and briefings interface
4. **Downstream Work Generator** - Generate work items from upstream sources
5. **Goal Creation** - Link work items to goals
6. **AI Analysis** - Enhanced AI analysis of work items
7. **Whiteboard Enhancements** - Advanced grouping and visualization

---

## 12. Recommendations

### For Work Item Management:

1. **Use Item Types Appropriately:** Choose the right item type for better organization
2. **Set Urgency Levels:** Use urgency to prioritize work
3. **Track Status:** Keep status updated for accurate work tracking
4. **Use Daily Assignments:** Plan work day-by-day for better focus
5. **Leverage Whiteboard:** Use whiteboard view for strategic planning
6. **Track Sources:** Use source field to understand where work comes from

### For Development:

1. **Complete Daily Page:** Build out daily outlook planning interface
2. **Enhance Whiteboard:** Add drag-and-drop, grouping, and filtering
3. **AI Integration:** Expand AI analysis and suggestions
4. **Goal Linking:** Connect work items to goals and objectives
5. **Reporting:** Add analytics and reporting for work patterns

---

**Last Updated:** 2025-01-XX  
**Schema Version:** Current (as of analysis date)



