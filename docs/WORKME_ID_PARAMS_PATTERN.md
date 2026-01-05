# WorkMe ID & Params Pattern - Migration Guide

**Date**: January 2025  
**Status**: 📋 Recommendations  
**Purpose**: Establish canonical pattern for workMeId localStorage and API calls for company products

---

## 🎯 Core Principle

**workMeId is the ONLY canonical localStorage item.** Everything else should come from API calls using workMeId or companyId from WorkMe profile.

---

## 📊 Current State Analysis

### ✅ What's Working Well

1. **Individual Data (uses workMeId):**
   - ✅ `workOpsOutlook` - uses workMeId from localStorage
   - ✅ Career outlook - uses workMeId via auth
   - ✅ `/api/workops/outlook` - scoped by workMeId
   - ✅ `/api/mywork/products/list` - scoped by `createdByWorkMeId`

2. **Identity Storage:**
   - ✅ `workMeId` stored in localStorage (canonical)
   - ✅ `firebaseId`, `email` stored for auth purposes

### ❌ Issues Found

1. **Company Products API Missing companyId Filter:**
   - ❌ `/api/company/products/platform/list` - NO companyId filtering (BUG!)
   - ❌ Returns ALL platform products, not scoped to user's company
   - ❌ Should require `?companyId=xxx` query param

2. **Too Much localStorage:**
   - ❌ Full `workme` object with `companyProducts[]` array
   - ❌ `companyId` duplicated in localStorage
   - ❌ `companyUnit` in localStorage (should come from workMe.companyUnit)
   - ❌ `dashboard` with company data
   - ❌ Cached company data (highlights, events, etc.)

3. **Missing URL Params Pattern:**
   - ❌ Company-scoped pages don't use URL params like IgniteBd's `?companyHQId=xxx`
   - ❌ Hard to debug which company context is active
   - ❌ No shareable URLs with company context

---

## 🏗️ Recommended Pattern (From IgniteBd)

### 1. Identity (localStorage)

**ONLY store in localStorage:**
```typescript
localStorage.setItem('workMeId', workMeId)  // ✅ Canonical identity
localStorage.setItem('firebaseId', firebaseId)  // ✅ Auth token reference
localStorage.setItem('email', email)  // ✅ Convenience
```

**DO NOT store:**
- ❌ Full workMe object
- ❌ companyId (get from API)
- ❌ companyUnit (get from API)
- ❌ companyProducts (fetch via API)
- ❌ dashboard data (fetch via API)

### 2. Company Context (URL Params)

**Company-scoped pages should use URL params:**

```typescript
// ✅ GOOD: URL params for company context
const searchParams = useSearchParams()
const companyId = searchParams?.get('companyId')

// ❌ BAD: localStorage for company context
const companyId = localStorage.getItem('companyId')
```

**Benefits:**
- 🔍 Explicit context visible in URL
- 🔗 Shareable links
- 🐛 Easy debugging
- ⏮️ Browser history works correctly

### 3. API Calls Pattern

#### Individual Data (uses workMeId)
```typescript
// ✅ Get workMeId from localStorage
const workMeId = getWorkMeIdFromStorage()

// ✅ API call with workMeId
const response = await api.get(`/api/workops/outlook`)
// Server extracts workMeId from auth token
```

#### Company Data (uses companyId from WorkMe)
```typescript
// ✅ Get workMeId from localStorage
const workMeId = getWorkMeIdFromStorage()

// ✅ Get companyId from WorkMe API (or URL params)
const workMe = await api.get('/api/workme/me')
const companyId = workMe.data.workMe.companyId

// ✅ API call with companyId query param
const response = await api.get(`/api/company/products?companyId=${companyId}`)
```

---

## 🔧 Required Changes

### 1. Fix Company Products API Routes

**Problem:** `/api/company/products/platform/list` returns ALL products

**Fix:**
```typescript
// app/api/company/products/platform/list/route.ts
export async function GET(request: Request) {
  const { firebaseId } = await verifyAuth(request)
  const workMe = await loadWorkMe(firebaseId)
  
  // ✅ Get companyId from URL params or WorkMe
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId') || workMe.companyId
  
  if (!companyId) {
    return NextResponse.json(
      { success: false, error: 'companyId is required' },
      { status: 400 }
    )
  }
  
  // ✅ Filter by companyId
  const products = await prisma.companyPlatformProduct.findMany({
    where: { companyId },  // ✅ Add this filter
    select: { ... },
    orderBy: { name: 'asc' },
  })
  
  return NextResponse.json({ success: true, products })
}
```

**Apply to:**
- `/api/company/products/platform/list`
- `/api/company/products/capacity/list`
- `/api/company/products/innovation/list`
- All other company-scoped endpoints

### 2. Update Company Product Pages to Use URL Params

**Pattern from IgniteBd:**

```typescript
// app/company/products/page.tsx
export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [companyId, setCompanyId] = useState<string | null>(null)
  
  // Get companyId from URL params
  useEffect(() => {
    const urlCompanyId = searchParams?.get('companyId')
    
    if (urlCompanyId) {
      setCompanyId(urlCompanyId)
    } else {
      // Fallback: Get from WorkMe API
      const workMeId = getWorkMeIdFromStorage()
      if (workMeId) {
        api.get('/api/workme/me')
          .then(res => {
            const companyId = res.data.workMe?.companyId
            if (companyId) {
              // Redirect to same page with companyId in URL
              router.replace(`/company/products?companyId=${companyId}`)
            }
          })
      }
    }
  }, [searchParams, router])
  
  // API call with companyId
  async function loadProducts() {
    if (!companyId) return
    
    const response = await api.get(`/api/company/products/platform/list?companyId=${companyId}`)
    setProducts(response.data.products)
  }
  
  // ...
}
```

### 3. Clean Up localStorage Usage

**Remove from localStorage:**
- `workme` object (full WorkMe)
- `companyId` (get from API)
- `companyUnit` (get from API)
- `dashboard` (fetch on demand)
- Cached company data

**Keep in localStorage:**
- `workMeId` (canonical identity)
- `firebaseId` (auth)
- `email` (convenience)

### 4. Update WorkMe API Response

**Current:** Returns full WorkMe with nested arrays (`companyProducts[]`)

**Recommended:** Return minimal WorkMe, fetch company data separately:
```typescript
// /api/workme/me - Return minimal identity
{
  id: string
  email: string
  companyId: string | null
  companyUnit: string | null
  // ... other identity fields
  // ❌ Don't include: companyProducts, externalCompanyPressures
}
```

**Fetch company data separately:**
```typescript
// Client-side
const workMe = await api.get('/api/workme/me')
const companyId = workMe.data.workMe.companyId

if (companyId) {
  const products = await api.get(`/api/company/products?companyId=${companyId}`)
}
```

---

## 📝 Migration Checklist

### Phase 1: Fix API Routes
- [ ] Add `companyId` filter to `/api/company/products/platform/list`
- [ ] Add `companyId` filter to `/api/company/products/capacity/list`
- [ ] Add `companyId` filter to `/api/company/products/innovation/list`
- [ ] Update all company-scoped API routes to require `companyId`

### Phase 2: Update Client Pages
- [ ] Update `/company/products` to use URL params
- [ ] Update company-scoped pages to pass `companyId` in URL
- [ ] Add fallback logic (get companyId from WorkMe API if missing from URL)

### Phase 3: Clean Up localStorage
- [ ] Remove full `workme` object from localStorage
- [ ] Remove `companyId` from localStorage
- [ ] Remove `companyUnit` from localStorage (or keep only as convenience, not source of truth)
- [ ] Update code to get companyId from API calls

### Phase 4: Documentation
- [ ] Update API route documentation
- [ ] Create pattern guide for new developers
- [ ] Document URL param conventions

---

## 🔍 Pattern Comparison

### IgniteBd Pattern (Reference)
```typescript
// Identity
const ownerId = localStorage.getItem('ownerId')  // ✅ Canonical

// Company Context
const companyHQId = searchParams.get('companyHQId')  // ✅ URL params

// API Call
await api.get(`/api/products?companyHQId=${companyHQId}`)
```

### WorkMe Pattern (Target)
```typescript
// Identity
const workMeId = localStorage.getItem('workMeId')  // ✅ Canonical

// Company Context
const companyId = searchParams.get('companyId') || workMe.companyId  // ✅ URL params + fallback

// API Call
await api.get(`/api/company/products?companyId=${companyId}`)
```

### Individual Data (Both)
```typescript
// Both use identity from localStorage
const workMeId = localStorage.getItem('workMeId')
await api.get(`/api/workops/outlook`)  // Server uses workMeId from auth
```

---

## 🚀 Benefits

1. **Clearer Architecture:**
   - workMeId = identity (localStorage)
   - companyId = context (URL params + API)

2. **Better Debugging:**
   - See company context in URL
   - Console logs show explicit companyId

3. **Shareable Links:**
   - URLs include company context
   - Bookmark-able pages

4. **Reduced localStorage:**
   - Less state to manage
   - Less sync issues
   - Simpler code

5. **API Consistency:**
   - All company APIs require companyId
   - Clear security boundaries
   - Multi-tenant safe

---

## 📚 Related Docs

- `docs/COMPANYHQ_URL_PARAMS.md` (IgniteBd reference)
- `docs/TWO_PHASE_HYDRATION.md` (Current hydration pattern - needs update)
- `docs/ARCHITECTURE_LAYERS.md` (Architecture overview - needs update)

---

## 🎯 Summary

**Key Changes:**
1. ✅ Keep `workMeId` in localStorage (canonical identity)
2. ✅ Remove company data from localStorage
3. ✅ Use URL params for company context (`?companyId=xxx`)
4. ✅ All company API calls require `companyId` query param
5. ✅ Individual data uses workMeId (already correct)

**Pattern:**
- Identity = localStorage (`workMeId`)
- Context = URL params (`companyId`)
- Data = API calls (with explicit params)

