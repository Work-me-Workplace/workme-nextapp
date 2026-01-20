# Workforce Pressures Model Analysis

## Overview

The **ExternalCompanyPressure** model represents user-specific external pressures affecting their company or work context. This model tracks external signals, pressures, and developments from sources like GAO, Congress, Industry, etc. that impact the user's work environment.

**Key Distinction:** This is a **user-specific** model (scoped to `workMeId`), unlike the `CompanyExternalEnv` model which is company-wide and shared across users.

---

## Database Schema

### Model Definition

Located in `prisma/schema.prisma` (lines 1700-1715):

```prisma
model ExternalCompanyPressure {
  id        String   @id @default(cuid())
  workMeId  String   @db.Uuid
  source    String
  category  String?
  summary   String
  impact    String?
  createdAt DateTime @default(now())

  workMe WorkMe @relation(fields: [workMeId], references: [id], onDelete: Cascade)

  @@index([source])
  @@index([category])
}
```

### Field Analysis

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (cuid) | Yes | Primary key, auto-generated |
| `workMeId` | UUID | Yes | Foreign key to WorkMe (user identity) |
| `source` | String | Yes | Source of the pressure (e.g., "GAO", "Congress", "Industry") |
| `category` | String | No | Optional categorization (e.g., "Budget", "Legislation", "Testing", "Ops") |
| `summary` | String | Yes | Description/summary of the external pressure |
| `impact` | String | No | Optional field describing why this matters and its significance |
| `createdAt` | DateTime | Yes | Timestamp of creation (auto-set) |

### Key Design Decisions

1. **User-Scoped (Not Company-Wide)**: Each pressure belongs to a specific `workMeId`, meaning each user maintains their own list of pressures. This allows for personal filtering and relevance.

2. **Simple Structure**: The model is intentionally minimal with just 4 content fields (`source`, `category`, `summary`, `impact`). No complex relationships or nested structures.

3. **No Update Timestamp**: Unlike many models, this one doesn't have an `updatedAt` field. This suggests pressures are treated as immutable records or that updates are infrequent.

4. **Cascade Delete**: When a WorkMe user is deleted, all their pressures are automatically deleted (`onDelete: Cascade`).

5. **Indexing Strategy**: 
   - Indexed on `source` for filtering by origin
   - Indexed on `category` for categorization queries
   - No index on `workMeId` (though Prisma typically adds one automatically for foreign keys)

---

## API Implementation

### Endpoints

The model is fully CRUD-enabled through REST API endpoints:

#### 1. Create Pressure
**POST** `/api/external-pressures/create`

- **Location**: `app/api/external-pressures/create/route.ts`
- **Authentication**: Required (Firebase token verification)
- **Validation**:
  - `source`: Required, non-empty string
  - `summary`: Required, non-empty string
  - `category`: Optional, trimmed or null
  - `impact`: Optional, trimmed or null
- **Returns**: Created pressure object

#### 2. List Pressures
**GET** `/api/external-pressures/list`

- **Location**: `app/api/external-pressures/list/route.ts`
- **Authentication**: Required
- **Behavior**: Returns all pressures for the authenticated user, ordered by `createdAt DESC`
- **Returns**: Array of pressure objects (selected fields only)

#### 3. Get Single Pressure
**GET** `/api/external-pressures/[id]`

- **Location**: `app/api/external-pressures/[id]/route.ts`
- **Authentication**: Required
- **Authorization**: Only returns pressures belonging to the authenticated user
- **Returns**: Single pressure object or 404 if not found

#### 4. Update Pressure
**POST** `/api/external-pressures/[id]/update`

- **Location**: `app/api/external-pressures/[id]/update/route.ts`
- **Authentication**: Required
- **Authorization**: Only allows updates to pressures belonging to the authenticated user
- **Behavior**: Partial updates (only provided fields are updated)
- **Validation**: Same as create endpoint for provided fields

### API Patterns

All endpoints follow a consistent pattern:
1. Verify Firebase authentication token
2. Load WorkMe identity from Firebase ID
3. Perform authorization check (ensure user owns the resource)
4. Execute the operation
5. Return standardized JSON response with `success` flag

---

## User Interface

### Pages

#### 1. List View
**Path**: `/mycompany/external-pressures`

- **File**: `app/mycompany/external-pressures/page.tsx`
- **Features**:
  - Grid layout of pressure cards
  - Shows source, category, summary, and creation date
  - Empty state with call-to-action
  - Link to create new pressure
  - Links to individual pressure detail pages

#### 2. Create Page
**Path**: `/mycompany/external-pressures/create`

- **File**: `app/mycompany/external-pressures/create/page.tsx`
- **Features**:
  - Form with fields: source, category, summary, impact
  - Required field validation (source, summary)
  - Redirects to detail page after creation
  - Cancel button to return to list

#### 3. Detail Page
**Path**: `/mycompany/external-pressures/[id]`

- **File**: `app/mycompany/external-pressures/[id]/page.tsx`
- **Features**:
  - Displays all pressure fields
  - Shows creation date
  - Back navigation to list
  - Read-only view (no inline editing)

### UI Design Patterns

- Uses Tailwind CSS for styling
- Consistent navigation with SidebarNav component
- Card-based layouts for list view
- Form-based creation/editing
- Loading states with spinners
- Error handling with console logging

---

## Integration with WorkOps

The ExternalCompanyPressure model is integrated with the WorkOps system as an item type.

### WorkOps Integration

**Item Type**: `external_pressure` (defined in `WorkOpsItemType` enum)

The `external_pressure` type is one of 11 item types supported by WorkOps:
- task, capture, meeting, signal, fire, boss_request, tech_work, admin, workforce_comms, **external_pressure**, personal

### WorkOps Form Component

**File**: `components/workops/add-work/forms/ExternalPressuresForm.tsx`

**Current State**: 
- Form exists but is not fully functional
- Has a TODO comment: "Replace with actual API endpoint when ExternalCompanyPressure API is built"
- Currently returns empty array when loading pressures
- When functional, allows selecting a pressure and creating a WorkOps item from it

**Intended Behavior** (based on code structure):
1. Load user's external pressures
2. Search/filter pressures by source or summary
3. Select a pressure
4. Create a WorkOps item with:
   - Title: `{source}: {summary.substring(0, 100)}`
   - Body: `{impact || summary}`
   - ItemType: `external_pressure`
   - Source: `system`

---

## Comparison with Related Models

### ExternalCompanyPressure vs CompanyExternalEnv

| Aspect | ExternalCompanyPressure | CompanyExternalEnv |
|--------|------------------------|-------------------|
| **Scope** | User-specific (`workMeId`) | Company-wide (`companyId`) |
| **Complexity** | Simple (4 fields) | Complex (15+ fields) |
| **Relationships** | Only to WorkMe | Links to platforms, units, news artifacts, milestones |
| **Change Tracking** | None | `deltaSummary`, `implementationTimeline`, `leadAuthority` |
| **Metadata** | None | `confidenceLevel`, `timeHorizon` |
| **Use Case** | Personal tracking of pressures | Company intelligence and signal tracking |

**Key Insight**: ExternalCompanyPressure is designed for personal, lightweight tracking, while CompanyExternalEnv is for structured company intelligence with rich context and relationships.

---

## Design Strengths

1. **Simplicity**: The model is easy to understand and use with minimal cognitive overhead.

2. **User Privacy**: User-scoped data means users can track personal pressures without sharing with the company.

3. **Flexibility**: Optional `category` and `impact` fields allow for structured or unstructured use.

4. **Complete CRUD**: Full API coverage enables comprehensive management.

5. **Integration Ready**: Designed to integrate with WorkOps system for workflow management.

---

## Design Limitations & Considerations

1. **No Update Timestamp**: Cannot easily track when a pressure was last modified. Consider adding `updatedAt` if updates become common.

2. **No Soft Delete**: Hard deletes only. If archival is needed, consider adding an `archivedAt` field.

3. **No Relationships**: Pressures are isolated. Cannot link to:
   - WorkOps items (except via WorkOps item creation)
   - Company products/platforms
   - News artifacts
   - Other pressures

4. **No Status/Tracking**: Cannot mark pressures as "resolved", "active", "monitoring", etc.

5. **Limited Categorization**: `category` is a free-text field. Consider an enum or separate Category model for consistency.

6. **No Rich Text**: All fields are plain text. No support for formatting, links, or structured content.

7. **No Timestamps on Pressure**: Cannot track when a pressure "started" or when it's expected to be relevant (unlike CompanyExternalEnv which has `timeHorizon`).

8. **WorkOps Integration Incomplete**: The WorkOps form component exists but isn't wired up to load actual pressures.

---

## Migration History

The model appears to have been created as part of the initial schema design. No dedicated migration file specifically for ExternalCompanyPressure was found, suggesting it was created alongside the WorkMe model or in an early schema definition.

The `external_pressure` item type was added to WorkOps in migration `20250104140000_workops_refactor_stage1`, indicating the integration was planned from the WorkOps refactor.

---

## Recommended Enhancements

### Short Term

1. **Complete WorkOps Integration**: Wire up `ExternalPressuresForm` to actually load pressures from the API.

2. **Add Update Timestamp**: Add `updatedAt DateTime @updatedAt` for better tracking.

3. **Add Detail Page Editing**: Allow inline editing on the detail page, not just via API.

### Medium Term

4. **Add Status Field**: Allow marking pressures as "active", "resolved", "monitoring", etc.

5. **Improve Categorization**: Consider a Category enum or model for consistent categorization.

6. **Add Relationships**: Link to WorkOps items (reverse relation) to see which items were created from a pressure.

### Long Term

7. **Add Rich Context**: Consider linking to CompanyExternalEnv entries if a pressure relates to a company-wide signal.

8. **Add Timeline/Relevance**: Track when pressures become relevant or expire.

9. **Add Collaboration**: If pressures become valuable, consider making some "shared" within a company while maintaining personal tracking.

---

## Usage Patterns

Based on the code structure, the intended usage pattern is:

1. **Capture**: User identifies an external pressure (GAO report, Congressional hearing, industry announcement, etc.)
2. **Record**: User creates an ExternalCompanyPressure with source, category, summary, and impact
3. **Monitor**: User views their list of pressures to stay aware of external factors
4. **Act**: User can create WorkOps items from pressures to track related work
5. **Update**: User can update pressure details as situation evolves

---

## Code Locations Reference

### Schema & Models
- `prisma/schema.prisma` (lines 1700-1715): Model definition
- `prisma/schema.prisma` (line 85): WorkMe relation definition

### API Routes
- `app/api/external-pressures/create/route.ts`: Create endpoint
- `app/api/external-pressures/list/route.ts`: List endpoint
- `app/api/external-pressures/[id]/route.ts`: Get single endpoint
- `app/api/external-pressures/[id]/update/route.ts`: Update endpoint

### UI Pages
- `app/mycompany/external-pressures/page.tsx`: List view
- `app/mycompany/external-pressures/create/page.tsx`: Create form
- `app/mycompany/external-pressures/[id]/page.tsx`: Detail view

### Components
- `components/workops/add-work/forms/ExternalPressuresForm.tsx`: WorkOps integration form

### Related Models
- `prisma/schema.prisma` (lines 2210-2266): CompanyExternalEnv model (company-wide version)
- `prisma/schema.prisma` (lines 1328-1365): WorkOpsItem model (integration target)

---

## Conclusion

The ExternalCompanyPressure model is a well-structured, user-scoped model for tracking external pressures affecting an individual's work context. It follows good patterns with complete CRUD operations, clean API design, and clear UI implementation. The model's simplicity is both a strength and a limitation—it's easy to use but lacks advanced features like status tracking, relationships, and rich context that might be needed as the system evolves.

The integration with WorkOps is partially implemented and represents an important use case: converting external pressures into actionable work items. Completing this integration would significantly increase the model's utility.

