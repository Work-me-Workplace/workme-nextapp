# Work Generation System - Complete Audit Report

**Date:** 2025-01-04  
**Status:** READ-ONLY AUDIT  
**Purpose:** Complete mapping of Work Generation system for "MyWork Hub" design

---

## 🎯 EXECUTIVE SUMMARY

This audit reveals a **fragmented product generation system** with multiple overlapping models, incomplete implementations, and documentation that doesn't match the actual codebase.

**Key Findings:**
- ✅ **WorkOutputStandalone** - Fully implemented and actively used
- ❌ **WorkCommsProduct** - Documented extensively but **NOT in Prisma schema**
- ⚠️ **WorkOutput** - Exists in schema but appears legacy/unused
- ⚠️ **Digital Signage** - Mentioned in docs but no dedicated implementation found
- ⚠️ **Product Builders** - Partially implemented (email exists, others are placeholders)
- ⚠️ **Work From Company Stuff** - Simple redirect page, minimal functionality

---

## STEP 1 — PRODUCT-RELATED PRISMA MODELS

### ✅ Model: `WorkOutputStandalone` (ACTIVE)

**Location:** `prisma/schema.prisma:848-870`

```prisma
model WorkOutputStandalone {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Output Category (Email, Talking Points, Digital, etc.)
  outputType OutputCategory

  title        String
  description  String?
  draftContent Json? // email body, notes, fields, etc.
  metadata     Json? // any structured data needed later

  companyUnit       String?
  createdByWorkMeId String
  createdBy         WorkMe  @relation("WorkOutputStandaloneCreator", fields: [createdByWorkMeId], references: [id], onDelete: Cascade)
  originatorId      String? // NTK attribution

  @@index([companyUnit])
  @@index([createdByWorkMeId])
  @@index([outputType])
  @@index([updatedAt])
}
```

**Enum: `OutputCategory`**
```prisma
enum OutputCategory {
  workforce_comms_email
  messaging_talking_points
  digital_product
  print_product
  sharepoint_update
  photo_video_support
}
```

**Relations:**
- `WorkMe` (via `createdByWorkMeId`) - Creator
- No direct relations to CompanyEvent, CompanyTraining, etc.

**Status:** ✅ **ACTIVE** - Used by `/api/output-standalone/*` routes

**Usage:**
- Created via `lib/server/work-output-standalone.ts`
- API routes: `/api/output-standalone/create`, `/api/output-standalone/[id]`
- UI pages: `/mywork/products/email/new`, `/mywork/products/[id]`

---

### ❌ Model: `WorkCommsProduct` (DOCUMENTED BUT NOT IN SCHEMA)

**Status:** ❌ **NOT FOUND IN PRISMA SCHEMA**

**Documentation Claims:**
- Extensive documentation in `docs/WORKCOMMSPRODUCT_DEEP_AUDIT.md`
- Claims to be "the unified product model (NEW, canonical)"
- Claims to have enum `WorkCommsProductType` with values: email, poster, ntk, digital_sign, exec_email, flyer, sharepoint, photo_video, talking_points

**Reality:**
- **NOT in `prisma/schema.prisma`**
- **NO Prisma model exists**
- **NO API routes use it**
- **NO UI pages use it**

**Conclusion:** This is **aspirational documentation** for a system that was never implemented.

---

### ⚠️ Model: `WorkOutput` (LEGACY - UNUSED?)

**Location:** `prisma/schema.prisma` (referenced in archived docs)

**Status:** ⚠️ **UNCLEAR** - Model may exist but not actively used

**From Archived Docs:**
```prisma
model WorkOutput {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  contextId String?
  context   WorkContext? @relation(...)

  supportId String?
  support   WorkSupport? @relation(...)

  companyId    String
  company      Company @relation(...)
  originatorId String
  originator   WorkMe  @relation(...)

  outputType String // "ntk_snippet" | "talking_points" | "digital_signage" | "print_product" | ...
  dataJson   Json?

  status String @default("draft")
}
```

**Note:** This model is referenced in archived documentation but may have been removed or replaced. Current schema search shows only `WorkOutputStandalone`.

---

### ✅ Model: `CommsOutput` (ACHIEVEMENTS MODULE)

**Location:** `prisma/schema.prisma:419-439`

```prisma
model CommsOutput {
  id String @id @default(cuid())

  companyUnit  String?
  originatorId String
  originator   WorkMe  @relation("CommsOutputOriginator", fields: [originatorId], references: [id], onDelete: Cascade)

  type        String // "email", "flyer", "digest", etc.
  title       String
  description String?
  wordCount   Int?
  dateSent    DateTime?
  topics      Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  achievements Achievement[]

  @@index([companyUnit])
  @@index([originatorId])
}
```

**Status:** ✅ **ACTIVE** - Part of achievements module, not product generation

**Purpose:** Tracks communications for achievements tracking, not product creation

---

### ✅ Model: `WorkForceEnduringProdEmailDigest` (EMAIL DIGEST PRODUCT)

**Location:** `prisma/schema.prisma:877-907`

```prisma
model WorkForceEnduringProdEmailDigest {
  id                String   @id @default(uuid())
  title             String
  description       String?
  companyUnit       String
  createdByWorkMeId String
  createdAt         DateTime @default(now())

  createdBy WorkMe               @relation("EmailDigestProductCreator", fields: [createdByWorkMeId], references: [id], onDelete: Cascade)
  editions  EmailDigestEdition[]

  @@index([companyUnit])
  @@index([createdByWorkMeId])
  @@index([createdAt])
}

model EmailDigestEdition {
  id            String                           @id @default(uuid())
  emailDigestId String
  product       WorkForceEnduringProdEmailDigest @relation(fields: [emailDigestId], references: [id], onDelete: Cascade)

  contentJson  Json
  generatedAt  DateTime @default(now())
  originatorId String
  companyUnit  String

  @@index([emailDigestId])
  @@index([companyUnit])
  @@index([generatedAt])
}
```

**Status:** ✅ **ACTIVE** - Specialized email digest product system

**Purpose:** Recurring email product with multiple editions

---

### ❌ Models NOT FOUND

The following models are **NOT in the Prisma schema**:
- ❌ `WorkCommsProductType` (enum) - Documented but doesn't exist
- ❌ `WorkCommsProductSubType` - Not found
- ❌ `WorkCommsAsset` - Not found
- ❌ `WorkCommsTemplate` - Not found
- ❌ `DigitalSignageProduct` - Not found
- ❌ `Flyer` - Not found (but `OutputCategory.print_product` exists)
- ❌ `Poster` - Not found (but `OutputCategory.print_product` exists)
- ❌ `EmailProduct` - Not found (but `OutputCategory.workforce_comms_email` exists)
- ❌ `NTK` - Not found (but mentioned in docs)

---

## STEP 2 — PRODUCT GENERATION ROUTES + ENDPOINTS

### ✅ Route: `/api/output-standalone/*` (ACTIVE)

**Status:** ✅ **FULLY IMPLEMENTED**

#### `/api/output-standalone` (GET)
- **File:** `app/api/output-standalone/route.ts`
- **Purpose:** List all standalone outputs for authenticated user
- **Implementation:** Complete
- **Uses:** `listStandaloneOutputs()` from `lib/server/work-output-standalone.ts`
- **Filters:** By `companyUnit` (multi-tenant)

#### `/api/output-standalone/create` (POST)
- **File:** `app/api/output-standalone/create/route.ts`
- **Purpose:** Create new standalone output
- **Implementation:** Complete
- **Uses:** `createStandaloneOutput()` from `lib/server/work-output-standalone.ts`
- **Body:** `{ outputType, title, description?, draftContent?, metadata? }`
- **Validates:** Zod schema with `OutputCategory` enum

#### `/api/output-standalone/[id]` (GET, PUT, DELETE)
- **File:** `app/api/output-standalone/[id]/route.ts`
- **Purpose:** Get, update, or delete standalone output
- **Implementation:** Complete
- **Uses:** `getStandaloneOutput()`, `updateStandaloneOutput()`, `deleteStandaloneOutput()`

---

### ❌ Route: `/api/workoutput/*` (NOT FOUND)

**Status:** ❌ **DOES NOT EXIST**

No API routes found matching `/api/workoutput/*`

---

### ❌ Route: `/api/products/*` (NOT FOUND)

**Status:** ❌ **DOES NOT EXIST**

No API routes found matching `/api/products/*`

**Note:** Documentation suggests these should exist, but they don't.

---

### ❌ Route: `/api/comms/*` (NOT FOUND)

**Status:** ❌ **DOES NOT EXIST**

No API routes found matching `/api/comms/*`

---

### ❌ Route: `/api/signage/*` (NOT FOUND)

**Status:** ❌ **DOES NOT EXIST**

No API routes found matching `/api/signage/*`

---

### ❌ Route: `/api/templates/*` (NOT FOUND)

**Status:** ❌ **DOES NOT EXIST**

No API routes found matching `/api/templates/*`

---

## STEP 3 — PRODUCT BUILDER UI COMPONENTS

### ✅ Component: Email Product Builder (PARTIAL)

**Route:** `/mywork/products/email/new`
**File:** `app/mywork/products/email/new/page.tsx`
**Status:** ✅ **IMPLEMENTED**

**Features:**
- Form to create email output
- Fields: title, description, draftContent
- Creates `WorkOutputStandalone` with `outputType: 'workforce_comms_email'`
- Redirects to `/mywork/products/[id]` after creation

**Limitations:**
- Basic form only (no rich text editor)
- No template selection
- No preview functionality

---

### ⚠️ Component: Product List Page (PARTIAL)

**Route:** `/mywork/products`
**File:** `app/mywork/products/page.tsx`
**Status:** ⚠️ **PARTIALLY IMPLEMENTED**

**Features:**
- Lists available output types
- Cards for each type: workforce_comms_email, messaging_talking_points, digital_product, print_product, sharepoint_update, photo_video_support
- Links to creation pages

**Limitations:**
- **Does NOT list existing products** (only shows type selection)
- Most routes are placeholders (`/mywork/products/talking-points/new`, etc.)
- Only email route is implemented

---

### ✅ Component: Product Detail/Edit Page (IMPLEMENTED)

**Route:** `/mywork/products/[id]`
**File:** `app/mywork/products/[id]/page.tsx`
**Status:** ✅ **FULLY IMPLEMENTED**

**Features:**
- View product details
- Edit mode with form
- Update via `/api/output-standalone/[id]` PUT
- Displays: title, description, draftContent, outputType badge

---

### ❌ Component: NTK Builder (NOT FOUND)

**Status:** ❌ **NOT FOUND**

Documentation mentions NTK builders but no components found in codebase.

---

### ❌ Component: Poster Builder (NOT FOUND)

**Status:** ❌ **NOT FOUND**

No dedicated poster builder found. May be part of print_product type.

---

### ❌ Component: Flyer Builder (NOT FOUND)

**Status:** ❌ **NOT FOUND**

No dedicated flyer builder found. May be part of print_product type.

---

### ⚠️ Component: Digital Signage Builder (MENTIONED BUT NOT FOUND)

**Status:** ⚠️ **NOT FOUND**

- Mentioned in `/mywork/create` page as option
- No dedicated builder component found
- May be intended for `digital_product` outputType

---

### ✅ Component: Holiday Builder (SPECIALIZED)

**Route:** `/holiday/[holidayId]`
**File:** `app/holiday/[holidayId]/page.tsx`
**Status:** ✅ **IMPLEMENTED**

**Features:**
- Holiday-specific product generation
- Uses `HolidayGeneratorPanel` component
- Generates social graphics, captions, content
- Not part of main product system

---

### ⚠️ Component: Promotional Product Builder (LEGACY?)

**Route:** `/attention/events/[eventId]/promo/new/ai`
**File:** `app/attention/events/[eventId]/promo/new/ai/page.tsx`
**Status:** ⚠️ **EXISTS BUT UNCLEAR STATUS**

**Features:**
- AI-powered product parsing
- Creates promotional products for events
- Uses different model/flow than main product system

---

### ❌ Component: TemplatePicker (NOT FOUND)

**Status:** ❌ **NOT FOUND**

No generic template picker component found.

**Note:** `EventTemplatePicker` exists but is for events, not products.

---

### ❌ Component: PreviewPanel (NOT FOUND)

**Status:** ❌ **NOT FOUND**

No generic preview panel component found.

---

### ❌ Component: EditorPanel (NOT FOUND)

**Status:** ❌ **NOT FOUND**

No generic editor panel component found.

---

### ❌ Component: WorkOutputCard / ProductCard (NOT FOUND)

**Status:** ❌ **NOT FOUND**

No reusable product card component found.

---

## STEP 4 — "WORK FROM COMPANY STUFF" DEPENDENCIES

### Route: `/mywork/fromcompanystuff`

**File:** `app/mywork/fromcompanystuff/page.tsx`
**Status:** ✅ **IMPLEMENTED BUT MINIMAL**

**What It Does:**
- Simple landing page
- Single button: "Browse Company Stuff"
- Links to `/mycompany/workforcestuff?select=true`

**Current Functionality:**
- **Does NOT create products directly**
- **Does NOT link to product creation**
- Just redirects to company stuff browser

**Dependencies:**
- `WorkforceStuffItem` interface (not Prisma model)
- Company models: `CompanyEvent`, `CompanyTraining`, `CompanyCampaign`, `CompanyImpactEvent`, `CompanyCommunity`, `CompanyBenefits`, `CompanyCareer`, `CompanyEmployeeCause`

**Integration Status:**
- ⚠️ **NOT INTEGRATED** - No connection to product creation flow
- User must manually navigate from company stuff to product creation

**Recommendation:**
- Should be removed or rewritten to directly create products from selected company items
- Should pass `sourceId` and `sourceType` to product builder

---

## STEP 5 — DIGITAL SIGNAGE SYSTEM

### Search Results

**Files Mentioning "signage" or "digital":**
- `docs/MY_WORK_DEEP_DIVE.md` - Mentions digital signage as option
- `app/mywork/create/page.tsx` - Lists "Digital Signage" as output type
- `app/mywork/products/page.tsx` - Lists "Digital Product" as option
- Documentation files mention `digital_sign` as product type

### Implementation Status

**Prisma Models:** ❌ **NOT FOUND**
- No `DigitalSignageProduct` model
- No dedicated digital signage schema

**API Endpoints:** ❌ **NOT FOUND**
- No `/api/signage/*` routes
- No digital signage-specific endpoints

**UI Components:** ❌ **NOT FOUND**
- No digital signage builder
- No digital signage preview
- No digital signage templates

**Product Type:** ⚠️ **PARTIALLY SUPPORTED**
- `OutputCategory.digital_product` exists
- Could theoretically be used for digital signage
- But no specialized implementation

### Conclusion

**Status:** ❌ **NOT IMPLEMENTED**

Digital signage is:
- Mentioned in UI as an option
- Has a generic `digital_product` outputType
- But has **no dedicated implementation**
- No builder, no templates, no specialized features

---

## STEP 6 — COMPLETE PRODUCT GENERATION MAP

### Product Type → Model → API → UI → Status

#### 1. Workforce Comms Email
- **Model:** `WorkOutputStandalone` (outputType: `workforce_comms_email`)
- **API:** ✅ `/api/output-standalone/create` (POST)
- **UI:** ✅ `/mywork/products/email/new` (Create) + `/mywork/products/[id]` (Edit)
- **Status:** ✅ **COMPLETE**

#### 2. Messaging & Talking Points
- **Model:** `WorkOutputStandalone` (outputType: `messaging_talking_points`)
- **API:** ✅ `/api/output-standalone/create` (POST)
- **UI:** ❌ `/mywork/products/talking-points/new` (Placeholder - doesn't exist)
- **Status:** ⚠️ **PARTIAL** - Model/API ready, UI missing

#### 3. Digital Product
- **Model:** `WorkOutputStandalone` (outputType: `digital_product`)
- **API:** ✅ `/api/output-standalone/create` (POST)
- **UI:** ❌ `/mywork/products/digital/new` (Placeholder - doesn't exist)
- **Status:** ⚠️ **PARTIAL** - Model/API ready, UI missing

#### 4. Print Product (Poster/Flyer)
- **Model:** `WorkOutputStandalone` (outputType: `print_product`)
- **API:** ✅ `/api/output-standalone/create` (POST)
- **UI:** ❌ `/mywork/products/print/new` (Placeholder - doesn't exist)
- **Status:** ⚠️ **PARTIAL** - Model/API ready, UI missing

#### 5. SharePoint Update
- **Model:** `WorkOutputStandalone` (outputType: `sharepoint_update`)
- **API:** ✅ `/api/output-standalone/create` (POST)
- **UI:** ❌ `/mywork/products/sharepoint/new` (Placeholder - doesn't exist)
- **Status:** ⚠️ **PARTIAL** - Model/API ready, UI missing

#### 6. Photo & Video Support
- **Model:** `WorkOutputStandalone` (outputType: `photo_video_support`)
- **API:** ✅ `/api/output-standalone/create` (POST)
- **UI:** ❌ `/mywork/products/photo-video/new` (Placeholder - doesn't exist)
- **Status:** ⚠️ **PARTIAL** - Model/API ready, UI missing

#### 7. Email Digest (Specialized)
- **Model:** `WorkForceEnduringProdEmailDigest` + `EmailDigestEdition`
- **API:** ❌ Not found (may use different route)
- **UI:** ❌ Not found
- **Status:** ⚠️ **UNCLEAR** - Model exists but usage unknown

#### 8. Digital Signage
- **Model:** ❌ Not found (would use `digital_product` if implemented)
- **API:** ❌ Not found
- **UI:** ❌ Not found
- **Status:** ❌ **NOT IMPLEMENTED**

#### 9. NTK (Need to Know)
- **Model:** ❌ Not found (documented but not in schema)
- **API:** ❌ Not found
- **UI:** ❌ Not found
- **Status:** ❌ **NOT IMPLEMENTED**

#### 10. WorkCommsProduct (Documented)
- **Model:** ❌ **DOES NOT EXIST** (documented but not in schema)
- **API:** ❌ Not found
- **UI:** ❌ Not found
- **Status:** ❌ **NOT IMPLEMENTED** (aspirational documentation only)

---

## STEP 7 — WORKFLOWS ANALYSIS

### ✅ Working Workflows

#### Workflow 1: Create Email Product
1. Navigate to `/mywork/products/email/new`
2. Fill form (title, description, draftContent)
3. Submit → Creates `WorkOutputStandalone`
4. Redirects to `/mywork/products/[id]`
5. Can edit/view product

**Status:** ✅ **FULLY FUNCTIONAL**

---

### ⚠️ Partial Workflows

#### Workflow 2: Create Other Product Types
1. Navigate to `/mywork/products`
2. See product type cards
3. Click on type (e.g., "Print Product")
4. **BROKEN:** Route doesn't exist (`/mywork/products/print/new`)

**Status:** ⚠️ **BROKEN** - UI suggests it exists but routes are missing

---

### ❌ Broken/Non-Existent Workflows

#### Workflow 3: Create Product from Company Stuff
1. Navigate to `/mywork/fromcompanystuff`
2. Click "Browse Company Stuff"
3. Select company item
4. **BROKEN:** No connection to product creation

**Status:** ❌ **NOT CONNECTED** - No integration between company stuff and product creation

#### Workflow 4: Create Product via WorkCommsProduct
1. Documentation suggests this workflow
2. **BROKEN:** Model doesn't exist

**Status:** ❌ **IMPOSSIBLE** - Model not in schema

---

## GAPS ANALYSIS

### Critical Gaps

1. **Missing Product Type UIs**
   - Only email has a creation UI
   - All other types (talking points, digital, print, sharepoint, photo/video) have no creation UI
   - Routes are placeholders

2. **No Product-Company Integration**
   - `WorkOutputStandalone` has no relation to CompanyEvent, CompanyTraining, etc.
   - "Work From Company Stuff" doesn't connect to product creation
   - No way to link products to company items

3. **Documentation vs Reality Mismatch**
   - Extensive documentation for `WorkCommsProduct` that doesn't exist
   - Documentation suggests features that aren't implemented

4. **No Template System**
   - No template models
   - No template picker components
   - No template selection in product creation

5. **No Preview System**
   - No preview components
   - No preview functionality in builders

6. **No Digital Signage Implementation**
   - Mentioned but not implemented
   - No specialized features

### Medium Priority Gaps

7. **No Product List View**
   - `/mywork/products` shows type selection, not existing products
   - No way to browse created products

8. **Limited Editing**
   - Basic text editing only
   - No rich text editor
   - No visual editing for print products

9. **No Product Linking**
   - Products can't be linked to multiple company items
   - No junction table for product-company relationships

### Low Priority Gaps

10. **Naming Inconsistencies**
    - "Output" vs "Product" terminology confusion
    - Legacy naming in code

11. **No Product Status Workflow**
    - No draft → review → approved workflow
    - No status management

---

## RECOMMENDATIONS FOR "MYWORK HUB" DESIGN

### 1. Unified Product Creation Entry Point

**Create:** `/mywork/hub` (or `/mywork/create`)

**Features:**
- Single page showing all available product types
- Each type shows:
  - Icon
  - Name
  - Description
  - Status (Available / Coming Soon)
- Clicking a type opens creation flow

**Product Types to Show:**
- ✅ Workforce Comms Email (Available)
- ⚠️ Messaging & Talking Points (Coming Soon)
- ⚠️ Digital Product (Coming Soon)
- ⚠️ Print Product (Coming Soon)
- ⚠️ SharePoint Update (Coming Soon)
- ⚠️ Photo & Video Support (Coming Soon)

### 2. Product Creation Flow

**For Each Product Type:**
1. **Type Selection** → Hub page
2. **Source Selection** (optional):
   - Create from Company Item (browse and select)
   - Create from Scratch
3. **Builder UI** → Type-specific builder
4. **Preview** → Preview generated product
5. **Save** → Create `WorkOutputStandalone`

### 3. Integration with Company Stuff

**Enhance `/mywork/fromcompanystuff`:**
- Allow selecting company item first
- Then show product type selection
- Pre-populate product with company item data
- Create link between product and company item

**OR:**
- Remove `/mywork/fromcompanystuff` entirely
- Integrate company item selection into hub flow

### 4. Product Management

**Create:** `/mywork/products` (list view)
- Show all created products
- Filter by type
- Filter by company item
- Search functionality
- Edit/Delete actions

### 5. Builder Implementation Priority

**Phase 1 (Critical):**
1. Email builder (already exists, enhance if needed)
2. Print product builder (poster/flyer)
3. Talking points builder

**Phase 2 (Important):**
4. Digital product builder
5. SharePoint builder
6. Photo/video builder

**Phase 3 (Future):**
7. Digital signage (if needed)
8. NTK (if needed)

### 6. Data Model Decisions

**Option A: Use Existing `WorkOutputStandalone`**
- ✅ Already implemented
- ✅ Has all needed fields
- ⚠️ No relation to company items
- **Recommendation:** Use this, add junction table if needed

**Option B: Implement `WorkCommsProduct`**
- ❌ Requires schema migration
- ❌ Requires rewriting all code
- ⚠️ More complex but more flexible
- **Recommendation:** Don't do this unless there's a strong reason

**Recommendation:** **Use `WorkOutputStandalone`** and add a junction table if product-company linking is needed.

---

## FINAL SUMMARY

### What Exists ✅
- `WorkOutputStandalone` model (fully functional)
- `/api/output-standalone/*` API routes (complete CRUD)
- Email product creation UI
- Product detail/edit page
- Basic product type selection page

### What's Missing ❌
- Product creation UIs for 5 of 6 product types
- Product-company item linking
- Template system
- Preview system
- Digital signage implementation
- Product list view
- WorkCommsProduct model (documented but doesn't exist)

### What's Broken ⚠️
- "Work From Company Stuff" doesn't connect to product creation
- Product type selection page has placeholder routes
- Documentation doesn't match reality

### Next Steps
1. **Design unified "MyWork Hub"** with all product types
2. **Implement missing builder UIs** (priority: print, talking points)
3. **Integrate company stuff selection** into product creation flow
4. **Create product list view** to browse existing products
5. **Decide on product-company linking** (junction table vs current model)

---

**END OF AUDIT**

