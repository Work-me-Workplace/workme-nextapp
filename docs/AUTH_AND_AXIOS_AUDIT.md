# Firebase Auth + Global Axios Audit

**Date**: 2025-02-25  
**Context**: User experiencing unexpected logouts on the Daily Tasks area (`/workops/daily`)

---

## Root Cause: How Did This Happen?

**Multiple agents + no single plan.** Pages were built at different times, each copying whatever auth pattern the previous page used. No one enforced a single architecture:

- `getIdToken` got a 5s wait when someone hit "Missing token" — band-aid instead of fixing the race
- API interceptor got a 1500ms retry — another band-aid
- Pages used `getAuth().onAuthStateChanged` without `authReady` — copy-paste from an early example
- `getWorkMeIdFromStorage()` was used because AuthProvider hadn't finished hydrating — workaround for the race
- Each fix added a new layer instead of fixing the root cause

**The fix**: One gate (AuthProvider doesn't render children until auth is ready), one source of truth (`useAuth()`), no band-aids.

---

## Executive Summary

**Root cause of daily page logouts**: The daily page subscribes to Firebase `onAuthStateChanged` **without waiting for `authReady`** (persistence), and redirects to signin when `workMeId` is missing from localStorage—even though AuthProvider may not have hydrated yet. This creates two race conditions that cause false logouts.

---

## 1. Firebase Auth Architecture

### 1.1 Initialization (`lib/firebase.ts`)

```
lib/firebaseClient.ts  →  firebaseClientApp (single Firebase app)
lib/firebase.ts        →  auth = getAuth(firebaseClientApp)
                       →  authReady = setPersistence(auth, browserLocalPersistence)
```

- **`auth`**: Single auth instance from `getAuth(firebaseClientApp)`
- **`authReady`**: Promise that resolves when `browserLocalPersistence` is set. **Critical**: Firebase may fire `onAuthStateChanged(null)` before persistence restores the user from IndexedDB. Subscribing before `authReady` can cause spurious null callbacks.

### 1.2 AuthProvider (`lib/providers/AuthProvider.tsx`)

**Correct pattern**:
- Waits for `authReady` before subscribing to `onAuthStateChanged`
- Uses `hadUserRef` to distinguish real sign-out from initial null (avoids clearing session on load)
- Hydrates session via `GET /api/workme/hydrate` when user exists
- Writes `workMeId`, `firebaseId`, `email`, `firebaseToken` to localStorage after hydration
- On 401/403 from hydrate: clears session and localStorage

**Flow**:
1. `authReady.then()` → wait for persistence
2. `onAuthStateChanged` → when user exists, call `hydrateSession`
3. `hydrateSession` → `api.get('/api/workme/hydrate')` → on success, write to localStorage

---

## 2. Global Axios (`lib/api.ts`)

### 2.1 Request Interceptor

- Uses `getIdToken()` from `lib/firebase/getIdToken.ts`
- `getIdToken` waits up to 5s for `auth.currentUser` (handles slow persistence restore)
- If no token for `/api/*` after retry: rejects with `AUTH_NOT_READY` (err.isAuthNotReady = true)
- Attaches `Authorization: Bearer <token>` to all `/api/*` requests

### 2.2 Response Interceptor

- Logs 401/403 but **does not** auto sign-out (AuthProvider handles that)
- Rejects the promise so callers can handle

### 2.3 getIdToken (`lib/firebase/getIdToken.ts`)

- Uses shared `auth` from `@/lib/firebase`
- If `currentUser` is null: waits for `onAuthStateChanged` (up to 5s)
- Returns null if still no user after wait

---

## 3. The Daily Page Bug (Root Cause)

**File**: `app/workops/daily/page.tsx`

### 3.1 Current Implementation (BROKEN)

```tsx
useEffect(() => {
  const auth = getAuth()
  const unsubscribe = auth.onAuthStateChanged((user) => {
    if (user) {
      setAuthReady(true)
      const id = getWorkMeIdFromStorage()
      if (id) {
        setWorkMeId(id)
        loadOutlook(id)
      } else {
        router.push('/signin')   // ❌ BUG: Redirects even when user is authenticated!
      }
    } else {
      router.push('/signin')     // ❌ BUG: May fire before persistence restores user!
    }
  })
  return () => unsubscribe()
}, [router])
```

### 3.2 Two Race Conditions

| Race | What happens | Result |
|------|--------------|--------|
| **Persistence race** | Daily subscribes immediately. Firebase fires `onAuthStateChanged(null)` before persistence restores user from IndexedDB. | Redirect to signin |
| **Hydration race** | User exists, but AuthProvider hasn't finished `hydrateSession` yet. `workMeId` not in localStorage. | Redirect to signin |

### 3.3 Why Daily Is Especially Affected

- Daily page makes **many** API calls on load: outlook, daily-assignments, unassigned, etc.
- Each call goes through the axios interceptor
- If token isn't ready (persistence delay), interceptor rejects with `AUTH_NOT_READY`
- Page has retry logic for `AUTH_NOT_READY`, but the **auth state listener** redirects before retries can help
- The `onAuthStateChanged(null)` or missing `workMeId` triggers redirect immediately

---

## 4. Inconsistent Auth Usage Across Codebase

Many pages use `getAuth()` directly instead of the shared `auth` + `authReady`:

| Pattern | Files | Issue |
|---------|-------|-------|
| `getAuth()` + `onAuthStateChanged` without `authReady` | daily, workforcestuff, workops/overall, platforms, signal, etc. | Persistence race |
| `getAuth().currentUser` | TopNav, profile | May be null before persistence |
| `auth` + `authReady` from `@/lib/firebase` | AuthProvider only | Correct |

**Note**: `getAuth()` without args returns auth for the default app. Since there's only one app, it's the same instance—but the **timing** (authReady) is what matters.

---

## 5. AuthProvider Hydration → 401 Chain

If `/api/workme/hydrate` returns 401 (expired token, invalid token, etc.):

1. AuthProvider's `hydrateSession` catches the error
2. Retries once with `getIdToken(true)` (force refresh)
3. If retry fails: clears session, clears localStorage, `hadUserRef = false`
4. User appears logged out

**Causes of 401 on hydrate**:
- Token expired and refresh failed
- Token invalid/corrupted
- Server clock skew
- Firebase Admin SDK config mismatch

---

## 6. Recommendations

### 6.1 Fix Daily Page (High Priority)

**Option A – Use AuthProvider (preferred)**  
Switch to `useAuth()` and wait for `session.workMeId` instead of localStorage:

```tsx
const { session, loading } = useAuth()

useEffect(() => {
  if (loading) return
  if (!session.workMeId) {
    router.push('/signin')
    return
  }
  setWorkMeId(session.workMeId)
  loadOutlook(session.workMeId)
}, [session.workMeId, loading, router])
```

**Option B – Wait for authReady**  
If keeping local auth logic, wait for `authReady` before subscribing:

```tsx
import { auth, authReady } from '@/lib/firebase'

useEffect(() => {
  authReady.then((readyAuth) => {
    if (!readyAuth) return
    const unsub = readyAuth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/signin')
        return
      }
      setAuthReady(true)
      // Don't redirect if workMeId missing - wait for AuthProvider or fetch it
      const id = getWorkMeIdFromStorage()
      if (id) {
        setWorkMeId(id)
        loadOutlook(id)
      } else {
        // Give AuthProvider time to hydrate, or call /api/workme/me
        loadOutlookFromApi()
      }
    })
    return () => unsub()
  })
}, [router])
```

### 6.2 Standardize Auth Across Pages

- Prefer `useAuth()` from AuthProvider for session data
- If a page needs its own listener: use `auth` + `authReady` from `@/lib/firebase`
- Avoid `getAuth()` + immediate `onAuthStateChanged` without waiting for `authReady`

### 6.3 Document authReady Requirement

Add to AUTH-ARCHITECTURE.md:  
"Pages that subscribe to `onAuthStateChanged` must wait for `authReady` from `@/lib/firebase` before subscribing, or use `useAuth()` which already does this."

---

## 7. File Reference

| File | Role |
|------|------|
| `lib/firebase.ts` | auth, authReady, signIn/signOut |
| `lib/firebase/getIdToken.ts` | Token for API interceptor |
| `lib/firebaseClient.ts` | Firebase app init |
| `lib/api.ts` | Axios + request/response interceptors |
| `lib/providers/AuthProvider.tsx` | Session, hydration, localStorage mirror |
| `lib/server/verifyAuth.ts` | Server-side token verification |
| `app/api/workme/hydrate/route.ts` | Hydration endpoint |
| `app/workops/daily/page.tsx` | **Buggy** – persistence + hydration races |

---

## 8. Fixes Applied (2025-02-25)

1. **AuthProvider gates the app** — Children don't render until `loading` is false. Single auth gate. No component can make API calls before auth is ready.
2. **getIdToken simplified** — Removed 5s wait. Just `auth.currentUser?.getIdToken()`. The gate ensures we're ready.
3. **API interceptor** — Removed 1500ms retry. One `getIdToken()` call.
4. **Daily page** — Uses `useAuth()` only. Removed `getAuth`, `onAuthStateChanged`, `getWorkMeIdFromStorage`, `isAuthNotReady` retries.

**Other pages** (workforcestuff, workops/overall, platforms, signal, etc.) still use the old pattern. Migrate them to `useAuth()` when touched.
