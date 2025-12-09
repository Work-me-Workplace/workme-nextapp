# Two-Phase Hydration Architecture

## Overview

WorkMe uses a two-phase hydration pattern to optimize initial load and data fetching:

1. **Phase 1 (Welcome)**: Hydrate WorkMe identity
2. **Phase 2 (Dashboard)**: Hydrate all models that depend on WorkMe

---

## Phase 1: WorkMe Identity Hydration (Welcome Page)

### When
- On `/welcome` page load
- First authenticated page after signin

### What Gets Hydrated
- **WorkMe** object (full record with all nested relations)
  - id, firebaseId, email, createdAt
  - headline, handle, title, linkedinUrl
  - **companyId** (authoritative FK)
  - **companyUnit** (string label)
  - workMeCompany + nested workMeCompany
  - workProfile, workSkills
  - workEntries[], workGoals[]
  - workplaces[]
  - ecosystemCompanies[], ecosystemContacts[]
  - workOpsOutlook
  - companyProducts[], externalCompanyPressures[]

### Storage
- Stored in localStorage as `workme` (JSON string)
- Access via `getWorkMe()` helper

### API Endpoint
- `GET /api/workme/me`
- Returns full WorkMe object with all nested relations

---

## Phase 2: Dashboard Models Hydration (Dashboard Page)

### When
- On `/dashboard` page load
- After WorkMe is confirmed hydrated

### What Gets Hydrated
All models scoped by `companyId` or `companyUnit`:

- **CompanyEmployee[]** (scoped by `companyId`)
- **CompanyEmployeeHighlight[]** (scoped by `companyId` via employees)
- **CompanyCampaign[]** (scoped by `companyUnit` string)
- **CompanyTraining[]** (scoped by `companyUnit` string)
- **CompanyEvent[]** (scoped by `companyUnit` string)
- **CompanyCommunity[]** (scoped by `companyUnit` string)
- **CompanyCareer[]** (scoped by `companyUnit` string)
- **CompanyBenefits[]** (scoped by `companyUnit` string)
- **CompanyEmployeeCause[]** (scoped by `companyUnit` string)

### Storage
- Stored in localStorage as `dashboard` (JSON string)
- Access via `getDashboard()` helper

### API Endpoint
- `GET /api/dashboard/hydrate`
- Requires WorkMe to be authenticated
- Uses `workMe.companyId` and `workMe.companyUnit` for scoping

---

## Flow Diagram

```
User Signs In
    ↓
Welcome Page (/welcome)
    ↓
Phase 1: GET /api/workme/me
    ↓
Store WorkMe in localStorage
    ↓
User clicks "Continue to Dashboard"
    ↓
Dashboard Page (/dashboard)
    ↓
Check: WorkMe hydrated? ✅
    ↓
Phase 2: GET /api/dashboard/hydrate
    ↓
Store dashboard data in localStorage
    ↓
Dashboard renders with all data
```

---

## Client Helpers

### WorkMe Helpers (`lib/workme.client.ts`)

```typescript
import { getWorkMe, refreshWorkMe } from '@/lib/workme.client'

// Get stored WorkMe
const workMe = getWorkMe()
const companyId = workMe?.companyId // ✅ Available after Phase 1

// Refresh WorkMe from API
const refreshed = await refreshWorkMe()
```

### Dashboard Helpers (`lib/dashboard.client.ts`)

```typescript
import { getDashboard, refreshDashboard } from '@/lib/dashboard.client'

// Get stored dashboard data
const dashboard = getDashboard()
const employees = dashboard?.employees // ✅ Available after Phase 2

// Refresh dashboard from API
const refreshed = await refreshDashboard()
```

---

## How Routes Get `companyId`

### Pattern: Client Sends `companyId` from Stored WorkMe

```typescript
// Client component
import { getWorkMe } from '@/lib/workme.client'

const workMe = getWorkMe()
const companyId = workMe?.companyId

// Send in API request
await api.post('/api/company/employees/create', {
  employeeData,
  companyId, // From Phase 1 hydration
})
```

### Pattern: Server Route Looks Up WorkMe

```typescript
// Server route
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { id: workMeId } = await requireWorkMeAuth(request)
  
  // Look up WorkMe to get companyId
  const workMe = await prisma.workMe.findUnique({
    where: { id: workMeId },
    select: { companyId: true, companyUnit: true },
  })
  
  const companyId = workMe?.companyId
  
  // Use companyId for object creation
  const employee = await prisma.companyEmployee.create({
    data: { ...employeeData, companyId },
  })
}
```

---

## Benefits

1. **Fast Welcome**: Only loads identity, not all related data
2. **Efficient Dashboard**: Loads all company-scoped data in one request
3. **Offline Capable**: Data stored in localStorage for quick access
4. **Clear Separation**: Identity vs. domain data
5. **Scalable**: Easy to add more models to Phase 2

---

## localStorage Keys

- `workme` - Full WorkMe object (Phase 1)
- `dashboard` - All dashboard models (Phase 2)

---

## Refresh Strategy

- **WorkMe**: Refresh when profile is updated
- **Dashboard**: Refresh when company data changes (new highlights, employees, etc.)
- Both can be refreshed independently

