# CompanyId Hydration Pattern

**Last Updated:** 2026-02-24  
**Status:** ✅ Active Pattern (MVP1)

## Architectural Decision: Company-Only Scoping

**Bottom Line:** You can't scope to 10 different things (units, divisions, etc.). For MVP1, we simplified to: **either it's scoped to the company, or it's not scoped at all.**

### Why Company-Only?

- **Problem**: Couldn't reconcile which routes should be unit-only vs company-only
- **Solution**: Use `companyId` for everything - simpler, clearer, consistent
- **Future State**: Company (actual) might live in the clouds - untouched
- **MVP1**: Just use `companyId` - no unit/division scoping complexity

This is why `companyUnit` is deprecated for security but kept as metadata - we don't want to build scoping logic around it.

## The Problem We Solved

We had a critical mismatch causing "Training Not Found" errors after successful ingest:

- **Training Creation**: `companyId` came from **localStorage** (set from `/api/workme/me`)
- **Training Fetch**: `companyId` came from **`loadWorkMe()`** (reads from database)
- **The Mismatch**: localStorage might be stale, or `loadWorkMe()` might return `null`/different value

Additionally, we had **`companyUnit`** fallbacks polluting localStorage and causing silent failures.

## The Solution: localStorage-First Pattern

### Core Principle

**No helpers. Just localStorage. Pass `workMeId` and `companyId` from localStorage as query params. Done.**

### Why localStorage?

1. **No Helpers**: Don't want a thousand helpers - just localStorage, done
2. **Single Source of Truth**: localStorage is populated from `/api/workme/me` which reads from DB
3. **Consistent**: Same source used during creation and fetch
4. **Simple**: Pass `workMeId` and `companyId` as query params - that's it
5. **Fast**: No extra DB queries needed

### The Pattern

#### Frontend (Client Components)

```typescript
// ✅ CORRECT: Get workMeId and companyId from localStorage - no helpers
async function loadTraining() {
  const workMeId = localStorage.getItem('workMeId')
  const companyId = localStorage.getItem('companyId')
  
  if (!workMeId) {
    console.error('workMeId not found')
    return
  }
  
  // Pass both as query params - simple, done
  const params = new URLSearchParams({ workMeId })
  if (companyId) {
    params.append('companyId', companyId)
  }
  const url = `/api/workforcestuff/training/${trainingId}?${params.toString()}`
  
  const response = await api.get(url)
  // ...
}
```

#### Backend (API Routes)

```typescript
// ✅ CORRECT: Get workMeId and companyId from query params (localStorage)
// No loadWorkMe() helper - just localStorage, done
export async function GET(request: Request, { params }) {
  // Auth: Just verify Firebase token
  await verifyAuth(request)
  
  const { trainingId } = await params
  const url = new URL(request.url)
  
  // Get from query params (localStorage) - no helpers
  const workMeId = url.searchParams.get('workMeId')
  const companyId = url.searchParams.get('companyId')
  
  if (!workMeId) {
    return NextResponse.json(
      { success: false, error: 'workMeId is required' },
      { status: 400 }
    )
  }
  
  // Query: owner (workMeId) OR same company (companyId)
  const training = await prisma.companyTraining.findFirst({
    where: {
      id: trainingId,
      OR: [
        { workMeId: workMeId }, // Owner can always access
        ...(companyId ? [{ companyId: companyId }] : []), // Same company
      ],
    },
  })
}
```

## What We Removed: companyUnit Fallbacks

### ❌ BAD: Legacy companyUnit Fallback

```typescript
// DON'T DO THIS - removed from codebase
const companyIdValue = directCompanyId || workMeCompanyId || legacyCompanyUnit
```

### ✅ GOOD: companyId Only

```typescript
// DO THIS
const companyIdValue = directCompanyId || workMeCompanyId
```

## Files Updated

### Frontend Changes

1. **`app/mycompany/workforcestuff/training/[trainingId]/page.tsx`**
   - Passes `companyId` from localStorage as query param

2. **`app/mycompany/workforcestuff/add/page.tsx`**
   - Removed `companyUnit` fallback from `resolveCompanyId()`
   - Uses `companyId` from localStorage only

3. **`lib/workme.client.ts`**
   - Removed `companyUnit` localStorage sync
   - Only syncs `companyId`

4. **`lib/providers/AuthProvider.tsx`**
   - Removed `companyUnit` localStorage operations

5. **Other pages** (events, layout, welcome, etc.)
   - Removed `companyUnit` localStorage fallbacks

### Backend Changes

1. **`app/api/workforcestuff/training/[trainingId]/route.ts`**
   - Accepts `companyId` from query params
   - Falls back to `loadWorkMe()` if not provided
   - Queries by `workMeId` (reliable) OR `companyId` (if available)

2. **`app/api/workstuff/ingest/training-save/route.ts`**
   - Explicitly preserves `companyId` and `workMeId` during updates

## How localStorage Gets Populated

localStorage `companyId` is set from `/api/workme/me`:

```typescript
// lib/workme.client.ts - refreshWorkMe()
const response = await api.get('/api/workme/me')
if (workMe.companyId) {
  localStorage.setItem('companyId', workMe.companyId)
}
```

This happens:
- On initial app load (`/dashboard`, `/welcome`)
- After company selection (`/setup/company`)
- After profile updates (`/profile`)
- When explicitly calling `refreshWorkMe()`

## Why This Works

1. **Creation Flow**:
   ```
   User → localStorage.companyId → POST /api/workstuff/ingest/create-training
   → Training saved with companyId from payload
   ```

2. **Fetch Flow**:
   ```
   User → localStorage.companyId → GET /api/workforcestuff/training/[id]?companyId=...
   → Training found by workMeId OR companyId match
   ```

3. **Both use same source**: localStorage (which syncs from DB)

## Fallback Strategy

The API route uses a smart fallback:

1. **Primary**: `companyId` from query param (localStorage) ✅ Preferred
2. **Fallback**: `companyId` from `loadWorkMe()` (DB) ✅ Backup
3. **Always**: `workMeId` query (owner access) ✅ Guaranteed

This ensures:
- If localStorage is stale → DB value used
- If both fail → Owner can still access via `workMeId`

## What About companyUnit?

### Status: Deprecated for Security, Kept for Metadata

`companyUnit` is **deprecated as a security/tenant identifier** but **kept as a string field** on WorkMe for metadata/labeling purposes.

**Why?** We couldn't reconcile which routes should be unit-only vs company-only. Rather than building complex scoping logic around units/divisions, we simplified MVP1 to: **company-scoped or nothing**. Future state might have company living in the clouds, but for now - just use `companyId`.

### Database Field (Keep ✅)

The `companyUnit` field on `WorkMe` model remains as an optional string:
- **Purpose**: Metadata/labeling only (e.g., "SEA 05", "NAVSEA HQ")
- **Usage**: Display purposes, organizational labels
- **Part of**: WorkMe identity (returned by `loadWorkMe()`)
- **NOT for**: Multi-tenant security - use `companyId` instead

```typescript
// lib/auth/loadWorkMe.ts
export interface WorkMeIdentity {
  companyId: string | null      // ✅ Authoritative organizational FK
  companyUnit: string | null    // ✅ Optional string label (metadata only)
  division: string | null       // ✅ Optional string label (metadata only)
}
```

### localStorage (Removed ❌)

All `companyUnit` localStorage operations were **removed**:
- ❌ No fallbacks: `companyId || companyUnit` 
- ❌ No syncing: `localStorage.setItem('companyUnit', ...)`
- ❌ No reading: `localStorage.getItem('companyUnit')`

**Why removed?** Using `companyUnit` as a fallback for `companyId` caused silent failures and mismatches. The DB field is fine for metadata - the problem was treating it as a security/tenant identifier.

### Summary

- ✅ **DB field**: Keep `companyUnit` as string on WorkMe (metadata)
- ✅ **API/Identity**: `loadWorkMe()` still returns `companyUnit` 
- ❌ **localStorage**: No `companyUnit` fallbacks or syncing
- ❌ **Security**: Never use `companyUnit` for multi-tenant queries

## Testing Checklist

When adding new CompanyX detail pages:

- [ ] Frontend passes `companyId` from localStorage as query param
- [ ] Backend accepts `companyId` from query params
- [ ] Backend falls back to `loadWorkMe()` if query param missing
- [ ] Backend queries by `workMeId` OR `companyId`
- [ ] No `companyUnit` localStorage fallbacks
- [ ] Works after successful ingest redirect

## Related Patterns

- **Creation**: `companyId` from localStorage → POST body → saved to DB
- **Fetch**: `companyId` from localStorage → query param → matches DB
- **Hydration**: No `companyId` needed (reads by ID only)

## Key Takeaways

1. ✅ **Use localStorage `companyId`** - it's the single source of truth
2. ✅ **Pass explicitly** - don't rely on `loadWorkMe()` for `companyId`
3. ✅ **Query by `workMeId`** - always reliable for owner access
4. ❌ **No `companyUnit` fallbacks** - removed from codebase
5. ✅ **Fallback gracefully** - DB value if localStorage missing

## Questions?

If you see "Training Not Found" or similar errors:
1. Check if `companyId` is in localStorage
2. Check if it's being passed as query param
3. Check if API route accepts and uses it
4. Verify `workMeId` query works as fallback
