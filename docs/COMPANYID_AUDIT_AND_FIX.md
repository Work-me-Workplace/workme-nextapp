# CompanyId Audit & Standardization Fix

## Problem

There's inconsistency throughout the codebase:
- Some APIs use `companyId` from URL query params
- Some APIs use `companyId` from authenticated user's WorkMe
- This causes mismatches and security issues

## Standard: Use Authenticated User's CompanyId

**Pattern:**
```
firebaseId (from verifyAuth) 
  → loadWorkMe(firebaseId) 
  → workMe.companyId
```

**Why:**
- Firebase ID token is secure and verified
- WorkMe.companyId is the source of truth
- No need for URL params (security risk)
- Consistent across all APIs

## Files That Need Fixing

### API Routes Using URL Params (FIXED ✅)

1. **`app/api/utils/news-artifact/list/route.ts`** ✅ FIXED - Now uses authenticated user's companyId
2. **`app/api/workforcestuff/route.ts`** ✅ FIXED - Now uses authenticated user's companyId
3. **`app/api/workstuff/training/route.ts`** ✅ FIXED - Now uses authenticated user's companyId
4. **`app/api/workstuff/career/route.ts`** ✅ FIXED - Now uses authenticated user's companyId
5. **`app/api/workstuff/events/route.ts`** ✅ FIXED - Now uses authenticated user's companyId
6. **`app/api/workstuff/cause/route.ts`** ✅ FIXED - Now uses authenticated user's companyId
7. **`app/api/workstuff/route.ts`** ✅ FIXED - Now uses authenticated user's companyId

### API Routes Using URL Params with Fallback (Need Review)

These have fallback but should standardize:
1. **`app/api/company/products/platform/list/route.ts`** - Has validation ✅
2. **`app/api/company/products/capacity/list/route.ts`** - Has validation ✅
3. **`app/api/company/products/innovation/list/route.ts`** - Has validation ✅
4. **`app/api/company/products/sharepoint/list/route.ts`** - Has validation ✅
5. **`app/api/company/products/sharepoint/create/route.ts`** - Has validation ✅
6. **`app/api/company/products/sharepoint/[id]/route.ts`** - Has validation ✅

### Client Pages Using URL Params (May Need Fix)

1. **`app/mycompany/articles/page.tsx`** - Reads URL but doesn't use it
2. **`app/mycompany/workforcestuff/page.tsx`** - Uses URL params
3. **`app/mycompany/layout.tsx`** - Uses URL params
4. **`components/mywork/SidebarNav.tsx`** - Uses URL params

## Fix Strategy

### Phase 1: Critical API Routes (No Validation) ✅ COMPLETE
Fixed routes that used URL params WITHOUT validation:
- ✅ `app/api/utils/news-artifact/list/route.ts`
- ✅ `app/api/workforcestuff/route.ts`
- ✅ `app/api/workstuff/route.ts`
- ✅ `app/api/workstuff/training/route.ts`
- ✅ `app/api/workstuff/career/route.ts`
- ✅ `app/api/workstuff/events/route.ts`
- ✅ `app/api/workstuff/cause/route.ts`

### Phase 2: API Routes with Fallback (TODO)
Remove URL param support, use only authenticated user's companyId:
- ⚠️ All `/api/company/products/*/list/route.ts` (have validation but should standardize)
- ⚠️ All `/api/company/products/sharepoint/*/route.ts` (have validation but should standardize)

### Phase 3: Client Pages (TODO)
Remove URL param reading, rely on authenticated API calls:
- ⚠️ `app/mycompany/articles/page.tsx` - Reads URL but doesn't use it
- ⚠️ `app/mycompany/workforcestuff/page.tsx` - Uses URL params
- ⚠️ `app/mycompany/layout.tsx` - Uses URL params
- ⚠️ `components/mywork/SidebarNav.tsx` - Uses URL params

## Standard Pattern

### Before (Inconsistent):
```typescript
// ❌ BAD: Uses URL param
const companyId = searchParams.get('companyId')

// ⚠️ OK: Has fallback but still uses URL
const companyId = searchParams.get('companyId') || workMe.companyId
if (companyId !== workMe.companyId) {
  return 403
}
```

### After (Standard):
```typescript
// ✅ GOOD: Always use authenticated user's companyId
const { firebaseId } = await verifyAuth(request)
const workMe = await loadWorkMe(firebaseId)
const { companyId } = workMe

if (!companyId) {
  return NextResponse.json(
    { success: false, error: 'Company ID not set on your account' },
    { status: 400 }
  )
}

// Use companyId directly - no URL params needed
const where = { companyId }
```

## Security Note

URL params are:
- ❌ Visible in browser history
- ❌ Can be manipulated
- ❌ Not secure

Authenticated user's companyId is:
- ✅ Verified via Firebase token
- ✅ From database (source of truth)
- ✅ Secure
