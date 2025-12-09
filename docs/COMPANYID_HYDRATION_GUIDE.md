# CompanyId Hydration Guide

## Overview

After Phase 1 identity hydration, the **dashboard** (or first authenticated page) needs to ensure `companyId` is available for creating objects that require it.

## Flow

1. **Welcome Page** (`/welcome`)
   - Calls `refreshWorkMe()` → stores full WorkMe in localStorage
   - WorkMe object includes `companyId` ✅
   - User clicks "Continue to Dashboard"

2. **Dashboard Page** (`/dashboard`)
   - Should check if WorkMe is hydrated
   - If not, call `refreshWorkMe()` again
   - Use `getWorkMe()` to access stored identity
   - `workMe.companyId` is now available for all object creation

## Objects That Need `companyId`

### ✅ Objects That REQUIRE `companyId`:

1. **CompanyEmployee**
   - Field: `companyId` (FK to Company.id)
   - Required when creating new employees
   - Source: `workMe.companyId`

2. **WorkMe** (when updating)
   - Field: `companyId` (FK to Company.id)
   - Source: User sets it via company affiliation flow

### ⚠️ Objects That DON'T Have `companyId` (MVP1):

These objects use `companyUnit` (string) and `createdByWorkMeId` only:
- CompanyCampaign
- CompanyImpactEvent
- CompanyTraining
- CompanyEvent
- CompanyCommunity
- CompanyCareer
- CompanyBenefits
- CompanyEmployeeCause
- CompanyEmployeeHighlight (uses `companyUnitLabel` string)

**Note**: These objects are scoped by `companyUnit` string, not `companyId`. They inherit organizational context from the creator's WorkMe.

## How Routes Get `companyId`

### Pattern 1: From Stored WorkMe (Client-Side)

```typescript
// Client component
import { getWorkMe } from '@/lib/workme.client'

const workMe = getWorkMe()
const companyId = workMe?.companyId

// Send in API request body
await api.post('/api/company/employees/create', {
  employeeData,
  companyId, // From stored WorkMe
})
```

### Pattern 2: Server Route Looks Up WorkMe

```typescript
// Server route
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Get workMeId from auth
  const { id: workMeId } = await requireWorkMeAuth(request)
  
  // Look up WorkMe to get companyId
  const workMe = await prisma.workMe.findUnique({
    where: { id: workMeId },
    select: {
      id: true,
      companyId: true,
      companyUnit: true,
    },
  })
  
  const companyId = workMe?.companyId
  
  // Use companyId for object creation
  const employee = await prisma.companyEmployee.create({
    data: {
      ...employeeData,
      companyId, // From WorkMe lookup
    },
  })
}
```

### Pattern 3: Accept from Request Body (Preferred for MVP1)

```typescript
// Client sends companyId from stored WorkMe
const workMe = getWorkMe()
await api.post('/api/company/employees/create', {
  employeeData,
  companyId: workMe.companyId, // Client provides
})

// Server route accepts it
export async function POST(request: NextRequest) {
  const { employeeData, companyId } = await request.json()
  
  // Validate companyId matches authenticated user's companyId
  const { id: workMeId } = await requireWorkMeAuth(request)
  const workMe = await prisma.workMe.findUnique({
    where: { id: workMeId },
    select: { companyId: true },
  })
  
  if (companyId !== workMe?.companyId) {
    throw new Error('Unauthorized: companyId mismatch')
  }
  
  // Create with provided companyId
  const employee = await prisma.companyEmployee.create({
    data: { ...employeeData, companyId },
  })
}
```

## Dashboard Implementation

### Update Dashboard to Ensure WorkMe is Hydrated

```typescript
// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { getWorkMe, refreshWorkMe, type WorkMe } from '@/lib/workme.client'

export default function DashboardPage() {
  const [workMe, setWorkMe] = useState<WorkMe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ensureWorkMeHydrated = async () => {
      // Check localStorage first
      let stored = getWorkMe()
      
      if (!stored) {
        // Not hydrated yet - fetch from API
        stored = await refreshWorkMe()
      }
      
      if (stored) {
        setWorkMe(stored)
        
        // Now companyId is available:
        // stored.companyId ✅
        // stored.companyUnit ✅
      }
      
      setLoading(false)
    }

    ensureWorkMeHydrated()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!workMe?.companyId) {
    // User needs to set company affiliation
    return <div>Please set your company affiliation</div>
  }

  // Dashboard content - workMe.companyId is available
  return <div>Dashboard content...</div>
}
```

## Routes That Need `companyId`

### Routes Creating CompanyEmployee:

1. `/api/company/highlights/ingest` ✅ Already updated
   - Gets `companyId` from `workMe.companyId`
   - Passes to `upsertEmployee()`

2. `/api/company/highlights/save` ✅ Already updated
   - Gets `companyId` from `workMe.companyId`
   - Passes to `upsertEmployee()`

3. `/api/highlights/create` ⚠️ Needs update
   - Currently expects `companyId` in request body
   - Should get from `workMe.companyId` or validate against it

### Routes Creating CompanyX Objects:

These DON'T need `companyId` - they use `companyUnit` string:
- `/api/context/create/[type]` - Uses `companyUnit` string
- `/api/workstuff/ingest/create-training` - Uses `companyUnitId` (needs update to use `companyUnit` string)

## Summary

**Where to hydrate `companyId`:**

1. ✅ **Welcome page** - Already hydrates full WorkMe (includes `companyId`)
2. ✅ **Dashboard page** - Should check/ensure WorkMe is hydrated
3. ✅ **Routes** - Get `companyId` from:
   - Request body (client sends from stored WorkMe)
   - OR: Lookup WorkMe by `workMeId` from auth

**Key Point**: `companyId` lives on the WorkMe object, which is now stored in localStorage after welcome page hydration. All routes can either:
- Accept it from request body (client provides from `getWorkMe()`)
- Look it up from `workMeId` (server-side lookup)

