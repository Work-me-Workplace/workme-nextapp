# WorkMe System Audit Report
**Date:** December 2024  
**Scope:** Authentication, Session Hydration, Model Relationships, Save Paths, Data Hydration, Company Integration

---

## EXECUTIVE SUMMARY

This audit reveals **critical architectural inconsistencies** across authentication, session management, and data model relationships. The system lacks a unified company-scoped data architecture, has authentication race conditions, and missing relational integrity at multiple layers.

**Priority Findings:**
1. ❌ **No companyId in WorkContext, WorkSupport, WorkOutput models** - All work models are user-scoped, not company-scoped
2. ❌ **No Firebase token verification on API routes** - Backend routes trust cookies/headers without validating Firebase tokens
3. ❌ **Race conditions in auth hydration** - Pages call APIs before auth is ready
4. ❌ **Multiple sources of truth** - localStorage + cookies + no centralized session state
5. ❌ **No companyId hydration** - Session only stores workMeId, not companyId

---

## 1. AUTHENTICATION (UNIVERSAL)

### 🔴 CRITICAL ISSUES

#### 1.1 Missing Firebase Token Verification
**Problem:** API routes do NOT verify Firebase ID tokens. They only check cookies/headers which can be manipulated.

**Evidence:**
- `lib/getWorkMeId.server.ts` (lines 11-50): Only checks cookies/headers, never verifies Firebase tokens
- `app/api/context/create/[type]/route.ts`: No Firebase token verification
- `app/api/output-standalone/create/route.ts`: No Firebase token verification
- All API routes trust `getWorkMeId()` which relies on cookies/headers only

**Expected Pattern (from IgniteBD):**
```typescript
// ignitebd-clientportal/lib/firebaseAdmin.js
export async function verifyFirebaseToken(request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.split('Bearer ')[1]
  const decodedToken = await admin.auth().verifyIdToken(token)
  return decodedToken
}
```

**Impact:** Unauthorized access possible, no token refresh handling, no email verification checks.

---

#### 1.2 No Auth State Listener on Client
**Problem:** Only ONE file uses `onAuthStateChanged` - the root page. No global auth state management.

**Evidence:**
- `app/page.tsx` (line 15-19): Only place `onAuthStateChanged` is used
- All other pages rely on `localStorage.getItem('workMeId')` synchronously
- No auth provider or context for global state

**Expected Pattern:**
```typescript
// Global auth provider with onAuthStateChanged
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      const token = await user.getIdToken()
      // Update session state globally
    } else {
      // Clear session, redirect to signin
    }
  })
  return () => unsubscribe()
}, [])
```

**Impact:** Race conditions where pages load before auth is ready, stale auth state, no automatic token refresh.

---

#### 1.3 Token Not Passed to API Calls
**Problem:** No Axios interceptor or fetch wrapper that automatically adds Firebase tokens to API requests.

**Evidence:**
- No `lib/api.ts` with interceptors found in workme-nextapp
- All fetch calls are plain `fetch('/api/...')` without Authorization headers
- `app/signin/SigninContent.tsx` (line 36-37): Token stored in localStorage but never used

**Expected Pattern (from IgniteBD):**
```typescript
// lib/api.js
api.interceptors.request.use(async (config) => {
  const user = getAuth().currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**Impact:** Server can't verify identity, no automatic token refresh, auth failures.

---

#### 1.4 Auth State Lost on Refresh
**Problem:** No persistence strategy. Relies on localStorage which is cleared on some browsers.

**Evidence:**
- `app/signin/SigninContent.tsx` (line 26-46): Sets localStorage + cookies manually
- No Firebase `setPersistence(browserLocalPersistence)` call
- Cookies set via `document.cookie` (fragile, not secure)

**Impact:** Users logged out on refresh, poor UX, session management inconsistency.

---

#### 1.5 Backend Routes Trust Undefined Tokens
**Problem:** `getWorkMeId.server.ts` returns `null` silently, routes don't validate auth before proceeding.

**Evidence:**
- `lib/server/context-factory.ts` (line 30): Calls `getWorkMeId()`, throws if null, but error handling inconsistent
- Routes return 500 errors instead of 401 Unauthorized when auth fails

**Impact:** Unclear error messages, security gaps, poor debugging experience.

---

## 2. SESSION HYDRATION (LOCAL + GLOBAL)

### 🔴 CRITICAL ISSUES

#### 2.1 Missing companyId in Session
**Problem:** Session only stores `workMeId`, never `companyId`.

**Evidence:**
- `app/signin/SigninContent.tsx` (line 26-46): Only sets `workMeId`, `firebaseId`, `email`
- `lib/getWorkMeId.client.ts`: Only retrieves `workMeId`
- No session object includes `companyId`

**Expected Session Object:**
```typescript
{
  workMeId: string
  companyId: string  // MISSING
  firebaseId: string
  email: string
}
```

**Impact:** Cannot filter data by company, no company-scoped queries, data leakage between companies.

---

#### 2.2 No Centralized Session Provider
**Problem:** Each page manages session independently via `useEffect` + localStorage.

**Evidence:**
- `app/mywork/page.tsx` (line 19-31): Checks localStorage, redirects if missing
- `app/mywork/outputs/page.tsx` (line 25-34): Same pattern repeated
- No React Context or Provider for session state

**Impact:** Code duplication, inconsistent behavior, no global session invalidation.

---

#### 2.3 Session Hydration Race Conditions
**Problem:** Pages call `loadData()` before session is confirmed ready.

**Evidence:**
- `app/mywork/page.tsx` (line 33-51): Calls `loadData(workMeId)` immediately after setting state
- No check that `workMeId` is valid or that Firebase auth is ready
- API calls may execute with stale/invalid tokens

**Impact:** Failed API calls, 401 errors, poor UX during page transitions.

---

#### 2.4 Multiple Sources of Truth
**Problem:** Session data stored in:
1. `localStorage` (workMeId, firebaseId, email, firebaseToken)
2. Cookies (workMeId, firebaseId)
3. No single source of truth

**Evidence:**
- `app/signin/SigninContent.tsx`: Sets both localStorage AND cookies
- `lib/getWorkMeId.server.ts`: Checks cookies first, then headers, then firebaseId lookup
- Client code uses localStorage, server uses cookies

**Impact:** Data inconsistency, sync issues, debugging nightmares.

---

#### 2.5 No Session Restoration After Refresh
**Problem:** On page refresh, session state is lost until client-side JS executes.

**Evidence:**
- No server-side session restoration (Next.js server components don't check auth)
- All pages are client components that check localStorage in `useEffect`
- Flash of unauthenticated content before redirect

**Impact:** Poor UX, potential security issues (brief exposure of protected content).

---

## 3. MODEL RELATIONSHIPS (ROOT LAYER INTEGRITY)

### 🔴 CRITICAL ISSUES

#### 3.1 Missing companyId in ALL Work Models

**Problem:** The architecture states:
```
Company → WorkContext → WorkSupport → WorkOutput
```

But **NONE** of these models have `companyId` fields.

**Evidence from `prisma/schema.prisma`:**

**WorkContext** (lines 215-228):
```prisma
model WorkContext {
  id                String      @id @default(cuid())
  createdAt         DateTime    @default(now())
  type              ContextType
  typeRefId         String
  createdByWorkMeId String      // ❌ MISSING: companyId
  // ...
}
```

**WorkSupport** (lines 386-409):
```prisma
model WorkSupport {
  id                String    @id @default(cuid())
  contextId         String
  createdByWorkMeId String    // ❌ MISSING: companyId
  // ...
}
```

**WorkOutput** (lines 414-438):
```prisma
model WorkOutput {
  id        String   @id @default(cuid())
  contextId String?
  supportId String?
  createdByWorkMeId String  // ❌ MISSING: companyId
  // ...
}
```

**WorkOutputStandalone** (lines 456-480):
```prisma
model WorkOutputStandalone {
  id             String         @id @default(cuid())
  createdByWorkMeId String      // ❌ MISSING: companyId
  // ...
}
```

**Impact:** 
- Cannot filter work by company
- Data leakage between companies
- Cannot implement company-scoped permissions
- Multi-tenant architecture broken

---

#### 3.2 Missing Foreign Keys

**Problem:** Work models don't reference Company directly.

**Expected Structure:**
```prisma
model WorkContext {
  id                String      @id @default(cuid())
  companyId         String      // ✅ REQUIRED
  company           Company     @relation(fields: [companyId], references: [id])
  createdByWorkMeId String
  // ...
}
```

**Impact:** No referential integrity, orphaned records possible.

---

#### 3.3 Typed Context Models Also Missing companyId

**Evidence:**
- `WorkContextCampaign` (line 231-247): No companyId
- `WorkContextImpactEvent` (line 249-264): No companyId
- `WorkContextTraining` (line 266-283): No companyId
- `WorkContextEvent` (line 285-301): No companyId
- `WorkContextCommunity` (line 303-319): No companyId
- `WorkContextBenefits` (line 321-341): No companyId
- `WorkContextCareer` (line 343-359): No companyId
- `WorkContextEmployeeCause` (line 361-381): No companyId

**All 8 typed context models are missing companyId.**

---

#### 3.4 Achievement Models Also Missing companyId

**Evidence:**
- `Achievement` (line 172-197): Only has `workMeId`, no companyId
- `Objective` (line 158-170): Only has `workMeId`, no companyId
- `CommsOutput` (line 143-156): Only has `workMeId`, no companyId

**Impact:** Career planning data not company-scoped, cannot filter by company.

---

#### 3.5 WorkforceComms Models Missing companyId

**Evidence:**
- `WorkforceComms` (line 445-458): No companyId, no createdByWorkMeId
- `WorkforceCommsDraft` (line 461-521): No companyId, no createdByWorkMeId
- `WorkforceCommsEdition` (line 523-539): No companyId, no createdByWorkMeId

**Impact:** Cannot associate comms with company, no ownership tracking.

---

#### 3.6 WorkMe Model Has companyId But Not Used

**Evidence:**
- `WorkMe` model (line 14-37): Has `companyId String?` and `company Company?` relation
- BUT: This is never used in queries or filtering
- Work models don't inherit companyId from WorkMe

**Impact:** Company association exists but is ignored.

---

## 4. SAVING / STATE MUTATION (CHECK EVERY ENTRY POINT)

### 🔴 CRITICAL ISSUES

#### 4.1 WorkContext Creation Missing companyId

**Evidence:**
- `lib/server/context-factory.ts` (line 26-88): `createTypedContext()` only passes `createdByWorkMeId`
- No companyId lookup or injection
- No transaction includes companyId in creation

**Expected:**
```typescript
const workMe = await prisma.workMe.findUnique({
  where: { id: workMeId },
  select: { companyId: true }
})

if (!workMe?.companyId) {
  throw new Error('User must belong to a company')
}

const typed = await tx[modelName].create({
  data: {
    ...data,
    companyId: workMe.companyId,  // ✅ REQUIRED
    createdByWorkMeId: workMeId,
  },
})
```

**Impact:** WorkContext created without company, cannot filter later.

---

#### 4.2 WorkSupport Creation Missing companyId

**Evidence:**
- `lib/actions/work-support.ts` (line 40-89): `createWorkSupport()` only passes `createdByWorkMeId`
- No companyId lookup from context or WorkMe

**Impact:** WorkSupport orphaned from company structure.

---

#### 4.3 WorkOutput Creation Missing companyId

**Evidence:**
- `lib/actions/work-output.ts` (line 16-105): `createWorkOutput()` only passes `createdByWorkMeId`
- No companyId lookup even though it has contextId/supportId

**Expected:**
```typescript
// If contextId provided, get companyId from context
const context = await prisma.workContext.findUnique({
  where: { id: contextId },
  select: { companyId: true }
})

const workOutput = await prisma.workOutput.create({
  data: {
    companyId: context.companyId,  // ✅ REQUIRED
    contextId,
    createdByWorkMeId: workMeId,
  }
})
```

**Impact:** WorkOutputs created without company association.

---

#### 4.4 WorkOutputStandalone Creation Missing companyId

**Evidence:**
- `lib/server/work-output-standalone.ts` (line 26-88): `createStandaloneOutput()` only passes `createdByWorkMeId`
- No companyId lookup from WorkMe

**Impact:** Standalone outputs not company-scoped.

---

#### 4.5 Session Not Ready Before Save

**Evidence:**
- All create functions call `getWorkMeId()` which may return null
- No wait for auth state to be ready
- Client components may call APIs before session hydrated

**Impact:** Failed saves, "not authenticated" errors, race conditions.

---

#### 4.6 Missing Default Values

**Evidence:**
- No default values for required fields in schemas
- No validation that companyId exists before creating work

**Impact:** Runtime errors, database constraint violations.

---

## 5. HYDRATION OF WORKFLOWS

### 🔴 CRITICAL ISSUES

#### 5.1 No companyId Filtering in Queries

**Evidence:**

**WorkContext Queries:**
- `lib/server/get-work-context.ts`: No companyId filter
- `lib/actions/work-context.ts`: Queries by `createdByWorkMeId` only
- No `where: { companyId }` in any WorkContext query

**WorkSupport Queries:**
- `lib/actions/work-support.ts` (line 134-195): Queries by `createdByWorkMeId` only
- No companyId filtering even when contextId is available

**WorkOutput Queries:**
- `lib/actions/work-output.ts` (line 173-252): Queries by `createdByWorkMeId` only
- No companyId filtering

**Impact:** Cannot isolate data by company, cross-company data leakage possible.

---

#### 5.2 No Joins to Company Table

**Evidence:**
- All queries use `createdByWorkMeId` but never join to WorkMe → Company
- No company-scoped queries exist

**Expected:**
```typescript
const contexts = await prisma.workContext.findMany({
  where: {
    companyId: userCompanyId  // ✅ Filter by company
  },
  include: {
    company: true  // ✅ Join company data
  }
})
```

**Impact:** Cannot get company context when loading work.

---

#### 5.3 Vulnerable Hydration Points

**All pages that load data are vulnerable:**

1. `app/mywork/page.tsx` (line 37-46): Loads WorkOutputs without companyId filter
2. `app/mywork/context/page.tsx`: Loads WorkContexts without companyId filter
3. `app/mywork/support/[contextId]/page.tsx`: Loads WorkSupport without companyId verification
4. `app/mywork/outputs/page.tsx`: Loads outputs without companyId filter

**Impact:** Data from all companies potentially exposed if auth fails.

---

## 6. INTEGRATION WITH COMPANY LAYER

### 🔴 CRITICAL ISSUES

#### 6.1 Company Model Exists But Not Integrated

**Evidence:**
- `Company` model (line 91-110): Properly defined with workMeCompanyId
- `WorkMe` model has `companyId` field
- BUT: No code uses these relationships

**Impact:** Company infrastructure exists but is unused.

---

#### 6.2 Users Not Associated with Company on Login

**Evidence:**
- `app/signin/SigninContent.tsx` (line 17-24): `createOrFindWorkMe()` doesn't set companyId
- `/api/workme/create` route likely doesn't set companyId
- No company assignment logic

**Impact:** Users may exist without companies, cannot use company features.

---

#### 6.3 No companyId in Session Hydration

**Evidence:**
- Sign-in flow never fetches user's companyId
- No API call to get WorkMe → Company relationship
- Session object doesn't include companyId

**Expected:**
```typescript
const workMe = await prisma.workMe.findUnique({
  where: { firebaseId },
  select: { id: true, companyId: true, company: true }
})

localStorage.setItem('companyId', workMe.companyId)
```

**Impact:** Company context unavailable throughout app.

---

#### 6.4 Routes Don't Validate companyId

**Evidence:**
- No middleware validates company membership
- No route checks that user belongs to requested company
- No company-scoped authorization

**Impact:** Potential unauthorized access to other companies' data.

---

#### 6.5 Hardcoded Assumptions

**Evidence:**
- Code assumes user has workMeId but not that they have companyId
- No fallback for users without companies
- No multi-company support logic

**Impact:** Single-tenant assumptions baked in, no flexibility.

---

## 7. DELIVERABLES

### 7.1 Complete List of Structural Issues

**Model Layer:**
1. ❌ WorkContext missing companyId
2. ❌ WorkSupport missing companyId
3. ❌ WorkOutput missing companyId
4. ❌ WorkOutputStandalone missing companyId
5. ❌ All 8 typed context models missing companyId
6. ❌ Achievement, Objective, CommsOutput missing companyId
7. ❌ WorkforceComms models missing companyId and createdByWorkMeId
8. ❌ No foreign key relations to Company in work models

**Auth Layer:**
9. ❌ No Firebase token verification on API routes
10. ❌ No global auth state listener/provider
11. ❌ No Axios interceptor for token injection
12. ❌ No auth persistence strategy
13. ❌ Race conditions in auth hydration

**Session Layer:**
14. ❌ Session missing companyId
15. ❌ No centralized session provider
16. ❌ Multiple sources of truth (localStorage + cookies)
17. ❌ No session restoration after refresh

**Data Layer:**
18. ❌ All create functions missing companyId injection
19. ❌ All queries missing companyId filtering
20. ❌ No company-scoped authorization

---

### 7.2 Mapping of Missing Relational Fields

| Model | Missing Field | Required Relation | Current State |
|-------|--------------|-------------------|---------------|
| WorkContext | `companyId` | `Company` | ❌ Missing |
| WorkSupport | `companyId` | `Company` | ❌ Missing |
| WorkOutput | `companyId` | `Company` | ❌ Missing |
| WorkOutputStandalone | `companyId` | `Company` | ❌ Missing |
| WorkContextCampaign | `companyId` | `Company` | ❌ Missing |
| WorkContextImpactEvent | `companyId` | `Company` | ❌ Missing |
| WorkContextTraining | `companyId` | `Company` | ❌ Missing |
| WorkContextEvent | `companyId` | `Company` | ❌ Missing |
| WorkContextCommunity | `companyId` | `Company` | ❌ Missing |
| WorkContextBenefits | `companyId` | `Company` | ❌ Missing |
| WorkContextCareer | `companyId` | `Company` | ❌ Missing |
| WorkContextEmployeeCause | `companyId` | `Company` | ❌ Missing |
| Achievement | `companyId` | `Company` | ❌ Missing |
| Objective | `companyId` | `Company` | ❌ Missing |
| CommsOutput | `companyId` | `Company` | ❌ Missing |
| WorkforceComms | `companyId`, `createdByWorkMeId` | `Company`, `WorkMe` | ❌ Missing both |
| WorkforceCommsDraft | `companyId`, `createdByWorkMeId` | `Company`, `WorkMe` | ❌ Missing both |
| WorkforceCommsEdition | `companyId`, `createdByWorkMeId` | `Company`, `WorkMe` | ❌ Missing both |

---

### 7.3 Corrected Architectural Tree

```
Company (root tenant)
  ├── WorkMe (employees)
  │   └── companyId → Company.id
  │
  ├── WorkContext (work containers)
  │   ├── companyId → Company.id ✅ REQUIRED
  │   ├── createdByWorkMeId → WorkMe.id
  │   └── typeRefId → WorkContextCampaign|ImpactEvent|Training|etc.id
  │
  ├── WorkContextCampaign|ImpactEvent|Training|Event|Community|Benefits|Career|EmployeeCause
  │   ├── companyId → Company.id ✅ REQUIRED
  │   └── createdByWorkMeId → WorkMe.id
  │
  ├── WorkSupport (support containers)
  │   ├── companyId → Company.id ✅ REQUIRED
  │   ├── contextId → WorkContext.id
  │   └── createdByWorkMeId → WorkMe.id
  │
  ├── WorkOutput (context/support outputs)
  │   ├── companyId → Company.id ✅ REQUIRED
  │   ├── contextId → WorkContext.id?
  │   ├── supportId → WorkSupport.id?
  │   └── createdByWorkMeId → WorkMe.id
  │
  ├── WorkOutputStandalone (standalone outputs)
  │   ├── companyId → Company.id ✅ REQUIRED
  │   └── createdByWorkMeId → WorkMe.id
  │
  ├── Achievement (career data)
  │   ├── companyId → Company.id ✅ REQUIRED
  │   └── workMeId → WorkMe.id
  │
  ├── Objective (career data)
  │   ├── companyId → Company.id ✅ REQUIRED
  │   └── workMeId → WorkMe.id
  │
  └── CommsOutput (career data)
      ├── companyId → Company.id ✅ REQUIRED
      └── workMeId → WorkMe.id
```

**Key Principles:**
1. **Every work model MUST have companyId** - No exceptions
2. **Company is root tenant** - All data filtered by company
3. **createdByWorkMeId for audit** - companyId for scoping
4. **Foreign keys enforced** - Referential integrity at DB level

---

### 7.4 Rewritten Session Object Shape

```typescript
interface Session {
  // Identity
  workMeId: string
  firebaseId: string
  email: string
  
  // Company Context ✅ REQUIRED
  companyId: string
  companyName?: string
  
  // Auth
  firebaseToken: string
  tokenExpiry?: number
  
  // Metadata
  hydratedAt: number
  lastActive: number
}
```

**Hydration Flow:**
```typescript
// 1. Firebase auth ready
onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    clearSession()
    redirect('/signin')
    return
  }
  
  // 2. Get fresh token
  const token = await firebaseUser.getIdToken()
  
  // 3. Hydrate WorkMe + Company
  const response = await api.get('/api/workme/hydrate', {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  const { workMe, company } = response.data
  
  // 4. Set session
  setSession({
    workMeId: workMe.id,
    firebaseId: firebaseUser.uid,
    email: firebaseUser.email,
    companyId: workMe.companyId,  // ✅ REQUIRED
    companyName: company?.name,
    firebaseToken: token,
    hydratedAt: Date.now()
  })
  
  // 5. Store in localStorage + cookies
  persistSession()
})
```

---

### 7.5 Recommended Auth/Hydration Architecture

**Based on IgniteBD Best Practices:**

#### Phase 1: Global Auth Provider

```typescript
// lib/providers/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, onIdTokenChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import api from '@/lib/api'

interface AuthState {
  user: any | null
  workMe: any | null
  company: any | null
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthState>({
  user: null,
  workMe: null,
  company: null,
  loading: true,
  error: null
})

export function AuthProvider({ children }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    workMe: null,
    company: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ user: null, workMe: null, company: null, loading: false, error: null })
        return
      }

      try {
        // Get fresh token
        const token = await firebaseUser.getIdToken()
        
        // Hydrate WorkMe + Company
        const response = await api.get('/api/workme/hydrate', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        setState({
          user: firebaseUser,
          workMe: response.data.workMe,
          company: response.data.company,
          loading: false,
          error: null
        })
        
        // Persist to localStorage
        persistSession(response.data)
      } catch (error) {
        setState({ user: firebaseUser, workMe: null, company: null, loading: false, error: error.message })
      }
    })

    // Listen for token refresh
    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken()
        // Update token in localStorage/api client
        updateToken(token)
      }
    })

    return () => {
      unsubscribeAuth()
      unsubscribeToken()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
```

#### Phase 2: API Client with Token Interceptor

```typescript
// lib/api.ts
import axios from 'axios'
import { getAuth } from 'firebase/auth'

const api = axios.create({
  baseURL: '',
})

api.interceptors.request.use(
  async (config) => {
    const auth = getAuth()
    const user = auth.currentUser
    
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

export default api
```

#### Phase 3: Server-Side Token Verification

```typescript
// lib/server/verifyAuth.ts
import { getAuthInstance } from '@/lib/firebaseAdmin'
import { headers } from 'next/headers'

export async function verifyAuth() {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No token provided')
  }
  
  const token = authHeader.split('Bearer ')[1]
  const decodedToken = await getAuthInstance().verifyIdToken(token)
  
  // Get WorkMe + Company
  const workMe = await prisma.workMe.findUnique({
    where: { firebaseId: decodedToken.uid },
    include: { company: true }
  })
  
  if (!workMe) {
    throw new Error('Unauthorized: WorkMe not found')
  }
  
  if (!workMe.companyId) {
    throw new Error('Unauthorized: User not assigned to company')
  }
  
  return {
    workMeId: workMe.id,
    companyId: workMe.companyId,
    company: workMe.company,
    firebaseId: decodedToken.uid
  }
}
```

---

### 7.6 Prioritized Fix List

#### 🔴 PRIORITY 1: CRITICAL - Fix Immediately

1. **Add companyId to ALL work models** (Prisma schema migration)
   - WorkContext, WorkSupport, WorkOutput, WorkOutputStandalone
   - All 8 typed context models
   - Achievement, Objective, CommsOutput
   - WorkforceComms models
   - **Time Estimate:** 2-3 hours
   - **Risk:** High - Requires data migration

2. **Implement Firebase token verification on all API routes**
   - Create `lib/server/verifyAuth.ts`
   - Update all API routes to use `verifyAuth()`
   - **Time Estimate:** 3-4 hours
   - **Risk:** Medium - Breaking change, requires testing

3. **Add companyId injection to all create functions**
   - Update `context-factory.ts`
   - Update `work-support.ts`
   - Update `work-output.ts`
   - Update `work-output-standalone.ts`
   - **Time Estimate:** 2-3 hours
   - **Risk:** Medium - Data integrity critical

4. **Implement global Auth Provider**
   - Create `AuthProvider` with `onAuthStateChanged`
   - Wrap app in provider
   - **Time Estimate:** 2-3 hours
   - **Risk:** Low - Additive change

5. **Create API client with token interceptor**
   - Create `lib/api.ts` with Axios interceptors
   - Replace all `fetch()` calls with `api.get/post/etc`
   - **Time Estimate:** 2-3 hours
   - **Risk:** Medium - Requires refactoring

---

#### 🟡 PRIORITY 2: HIGH - Fix This Week

6. **Add companyId to session object**
   - Update sign-in flow to fetch companyId
   - Update session persistence
   - **Time Estimate:** 1-2 hours
   - **Risk:** Low

7. **Add companyId filtering to all queries**
   - Update all `findMany` queries to filter by companyId
   - Update all `findFirst` queries to verify companyId
   - **Time Estimate:** 3-4 hours
   - **Risk:** Medium - Query changes

8. **Fix session hydration race conditions**
   - Use Auth Provider instead of localStorage checks
   - Add loading states
   - **Time Estimate:** 2-3 hours
   - **Risk:** Low

---

#### 🟢 PRIORITY 3: MEDIUM - Fix Next Sprint

9. **Centralize session management**
   - Remove localStorage duplication
   - Single source of truth
   - **Time Estimate:** 2-3 hours
   - **Risk:** Low

10. **Add company-scoped authorization middleware**
    - Validate company membership on routes
    - **Time Estimate:** 2-3 hours
    - **Risk:** Medium

11. **Fix WorkforceComms models**
    - Add companyId and createdByWorkMeId
    - **Time Estimate:** 1-2 hours
    - **Risk:** Low

---

## CONCLUSION

The WorkMe application has **fundamental architectural gaps** that prevent it from functioning as a multi-tenant, company-scoped system. The most critical issues are:

1. **No companyId in work models** - Breaks entire data architecture
2. **No Firebase token verification** - Security vulnerability
3. **No proper auth state management** - Race conditions and poor UX
4. **No company-scoped queries** - Data leakage risk

**Recommended Next Steps:**
1. Halt feature development until Priority 1 items are fixed
2. Create a migration plan for adding companyId to existing data
3. Implement auth provider and token verification first (foundation)
4. Then migrate models and queries (data layer)

**Estimated Total Fix Time:** 20-30 hours of focused development

---

**Report Generated:** December 2024  
**Auditor:** System Analysis  
**Status:** ⚠️ CRITICAL ISSUES IDENTIFIED

