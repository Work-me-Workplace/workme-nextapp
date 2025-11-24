# Work.me Auth Architecture - Single Source of Truth

## 🎯 **OVERVIEW**

This is the **ONLY** auth documentation for the Work.me Next.js application. All other auth docs should reference this.

**Key Principle**: Firebase authentication tokens are automatically injected into all API requests via a global axios interceptor. Server actions don't receive tokens automatically, so use API routes for authenticated operations.

---

## 🔐 **AUTHENTICATION SYSTEM**

### Schema
```prisma
model WorkMe {
  id        String   @id @default(uuid())
  firebaseId String  @unique
  email     String   @unique
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id])
  // ... other fields
}
```

### Frontend Pages
- **`/signin`** - User login
- **`/signup`** - New user creation
- **`/setup`** - Company setup (first-time users)

---

## 📋 **AUTHENTICATION FLOW**

### Signin Flow
```
1. User enters email/password on /signin
2. Firebase sign-in creates/verifies Firebase user
3. AuthProvider hydrates WorkMe + Company data
4. Token stored in Firebase SDK (automatic)
5. Token automatically added to all API requests via axios interceptor
```

### Token Management
- **Firebase SDK**: Handles token generation, refresh, and storage
- **Axios Interceptor**: Automatically adds `Authorization: Bearer <token>` to all `/api/*` requests
- **No localStorage tokens**: Tokens stay in Firebase SDK memory

---

## 🚀 **API REQUEST PATTERN (USE THIS)**

### Global Axios Client (`lib/api.ts`)

**✅ USE THIS FOR ALL API CALLS**

```typescript
import api from '@/lib/api'

// Automatically includes Firebase token via interceptor
const response = await api.post('/api/some/route', { data })
```

### How It Works

1. **Client Component** calls `api.post('/api/...', data)`
2. **Axios Interceptor** automatically:
   - Gets Firebase user via `getAuth()`
   - Calls `user.getIdToken()`
   - Adds `Authorization: Bearer <token>` header
3. **API Route** receives request with token in headers
4. **API Route** calls `verifyAuth(request)` to verify token

### Example: API Route

```typescript
// app/api/ingest/event/save/route.ts
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'

export async function POST(request: Request) {
  // Verify Firebase token from Authorization header
  const { workMeId, companyId } = await verifyAuth(request)
  
  // Your logic here...
  return NextResponse.json({ success: true, data })
}
```

### Example: Client Component

```typescript
// components/MyComponent.tsx
'use client'
import api from '@/lib/api'

async function handleSave() {
  const response = await api.post('/api/ingest/event/save', {
    // your data
  })
  
  if (response.data.success) {
    // handle success
  }
}
```

---

## ⚠️ **SERVER ACTIONS (LIMITED USE)**

### When to Use Server Actions

**✅ Use server actions for:**
- Simple database operations that don't need auth
- Operations that already have workMeId/companyId passed explicitly
- Read-only operations using `getWorkMeId()` helper

**❌ DON'T use server actions for:**
- Operations requiring `verifyAuth()` (use API routes instead)
- Operations that need Firebase token verification

### The Problem

Server actions are called directly from client components and **don't receive HTTP headers**. The axios interceptor doesn't apply to server actions because they bypass HTTP requests.

```typescript
// ❌ DON'T DO THIS - won't get token
'use server'
export async function createEvent(data: EventData) {
  const { workMeId, companyId } = await verifyAuth() // ❌ Missing token!
  // ...
}

// ✅ DO THIS INSTEAD - use API route
// app/api/events/create/route.ts
export async function POST(request: Request) {
  const { workMeId, companyId } = await verifyAuth(request) // ✅ Gets token from headers
  // ...
}
```

### Server Action Workaround (Use `getWorkMeId()`)

If you MUST use a server action, use `getWorkMeId()` which tries cookies/headers:

```typescript
'use server'
import { getWorkMeId } from '@/lib/getWorkMeId.server'

export async function someServerAction() {
  const workMeId = await getWorkMeId() // Tries cookies/headers, but may fail
  
  if (!workMeId) {
    return { success: false, error: 'Not authenticated' }
  }
  
  // Continue with logic...
}
```

**But prefer API routes for authenticated operations!**

---

## 📚 **AUTHENTICATION UTILITIES**

### `lib/server/verifyAuth.ts`

**For API routes only**

```typescript
import { verifyAuth } from '@/lib/server/verifyAuth'

export async function POST(request: Request) {
  // Verifies Firebase token from Authorization header
  const { workMeId, companyId, email, firebaseId } = await verifyAuth(request)
  
  // Throws error if token missing/invalid
  // Returns authenticated user context
}
```

**Features:**
- ✅ Extracts token from `Authorization: Bearer <token>` header
- ✅ Verifies token with Firebase Admin SDK
- ✅ Fetches WorkMe + Company from database
- ✅ Enforces company membership requirement
- ✅ Returns full authenticated context

### `lib/getWorkMeId.server.ts`

**For server actions (fallback only)**

```typescript
import { getWorkMeId } from '@/lib/getWorkMeId.server'

export async function someServerAction() {
  // Tries to get workMeId from cookies/headers
  // May return null if not found
  const workMeId = await getWorkMeId()
}
```

**Features:**
- ⚠️ Tries cookies first (`workMeId` cookie)
- ⚠️ Tries headers second (`x-workme-id` header)
- ⚠️ Tries Firebase ID from cookies/headers
- ⚠️ May return `null` - less reliable than `verifyAuth()`

---

## 🎯 **DECISION TREE**

```
Need authenticated operation?
│
├─ Yes, needs full verification (companyId, etc.)
│  └─ ✅ Use API Route + verifyAuth(request)
│     → Client: api.post('/api/...')
│     → Server: verifyAuth(request)
│
├─ Yes, but simple operation
│  └─ ⚠️ Can use Server Action + getWorkMeId()
│     → Less reliable, may return null
│
└─ No auth needed
   └─ ✅ Use Server Action directly
      → No auth checks needed
```

---

## ✅ **BEST PRACTICES**

### 1. Always Use API Routes for Authenticated Operations

```typescript
// ✅ GOOD - API route with automatic token
'use client'
import api from '@/lib/api'

const response = await api.post('/api/events/create', eventData)
```

```typescript
// ❌ BAD - Server action without token
'use client'
import { createEvent } from '@/lib/actions/events'

await createEvent(eventData) // ❌ No token passed!
```

### 2. Use Axios Interceptor (Already Set Up)

The `lib/api.ts` file automatically adds tokens. **Never use `fetch()` directly** for authenticated requests.

```typescript
// ✅ GOOD - Uses axios interceptor
import api from '@/lib/api'
await api.post('/api/...', data)

// ❌ BAD - Manual fetch without token
await fetch('/api/...', {
  method: 'POST',
  body: JSON.stringify(data)
}) // Missing Authorization header!
```

### 3. Always Verify Auth in API Routes

```typescript
// ✅ GOOD - Verifies token
export async function POST(request: Request) {
  const { workMeId, companyId } = await verifyAuth(request)
  // ...
}

// ❌ BAD - No auth verification
export async function POST(request: Request) {
  // Directly accesses database without auth!
}
```

### 4. Handle Auth Errors Gracefully

```typescript
try {
  const response = await api.post('/api/...', data)
  // Success
} catch (error: any) {
  if (error.response?.status === 401) {
    // Redirect to signin
    router.push('/signin')
  }
}
```

---

## 🔧 **MIGRATION GUIDE**

### Converting Server Actions to API Routes

**Before (Server Action - Broken):**
```typescript
// lib/actions/event-ingestion.ts
"use server"
export async function createWorkEventFromIngest(data: EventData) {
  const { workMeId, companyId } = await verifyAuth() // ❌ No token!
  // ...
}

// components/EventReview.tsx
import { createWorkEventFromIngest } from '@/lib/actions/event-ingestion'
await createWorkEventFromIngest(data) // ❌ Missing token
```

**After (API Route - Working):**
```typescript
// app/api/ingest/event/save/route.ts
export async function POST(request: Request) {
  const { workMeId, companyId } = await verifyAuth(request) // ✅ Gets token from headers
  // ...
}

// components/EventReview.tsx
import api from '@/lib/api'
const response = await api.post('/api/ingest/event/save', data) // ✅ Token added automatically
```

---

## 📝 **FILE STRUCTURE**

```
lib/
├── api.ts                    # ✅ Global axios client with token interceptor
├── server/
│   ├── verifyAuth.ts         # ✅ Verify token in API routes
│   └── getWorkMeId.server.ts # ⚠️ Fallback for server actions
└── actions/                  # ⚠️ Server actions (limited use)

app/api/                      # ✅ Use for authenticated operations
├── ingest/
│   ├── event/
│   │   ├── ai/route.ts       # ✅ Uses verifyAuth(request)
│   │   └── save/route.ts     # ✅ Uses verifyAuth(request)
│   └── promotional/
│       └── ai/route.ts       # ✅ Uses verifyAuth(request)
```

---

## 🚫 **COMMON MISTAKES**

### ❌ Mistake 1: Using Server Actions for Auth

```typescript
// ❌ DON'T DO THIS
"use server"
export async function saveEvent(data: EventData) {
  await verifyAuth() // ❌ Won't get token!
}
```

**Fix**: Use API route instead.

### ❌ Mistake 2: Using fetch() Instead of api Client

```typescript
// ❌ DON'T DO THIS
await fetch('/api/events/create', {
  method: 'POST',
  body: JSON.stringify(data)
}) // ❌ Missing Authorization header!
```

**Fix**: Use `api.post()` instead.

### ❌ Mistake 3: Not Verifying Auth in API Routes

```typescript
// ❌ DON'T DO THIS
export async function POST(request: Request) {
  // Directly accesses database without auth!
  await prisma.workEvent.create({ data })
}
```

**Fix**: Always call `verifyAuth(request)` first.

---

## 🔍 **TROUBLESHOOTING**

### Error: "Unauthorized: Missing token"

**Cause**: Server action called without token, or API route not using axios client.

**Fix**: 
1. If using server action → Convert to API route
2. If using API route → Ensure client uses `api` from `@/lib/api`

### Error: "User must belong to a company"

**Cause**: WorkMe record exists but `companyId` is null.

**Fix**: User needs to complete company setup via `/setup`.

### Token Not Being Added

**Check:**
1. Is the component a client component? (`'use client'`)
2. Is it using `api` from `@/lib/api`?
3. Is Firebase auth initialized?
4. Is user signed in?

---

## 📚 **REFERENCES**

- **Firebase Auth**: https://firebase.google.com/docs/auth
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Next.js Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

---

**Last Updated**: 2025-01-XX  
**Status**: ✅ Single source of truth for Work.me authentication

---

## 🎯 **QUICK REFERENCE**

| Operation Type | Use | Pattern |
|---------------|-----|---------|
| Authenticated CRUD | API Route | `api.post('/api/...')` + `verifyAuth(request)` |
| Simple read (no auth) | Server Action | Direct function call |
| Complex authenticated op | API Route | `api.post('/api/...')` + `verifyAuth(request)` |
| Client-side only | Client Component | Direct logic, no server call |

**Golden Rule**: If it needs `verifyAuth()`, use an API route with the axios client.

