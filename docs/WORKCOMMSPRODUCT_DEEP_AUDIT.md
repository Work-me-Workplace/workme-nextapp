# WorkCommsProduct + CompanyWorkLink Deep Architecture Audit

**Date:** 2025-01-28  
**Status:** READ-ONLY ANALYSIS  
**Scope:** Modern product engine ONLY (WorkCommsProduct + CompanyWorkLink)  
**Excluded:** WorkforceComms, NTK, OutputStandalone, legacy systems

---

## 🎯 EXECUTIVE SUMMARY

The **modern product engine** is built on two core models:

1. **`WorkCommsProduct`** - Unified product wrapper for all work communication products
2. **`CompanyWorkLink`** - Junction table linking CompanyX models to WorkCommsProduct

**Key Finding:** The product system is **fully implemented** but **underutilized**. Only ONE server action file (`lib/actions/work-output.ts`) handles all product creation, and only ONE UI page (`app/mywork/products/builder/[outputId]/page.tsx`) uses it.

**Architecture Status:** ✅ Complete and functional, but minimal usage

---

## 📊 PRODUCT CREATION FLOW

### Complete Flow: CompanyX → CompanyWorkLink → WorkCommsProduct

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ {                                                      │  │
│  │   companyEventId: "event-123",                        │  │
│  │   type: "poster",                                      │  │
│  │   data: { title: "Event Poster", design: "..." },    │  │
│  │   metadata: { ... }                                    │  │
│  │ }                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              lib/actions/work-output.ts                     │
│              createWorkOutput()                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Verify Auth (verifyAuth → loadWorkMe)             │  │
│  │ 2. Validate Input (Zod schema)                       │  │
│  │ 3. Map legacy types (if needed)                      │  │
│  │ 4. Require at least one CompanyX ID                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PRISMA: Create WorkCommsProduct                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ prisma.workCommsProduct.create({                     │  │
│  │   type: WorkCommsProductType,                        │  │
│  │   data: Json?,                                        │  │
│  │   metadata: Json?,                                    │  │
│  │   companyUnit: String,                               │  │
│  │   companyDivision: String?,                           │  │
│  │   createdByWorkMeId: String                           │  │
│  │ })                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PRISMA: Create CompanyWorkLink(s)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ For each CompanyX ID provided:                       │  │
│  │ prisma.companyWorkLink.create({                      │  │
│  │   [companyXIdField]: String,                         │  │
│  │   workCommsProductId: product.id,                    │  │
│  │   companyUnit: String,                                │  │
│  │   companyDivision: String?                            │  │
│  │ })                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    RETURN VALUE                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ {                                                      │  │
│  │   success: true,                                       │  │
│  │   workOutput: { /* legacy format */ },               │  │
│  │   product: WorkCommsProduct,                         │  │
│  │   links: CompanyWorkLink[]                            │  │
│  │ }                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Input Fields

**Zod Schema (`workProductSchema`):**
```typescript
{
  // CompanyX linking (at least one required)
  companyEventId?: string | null
  companyCampaignId?: string | null
  companyTrainingId?: string | null
  companyBenefitsId?: string | null
  companyImpactEventId?: string | null
  companyCommunityId?: string | null
  companyCareerId?: string | null
  companyEmployeeCauseId?: string | null
  
  // Product data
  type: WorkCommsProductType  // Required enum
  data?: any | null
  metadata?: any | null
  
  // Legacy support
  legacyOutputType?: string | null
}
```

### Transformations

1. **Type Mapping:** Legacy `outputType` values mapped to `WorkCommsProductType` enum
2. **CompanyX ID Extraction:** All CompanyX IDs collected into object
3. **Validation:** At least one CompanyX ID must be provided
4. **Identity Resolution:** `verifyAuth()` → `loadWorkMe()` → `workMeId`, `companyUnit`, `companyDivision`

### DB Writes

1. **WorkCommsProduct.create()** - Single write
2. **CompanyWorkLink.create()** - One write per provided CompanyX ID (can be multiple)

### Returned Objects

**Legacy Format (for backward compatibility):**
```typescript
{
  id: product.id,
  outputType: validated.legacyOutputType || productType,
  dataJson: product.data,
  status: 'draft',
  createdAt: product.createdAt,
  updatedAt: product.createdAt,
  links: CompanyWorkLink[]
}
```

**New Format:**
```typescript
{
  product: WorkCommsProduct,
  links: CompanyWorkLink[]
}
```

---

## 🗄️ WORKCOMMSPRODUCT DATA CONTRACT

### Prisma Schema

```prisma
model WorkCommsProduct {
  id                String               @id @default(uuid())
  type              WorkCommsProductType  // REQUIRED enum
  data              Json?                 // Optional JSON
  metadata          Json?                 // Optional JSON
  createdAt         DateTime              @default(now())
  
  companyUnit       String?               // Optional (but validated in code)
  companyDivision   String?               // Optional
  createdByWorkMeId String                // REQUIRED (FK to WorkMe)
  createdBy         WorkMe                @relation(...)
  
  links              CompanyWorkLink[]    // Reverse relation
  
  @@index([companyUnit])
  @@index([createdByWorkMeId])
  @@index([type])
}
```

### WorkCommsProductType Enum

```prisma
enum WorkCommsProductType {
  email           // Email product
  poster          // Print poster
  ntk             // Need to Know
  digital_sign    // Digital signage
  exec_email      // Executive email
  flyer           // Print flyer
  sharepoint      // SharePoint update
  photo_video     // Photo/video content
  talking_points  // Talking points document
}
```

### Required Fields (at creation)

| Field | Required | Source | Notes |
|-------|----------|--------|-------|
| `type` | ✅ Yes | Input | Must be valid `WorkCommsProductType` enum |
| `createdByWorkMeId` | ✅ Yes | `loadWorkMe().id` | From authenticated user |
| `companyUnit` | ✅ Yes (validated) | `loadWorkMe().companyUnit` | Validated in code, but nullable in schema |
| `data` | ❌ No | Input | Optional JSON |
| `metadata` | ❌ No | Input | Optional JSON |
| `companyDivision` | ❌ No | `loadWorkMe().companyDivision` | Optional |

### Field Usage in Code

**Creation (`createWorkOutput`):**
```typescript
prisma.workCommsProduct.create({
  data: {
    type: productType,                    // ✅ From input
    data: validated.data ?? undefined,    // ✅ From input (optional)
    metadata: validated.metadata ?? undefined, // ✅ From input (optional)
    companyUnit: companyUnit,             // ✅ From loadWorkMe()
    companyDivision: companyDivision,     // ✅ From loadWorkMe() (optional)
    createdByWorkMeId: workMeId,         // ✅ From loadWorkMe()
  },
})
```

**Update (`updateWorkOutput`):**
```typescript
prisma.workCommsProduct.update({
  where: { id },
  data: {
    data: updateData.data,                // ✅ Can update
    metadata: updateData.metadata,        // ✅ Can update
    // type, companyUnit, createdByWorkMeId are NOT updatable
  },
})
```

---

## 🔗 COMPANYWORKLINK DATA CONTRACT

### Prisma Schema

```prisma
model CompanyWorkLink {
  id String @id @default(uuid())
  
  // One of these CompanyX IDs (at least one must be set)
  companyEventId String?
  companyEvent   CompanyEvent? @relation(...)
  
  companyTrainingId String?
  companyTraining   CompanyTraining? @relation(...)
  
  companyBenefitsId String?
  companyBenefits   CompanyBenefits? @relation(...)
  
  companyCampaignId String?
  companyCampaign   CompanyCampaign? @relation(...)
  
  companyImpactEventId String?
  companyImpactEvent   CompanyImpactEvent? @relation(...)
  
  companyCommunityId String?
  companyCommunity   CompanyCommunity? @relation(...)
  
  companyCareerId String?
  companyCareer   CompanyCareer? @relation(...)
  
  companyEmployeeCauseId String?
  companyEmployeeCause   CompanyEmployeeCause? @relation(...)
  
  // Always required
  workCommsProductId String
  workCommsProduct   WorkCommsProduct @relation(...)
  
  companyUnit     String?
  companyDivision String?
  
  createdAt DateTime @default(now())
  
  @@index([companyEventId])
  @@index([companyTrainingId])
  @@index([companyBenefitsId])
  @@index([companyCampaignId])
  @@index([companyImpactEventId])
  @@index([companyCommunityId])
  @@index([companyCareerId])
  @@index([companyEmployeeCauseId])
  @@index([workCommsProductId])
  @@index([companyUnit])
}
```

### Required Fields (at creation)

| Field | Required | Source | Notes |
|-------|----------|--------|-------|
| `workCommsProductId` | ✅ Yes | `product.id` | FK to WorkCommsProduct |
| At least one CompanyX ID | ✅ Yes | Input | One of: `companyEventId`, `companyCampaignId`, etc. |
| `companyUnit` | ✅ Yes (validated) | `loadWorkMe().companyUnit` | Validated in code, but nullable in schema |
| `companyDivision` | ❌ No | `loadWorkMe().companyDivision` | Optional |

### Field Usage in Code

**Creation (`createWorkOutput`):**
```typescript
for (const [key, value] of Object.entries(companyXIds)) {
  if (value) {
    prisma.companyWorkLink.create({
      data: {
        [key]: value,                      // ✅ Dynamic: companyEventId, companyCampaignId, etc.
        workCommsProductId: product.id,    // ✅ From created product
        companyUnit: companyUnit,          // ✅ From loadWorkMe()
        companyDivision: companyDivision,  // ✅ From loadWorkMe() (optional)
      },
    })
  }
}
```

**Note:** Multiple `CompanyWorkLink` records can be created for a single `WorkCommsProduct` if multiple CompanyX IDs are provided.

---

## 📍 ALL CREATION POINTS

### 1. Server Action: `createWorkOutput()`

**File:** `lib/actions/work-output.ts:58`

**Function Signature:**
```typescript
export async function createWorkOutput(data: z.infer<typeof workProductSchema>)
```

**What It Creates:**
1. One `WorkCommsProduct` record
2. One or more `CompanyWorkLink` records (one per provided CompanyX ID)

**Called From:**
- ❌ **NO API ROUTES** - No API routes call this function
- ❌ **NO UI PAGES** - No UI pages call this function directly
- ⚠️ **POTENTIALLY UNUSED** - Function exists but may not be called anywhere

**Validation:**
- ✅ Requires authentication (`verifyAuth()`)
- ✅ Requires `companyUnit` on user
- ✅ Requires at least one CompanyX ID
- ✅ Requires valid `type` enum

---

## 📖 ALL READ/LOAD POINTS

### 1. Server Action: `getWorkOutputs()`

**File:** `lib/actions/work-output.ts:246`

**Function Signature:**
```typescript
export async function getWorkOutputs(workMeId?: string)
```

**What It Returns:**
- All `WorkCommsProduct` records for user's `companyUnit`
- Includes `links` with all CompanyX relations

**Query:**
```typescript
prisma.workCommsProduct.findMany({
  where: { companyUnit },
  include: {
    links: {
      include: {
        companyEvent: true,
        companyCampaign: true,
        companyTraining: true,
        companyBenefits: true,
        companyImpactEvent: true,
        companyCommunity: true,
        companyCareer: true,
        companyEmployeeCause: true,
      },
    },
  },
})
```

**Called From:**
- ❌ **NO API ROUTES** - No API routes call this function
- ❌ **NO UI PAGES** - No UI pages call this function directly
- ⚠️ **POTENTIALLY UNUSED** - Function exists but may not be called anywhere

### 2. Server Action: `getWorkOutput(id)`

**File:** `lib/actions/work-output.ts:330`

**Function Signature:**
```typescript
export async function getWorkOutput(id: string)
```

**What It Returns:**
- Single `WorkCommsProduct` by ID
- Includes `links` with all CompanyX relations
- Scoped to user's `companyUnit`

**Query:**
```typescript
prisma.workCommsProduct.findFirst({
  where: { id, companyUnit },
  include: {
    links: {
      include: {
        // All CompanyX relations
      },
    },
  },
})
```

**Called From:**
- ✅ **UI PAGE:** `app/mywork/products/builder/[outputId]/page.tsx:34`

**Usage:**
```typescript
const result = await getWorkOutput(outputId)
if (result.success && result.workOutput) {
  setOutput(result.workOutput)
}
```

### 3. Server Action: `getWorkOutputsByRouter(companyXId, companyXType)`

**File:** `lib/actions/work-output.ts:387`

**Function Signature:**
```typescript
export async function getWorkOutputsByRouter(
  companyXId: string,
  companyXType: 'event' | 'campaign' | 'training' | 'benefits' | 'impact_event' | 'community' | 'career' | 'employee_cause'
)
```

**What It Returns:**
- All `WorkCommsProduct` records linked to a specific CompanyX model
- Queries via `CompanyWorkLink` junction table

**Query:**
```typescript
prisma.companyWorkLink.findMany({
  where: {
    [companyXIdField]: companyXId,
    companyUnit,
  },
  include: {
    workCommsProduct: {
      include: {
        links: true,
      },
    },
  },
})
```

**Called From:**
- ❌ **NO API ROUTES** - No API routes call this function
- ❌ **NO UI PAGES** - No UI pages call this function directly
- ⚠️ **POTENTIALLY UNUSED** - Function exists but may not be called anywhere

**Legacy Alias:**
- `getWorkOutputsByContext` = `getWorkOutputsByRouter` (for backward compatibility)

---

## 🚨 MISSING FIELDS / INCONSISTENCIES

### Issue #1: Schema vs Code Validation Mismatch

**Problem:**
- `companyUnit` is `String?` (nullable) in Prisma schema
- But code validates `if (!companyUnit) return error` (required)

**Location:**
- `lib/actions/work-output.ts:65`
- `lib/actions/work-output.ts:156`
- `lib/actions/work-output.ts:217`
- `lib/actions/work-output.ts:284`
- `lib/actions/work-output.ts:336`
- `lib/actions/work-output.ts:393`

**Impact:** Low - Code enforces requirement, but schema allows null (inconsistent)

**Recommendation:** Make `companyUnit` required in schema: `companyUnit String` (remove `?`)

### Issue #2: No API Routes for Product Creation

**Problem:**
- `createWorkOutput()` exists but no API routes call it
- Products can only be created via server actions (client-side only)

**Impact:** Medium - Limits integration options (no REST API)

**Recommendation:** Create API routes:
- `POST /api/products` - Create product
- `GET /api/products` - List products
- `GET /api/products/[id]` - Get product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Issue #3: No UI Pages for Product Creation

**Problem:**
- Only ONE UI page uses products: `app/mywork/products/builder/[outputId]/page.tsx`
- This page only **edits** existing products (calls `getWorkOutput` and `updateWorkOutput`)
- No UI page for **creating** new products

**Impact:** High - Users cannot create products via UI

**Recommendation:** Create UI pages:
- `app/mywork/products/new/page.tsx` - Create new product
- `app/mywork/products/page.tsx` - List all products (may already exist but needs to use `getWorkOutputs`)

### Issue #4: Missing `updatedAt` Field

**Problem:**
- `WorkCommsProduct` schema has `createdAt` but no `updatedAt`
- Code returns `updatedAt: product.createdAt` (fake field)

**Location:**
- `lib/actions/work-output.ts:132`
- `lib/actions/work-output.ts:194`
- `lib/actions/work-output.ts:316`
- `lib/actions/work-output.ts:373`

**Impact:** Low - Functional but misleading (always shows creation date)

**Recommendation:** Add `updatedAt DateTime @updatedAt` to `WorkCommsProduct` schema

### Issue #5: No Validation of CompanyX ID Existence

**Problem:**
- Code creates `CompanyWorkLink` with CompanyX IDs without verifying they exist
- If CompanyX ID is invalid, foreign key constraint will fail at DB level

**Location:**
- `lib/actions/work-output.ts:111`

**Impact:** Medium - Error handling happens at DB level, not user-friendly

**Recommendation:** Add validation:
```typescript
// Verify CompanyX exists before creating link
const companyX = await prisma[companyXModel].findUnique({
  where: { id: value, companyUnit },
})
if (!companyX) {
  return { success: false, error: `${companyXType} not found` }
}
```

### Issue #6: No Multi-Tenant Security on CompanyWorkLink Queries

**Problem:**
- `getWorkOutputsByRouter()` filters by `companyUnit` on `CompanyWorkLink`
- But `CompanyWorkLink` doesn't enforce `companyUnit` matches linked CompanyX's `companyUnit`

**Location:**
- `lib/actions/work-output.ts:430`

**Impact:** Low - Code filters by `companyUnit`, but schema doesn't enforce it

**Recommendation:** Add validation that `CompanyWorkLink.companyUnit` matches linked CompanyX's `companyUnit`

---

## 🏗️ FINAL PRODUCT ENGINE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPANYX MODELS                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Company  │  │ Company  │  │ Company  │  │ Company  │     │
│  │  Event   │  │ Campaign │  │ Training │  │ Benefits │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │              │              │            │
│       └─────────────┴──────────────┴──────────────┘            │
│                    │                                              │
│                    ▼                                              │
│  ┌──────────────────────────────────────────────────────┐       │
│  │          COMPANYWORKLINK (Junction Table)            │       │
│  │  ┌──────────────────────────────────────────────┐    │       │
│  │  │ id: UUID                                      │    │       │
│  │  │ companyEventId?: String                      │    │       │
│  │  │ companyCampaignId?: String                   │    │       │
│  │  │ companyTrainingId?: String                   │    │       │
│  │  │ ... (other CompanyX IDs)                     │    │       │
│  │  │ workCommsProductId: String (REQUIRED)        │    │       │
│  │  │ companyUnit: String?                         │    │       │
│  │  │ companyDivision: String?                     │    │       │
│  │  └──────────────────────────────────────────────┘    │       │
│  └───────────────────────┬──────────────────────────────┘       │
│                          │                                        │
│                          ▼                                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │            WORKCOMMSPRODUCT (Product)                 │       │
│  │  ┌──────────────────────────────────────────────┐    │       │
│  │  │ id: UUID                                      │    │       │
│  │  │ type: WorkCommsProductType (REQUIRED)         │    │       │
│  │  │ data: Json?                                   │    │       │
│  │  │ metadata: Json?                               │    │       │
│  │  │ companyUnit: String?                          │    │       │
│  │  │ companyDivision: String?                      │    │       │
│  │  │ createdByWorkMeId: String (REQUIRED)          │    │       │
│  │  │ createdAt: DateTime                           │    │       │
│  │  └──────────────────────────────────────────────┘    │       │
│  └───────────────────────┬──────────────────────────────┘       │
│                          │                                        │
│                          ▼                                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              PRODUCT OUTPUT / UI                      │       │
│  │  • Product Builder UI                                 │       │
│  │  • Product List View                                  │       │
│  │  • Product Detail View                                │       │
│  │  • Export/Download                                    │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘

CREATION FLOW:
1. User provides: { companyEventId, type, data, metadata }
2. createWorkOutput() validates input
3. Creates WorkCommsProduct
4. Creates CompanyWorkLink(s)
5. Returns product + links

READ FLOW:
1. getWorkOutput(id) or getWorkOutputs()
2. Queries WorkCommsProduct with links
3. Includes all CompanyX relations
4. Returns formatted data
```

---

## ⚠️ COLLISIONS WITH LEGACY SYSTEMS

### Collision #1: Legacy `workforce-comms` Routes

**Problem:**
- `/app/api/workforce-comms/generate/route.ts:70` incorrectly queries `CompanyWorkLink` using `productId` (which is `workforceCommsId`)
- This will never return results because it's querying the wrong model

**Impact:** High - Bug in legacy system, but doesn't affect new product system

**Status:** ✅ **DOES NOT BLOCK** new product system (separate models)

### Collision #2: Function Naming Confusion

**Problem:**
- Functions are named `createWorkOutput`, `getWorkOutput`, etc. (legacy naming)
- But they create `WorkCommsProduct` (new model)
- This creates confusion about what the functions do

**Impact:** Low - Functional but confusing

**Recommendation:** Consider renaming:
- `createWorkOutput` → `createWorkCommsProduct`
- `getWorkOutput` → `getWorkCommsProduct`
- `getWorkOutputs` → `getWorkCommsProducts`
- `updateWorkOutput` → `updateWorkCommsProduct`
- `deleteWorkOutput` → `deleteWorkCommsProduct`

### Collision #3: Legacy Return Format

**Problem:**
- Functions return both `workOutput` (legacy format) and `product` (new format)
- Legacy format includes fake `status: 'draft'` and `updatedAt: createdAt`

**Impact:** Low - Backward compatibility, but misleading

**Recommendation:** Deprecate legacy format, return only new format

---

## 📋 RECOMMENDED PATCH LIST

### High Priority

1. **Add `updatedAt` field to `WorkCommsProduct` schema**
   - Add `updatedAt DateTime @updatedAt` to model
   - Update return values to use real `updatedAt`

2. **Create API routes for product management**
   - `POST /api/products` - Create product
   - `GET /api/products` - List products
   - `GET /api/products/[id]` - Get product
   - `PUT /api/products/[id]` - Update product
   - `DELETE /api/products/[id]` - Delete product

3. **Create UI pages for product creation**
   - `app/mywork/products/new/page.tsx` - Create new product form
   - Update `app/mywork/products/page.tsx` to use `getWorkOutputs()`

### Medium Priority

4. **Make `companyUnit` required in schema**
   - Change `companyUnit String?` → `companyUnit String` in `WorkCommsProduct`
   - Change `companyUnit String?` → `companyUnit String` in `CompanyWorkLink`

5. **Add CompanyX ID validation**
   - Verify CompanyX exists before creating `CompanyWorkLink`
   - Return user-friendly error if CompanyX not found

6. **Rename functions for clarity**
   - `createWorkOutput` → `createWorkCommsProduct`
   - `getWorkOutput` → `getWorkCommsProduct`
   - etc.

### Low Priority

7. **Deprecate legacy return format**
   - Remove `workOutput` from return values
   - Return only `product` (new format)

8. **Add multi-tenant validation**
   - Ensure `CompanyWorkLink.companyUnit` matches linked CompanyX's `companyUnit`

---

## ✅ SUMMARY

**Status:** The modern product engine (`WorkCommsProduct` + `CompanyWorkLink`) is **fully implemented** and **functionally complete**, but **underutilized**.

**Key Findings:**
- ✅ All CRUD operations implemented
- ✅ Proper multi-tenant scoping
- ✅ Complete data contracts
- ❌ No API routes
- ❌ Minimal UI usage (only one edit page)
- ⚠️ Some schema inconsistencies (nullable vs required)
- ⚠️ Legacy naming conventions

**Recommendation:** The system is ready for production use, but needs:
1. API routes for integration
2. UI pages for product creation
3. Schema cleanup (make `companyUnit` required, add `updatedAt`)

---

**END OF AUDIT REPORT**

