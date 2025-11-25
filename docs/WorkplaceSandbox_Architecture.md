# WorkplaceSandbox Architecture

## Overview

**WorkplaceSandbox** is the container section for company-internal happenings. Users create **CompanyHappenings** (events, training, campaigns, causes, benefits, etc.) through this hub.

---

## Hierarchy

```
WorkplaceSandbox (Section Header)
  └── Dashboard (Button/Link → /mywork)
        └── CompanyHappening Hub (Grid of types)
              ├── Events ✅ (Built out - has nav button)
              ├── Training 🚧 (Next up)
              ├── Campaigns
              ├── Impacts
              ├── Community
              ├── Benefits
              ├── Career
              └── Employee Cause
```

---

## Navigation Structure

### Sidebar
- **WorkplaceSandbox** (section header - the container)
  - **Dashboard** → `/mywork` (shows the hub)
  - **Events** → Quick access (mini button, since it's fully built out)
  - WorkSupport
  - WorkOutputs

---

## CompanyHappening Types

**CompanyHappenings** are company-level happenings that users can build and manage. Types include:

1. **Events** ✅ **FULLY BUILT**
   - Has full ingest flow (AI + manual)
   - Promotional products
   - Export utilities
   - Mini nav button for quick access

2. **Training** 🚧 **NEXT UP**
   - Coming soon

3. **Campaigns**
   - Company campaigns/initiatives

4. **Impacts** (Impact Events)
   - Disruptions affecting workforce activities

5. **Community Opportunities**
   - Community engagement opportunities

6. **Benefits**
   - Benefits enrollment windows (e.g., Open Season)

7. **Career**
   - Performance reviews, assessments, career development

8. **Employee Cause**
   - Employee-driven causes, drives, donation campaigns

---

## Hub Flow

### 1. Landing Hub (`/mywork`)
- **Title**: "WorkplaceSandbox"
- **Description**: "Build and manage company-level happenings"
- **Grid**: Shows all CompanyHappening types with:
  - Icon
  - Name
  - Description
  - Count of existing items
  - **"+ Add [Type]"** button
  - **"View All →"** link (if items exist)

### 2. Type Sections
- Each type gets its own section below the grid
- Shows existing items grouped by type
- Each item card links to detail page (`/mywork/context/[contextId]`)

### 3. Create Flow
- Click **"+ Add [Type]"** → Goes to `/mywork/context/new/[type]`
- Create form → Success → Detail page (landing hub for that happening)

---

## Detail Page (Landing Hub for Single Happening)

When viewing a specific CompanyHappening (`/mywork/context/[contextId]`):

### Event Example:
- **Header**: Title, type badge, created date
- **"Add" dropdown** (top right): 
  - Add Promotional Product
  - Add Output
  - Add Event Item
- **Event Data** (hydrated): All fields displayed (theme, audience, perks, etc.)
- **Existing Items**:
  - Promotional Products list
  - Event Items list
  - Outputs list
- **Actions**: Links to WorkSupport, WorkOutputs, etc.

### Other Types:
- Similar structure
- Type-specific fields displayed
- Type-specific "Add" options

---

## Current Status

### ✅ Built Out
- **Events**: Full flow from ingest → promotional products → exports
- **Hub page** (`/mywork`): Shows all types in grid
- **Detail pages**: Context-aware display

### 🚧 In Progress
- **Training**: Next priority

### 📋 Planned
- Type-specific features for other CompanyHappening types
- Enhanced detail pages for each type

---

## Routes

- `/mywork` → **WorkplaceSandbox Hub** (grid of all types)
- `/mywork/context/new` → Type chooser
- `/mywork/context/new/[type]` → Create form for specific type
- `/mywork/context/[contextId]` → **Landing hub** for single happening
- `/mywork/context/[contextId]/success` → Success page

---

## Key Concepts

1. **WorkplaceSandbox** = Section/container name (sidebar header)
2. **Dashboard** = The hub button that shows all happenings
3. **CompanyHappening** = Generic term for any type (Event, Training, Campaign, etc.)
4. **Hub** = Grid view showing all types with "Add" buttons
5. **Landing Hub** = Detail page for a single happening (shows what's there, allows adding more)

---

## Future: Training Flow

When Training is built out:
- Will follow same pattern as Events
- Will get mini nav button like Events
- Full ingest → training items → outputs flow

