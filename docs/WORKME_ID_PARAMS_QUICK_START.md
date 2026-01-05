# WorkMe ID & Params - Quick Start Guide

**For Developers**: Quick reference for the canonical workMeId pattern

---

## ✅ What to Use

### 1. Identity (localStorage)
```typescript
// ✅ ALWAYS use this for identity
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
const workMeId = getWorkMeIdFromStorage()

// ✅ ONLY store these in localStorage:
localStorage.setItem('workMeId', workMeId)
localStorage.setItem('firebaseId', firebaseId)
localStorage.setItem('email', email)
```

### 2. Company Context (API + URL Params)
```typescript
// ✅ Get companyId from WorkMe API
const workMeResponse = await api.get('/api/workme/me')
const companyId = workMeResponse.data.workMe.companyId

// ✅ Use URL params for company-scoped pages
const searchParams = useSearchParams()
const companyId = searchParams.get('companyId') || workMe.companyId

// ✅ All company API calls require companyId
const response = await api.get(`/api/company/products?companyId=${companyId}`)
```

### 3. Individual Data (uses workMeId)
```typescript
// ✅ Individual data uses workMeId (from auth token)
const response = await api.get('/api/workops/outlook')
// Server extracts workMeId from Firebase token
```

---

## ❌ What NOT to Do

### Don't Store in localStorage:
```typescript
// ❌ DON'T store full workMe object
localStorage.setItem('workme', JSON.stringify(workMe))

// ❌ DON'T store companyId separately
localStorage.setItem('companyId', companyId)

// ❌ DON'T store company data
localStorage.setItem('companyProducts', JSON.stringify(products))
localStorage.setItem('dashboard', JSON.stringify(dashboard))
```

### Don't Use localStorage for Company Context:
```typescript
// ❌ DON'T get companyId from localStorage
const companyId = localStorage.getItem('companyId')

// ❌ DON'T use localStorage for company-scoped API calls
const products = JSON.parse(localStorage.getItem('products'))
```

---

## 🔧 Critical Fixes Needed

### 1. API Routes Missing companyId Filter

**File:** `app/api/company/products/platform/list/route.ts`

**Current (BUG):**
```typescript
// ❌ Returns ALL products, not scoped to company
const products = await prisma.companyPlatformProduct.findMany({
  select: { ... },
  orderBy: { name: 'asc' },
})
```

**Fix:**
```typescript
// ✅ Add companyId filter
const { searchParams } = new URL(request.url)
const companyId = searchParams.get('companyId') || workMe.companyId

if (!companyId) {
  return NextResponse.json(
    { success: false, error: 'companyId is required' },
    { status: 400 }
  )
}

const products = await prisma.companyPlatformProduct.findMany({
  where: { companyId },  // ✅ Filter by companyId
  select: { ... },
  orderBy: { name: 'asc' },
})
```

**Apply to:**
- `app/api/company/products/platform/list/route.ts`
- `app/api/company/products/capacity/list/route.ts`
- `app/api/company/products/innovation/list/route.ts`

### 2. Pages Not Passing companyId

**File:** `app/company/products/page.tsx`

**Current (BUG):**
```typescript
// ❌ API calls without companyId
api.get('/api/company/products/platform/list')
```

**Fix:**
```typescript
// ✅ Get companyId and pass to API
useEffect(() => {
  const loadCompanyId = async () => {
    const workMeId = getWorkMeIdFromStorage()
    if (!workMeId) return
    
    const workMeRes = await api.get('/api/workme/me')
    const companyId = workMeRes.data.workMe.companyId
    
    if (companyId) {
      // Update URL with companyId
      router.replace(`/company/products?companyId=${companyId}`)
      setCompanyId(companyId)
    }
  }
  loadCompanyId()
}, [])

// ✅ API calls with companyId
const response = await api.get(`/api/company/products/platform/list?companyId=${companyId}`)
```

---

## 📋 Migration Checklist

### Immediate (Critical Bugs)
- [ ] Fix `/api/company/products/platform/list` - add companyId filter
- [ ] Fix `/api/company/products/capacity/list` - add companyId filter
- [ ] Fix `/api/company/products/innovation/list` - add companyId filter
- [ ] Update `/company/products` page to pass companyId

### Phase 1 (API Routes)
- [ ] Add companyId filter to all company-scoped API routes
- [ ] Add companyId validation (return 400 if missing)
- [ ] Update API route documentation

### Phase 2 (Client Pages)
- [ ] Update company-scoped pages to use URL params
- [ ] Add fallback logic (get companyId from WorkMe API)
- [ ] Remove localStorage usage for company data

### Phase 3 (Cleanup)
- [ ] Remove full `workme` object from localStorage
- [ ] Remove `companyId` from localStorage
- [ ] Update all components using localStorage

---

## 🎯 Pattern Reference

### IgniteBd Pattern (Reference)
```typescript
// Identity
const ownerId = localStorage.getItem('ownerId')

// Company Context
const companyHQId = searchParams.get('companyHQId')

// API Call
await api.get(`/api/products?companyHQId=${companyHQId}`)
```

### WorkMe Pattern (Target)
```typescript
// Identity
const workMeId = getWorkMeIdFromStorage()

// Company Context
const companyId = searchParams.get('companyId') || workMe.companyId

// API Call
await api.get(`/api/company/products?companyId=${companyId}`)
```

---

## 🔍 Debugging

### Check localStorage
```typescript
// ✅ Should see
console.log(localStorage.getItem('workMeId'))
console.log(localStorage.getItem('firebaseId'))
console.log(localStorage.getItem('email'))

// ❌ Should NOT see
console.log(localStorage.getItem('workme'))  // Full object
console.log(localStorage.getItem('companyId'))
console.log(localStorage.getItem('products'))
```

### Check API Calls
```typescript
// ✅ Should see companyId in URL
/api/company/products?companyId=xxx

// ❌ Should NOT see
/api/company/products  // Missing companyId
```

### Check Console
```typescript
// ✅ Add logging
console.log('🏢 Company context:', { companyId, source: 'URL params' })
console.log('📞 API call:', `/api/company/products?companyId=${companyId}`)
```

---

## 📚 Related Documentation

- `docs/WORKME_ID_PARAMS_PATTERN.md` - Full migration guide
- `docs/COMPANYHQ_URL_PARAMS.md` - IgniteBd reference (in IgniteBd repo)

---

## 🚨 Security Note

**All company-scoped API routes MUST filter by companyId to prevent cross-tenant data leaks.**

```typescript
// ✅ SECURE - Filters by companyId
where: { companyId }

// ❌ INSECURE - Returns all data
findMany()  // No filter!
```

