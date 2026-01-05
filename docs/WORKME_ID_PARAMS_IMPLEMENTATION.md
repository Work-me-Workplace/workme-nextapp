# WorkMe ID & Params Implementation Status

**Date**: January 2025  
**Status**: 🟡 Partial Implementation  
**Pattern**: workMeId (localStorage) + companyId (URL params + API)

---

## ✅ Completed Changes

### 1. API Routes Fixed

#### `/api/company/products/platform/list`
- ✅ Added authentication (`verifyAuth`)
- ✅ Added `companyId` query param support
- ✅ Validates companyId matches user's companyId (security)
- ✅ Console logging for debugging
- ⚠️ **TODO**: Schema needs `companyId` field to filter products

#### `/api/company/products/capacity/list`
- ✅ Added authentication (`verifyAuth`)
- ✅ Added `companyId` query param support
- ✅ Validates companyId matches user's companyId (security)
- ✅ Console logging for debugging
- ⚠️ **TODO**: Schema needs `companyId` field to filter products

#### `/api/company/products/innovation/list`
- ✅ Added authentication (`verifyAuth`)
- ✅ Added `companyId` query param support
- ✅ Validates companyId matches user's companyId (security)
- ✅ Console logging for debugging
- ⚠️ **TODO**: Schema needs `companyId` field to filter products

### 2. Client Pages Updated

#### `/company/products` Page
- ✅ Uses URL params for `companyId` (`?companyId=xxx`)
- ✅ Falls back to WorkMe API if companyId not in URL
- ✅ Redirects to same page with companyId in URL
- ✅ All API calls include `companyId` query param
- ✅ All navigation links preserve `companyId` in URL
- ✅ Wrapped in Suspense for `useSearchParams`
- ✅ Console logging for debugging

---

## ⚠️ Critical Schema Issue

**Problem**: Product models don't have `companyId` field in schema!

**Models Affected:**
- `CompanyPlatformProduct` - no `companyId` field
- `CompanyProductCapacity` - no `companyId` field
- `CompanyProductInnovation` - no `companyId` field

**Current State:**
- API routes validate `companyId` for security
- But cannot filter products by `companyId` yet
- Returns all products (not company-scoped)

**Required Fix:**
```prisma
model CompanyPlatformProduct {
  // ... existing fields ...
  companyId String?  // Add this field
  
  company Company? @relation(fields: [companyId], references: [id])
  
  @@index([companyId])
}

// Same for CompanyProductCapacity and CompanyProductInnovation
```

**After Schema Update:**
```typescript
// API routes can then filter:
where: { companyId }  // ✅ Filter by companyId
```

---

## 📋 Remaining Tasks

### Phase 1: Schema Migration (REQUIRED)
- [ ] Add `companyId` field to `CompanyPlatformProduct` model
- [ ] Add `companyId` field to `CompanyProductCapacity` model
- [ ] Add `companyId` field to `CompanyProductInnovation` model
- [ ] Create Prisma migration
- [ ] Update API routes to filter by `companyId` (remove TODO comments)

### Phase 2: Additional API Routes
- [ ] Update `/api/company/products/platform/[id]` to require companyId
- [ ] Update `/api/company/products/capacity/[id]` to require companyId
- [ ] Update `/api/company/products/innovation/[id]` to require companyId
- [ ] Update all CREATE/PUT routes to set companyId

### Phase 3: Other Company-Scoped Pages
- [ ] Update `/mycompany/workforcestuff` page
- [ ] Update `/mycompany/products` page
- [ ] Update `/mycompany/highlights` page
- [ ] Update other company-scoped pages to use URL params

### Phase 4: localStorage Cleanup
- [ ] Remove full `workme` object from localStorage (keep only workMeId)
- [ ] Remove `companyId` from localStorage (get from API/URL params)
- [ ] Remove `companyUnit` from localStorage (get from API/URL params)
- [ ] Remove cached company data (products, highlights, etc.)
- [ ] Update all components using localStorage

---

## 🔍 Testing Checklist

### API Routes
- [ ] Test `/api/company/products/platform/list?companyId=xxx` returns only that company's products
- [ ] Test API returns 400 if companyId missing
- [ ] Test API returns 403 if companyId doesn't match user's companyId
- [ ] Test API requires authentication

### Client Pages
- [ ] Test `/company/products` loads with companyId from URL
- [ ] Test fallback to WorkMe API if companyId missing from URL
- [ ] Test navigation links preserve companyId in URL
- [ ] Test console logs show correct companyId

### Security
- [ ] Test user cannot access other company's products
- [ ] Test companyId validation works correctly
- [ ] Test authentication required on all routes

---

## 📚 Implementation Pattern

### API Route Pattern
```typescript
export async function GET(request: Request) {
  // 1. Auth
  const { firebaseId } = await verifyAuth(request)
  
  // 2. Load WorkMe
  const workMe = await loadWorkMe(firebaseId)
  
  // 3. Get companyId from URL or WorkMe
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId') || workMe.companyId
  
  // 4. Validate
  if (!companyId) {
    return NextResponse.json(
      { success: false, error: 'companyId is required' },
      { status: 400 }
    )
  }
  
  if (companyId !== workMe.companyId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 403 }
    )
  }
  
  // 5. Query with companyId filter
  const products = await prisma.companyPlatformProduct.findMany({
    where: { companyId },  // ✅ Filter by companyId
    // ...
  })
  
  return NextResponse.json({ success: true, products })
}
```

### Client Page Pattern
```typescript
function ProductsPageContent() {
  const searchParams = useSearchParams()
  const [companyId, setCompanyId] = useState<string | null>(null)
  
  useEffect(() => {
    // Get from URL params
    const urlCompanyId = searchParams?.get('companyId')
    
    if (urlCompanyId) {
      setCompanyId(urlCompanyId)
    } else {
      // Fallback: Get from WorkMe API
      const workMeId = getWorkMeIdFromStorage()
      api.get('/api/workme/me')
        .then(res => {
          const companyId = res.data.workMe.companyId
          if (companyId) {
            router.replace(`/company/products?companyId=${companyId}`)
          }
        })
    }
  }, [searchParams])
  
  // API calls with companyId
  useEffect(() => {
    if (companyId) {
      api.get(`/api/company/products?companyId=${companyId}`)
    }
  }, [companyId])
}
```

---

## 🎯 Next Steps

1. **Immediate**: Add `companyId` fields to product models in schema
2. **High Priority**: Update API routes to filter by `companyId` after schema migration
3. **Medium Priority**: Update other company-scoped pages to use URL params
4. **Low Priority**: Clean up localStorage usage

---

## 📝 Notes

- Pattern follows IgniteBd's `companyHQId` approach
- Security: All company data requires companyId validation
- URL params make company context explicit and debuggable
- Console logging added for easier debugging

