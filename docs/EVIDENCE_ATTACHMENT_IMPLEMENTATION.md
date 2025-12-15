# Evidence Attachment Implementation

**Last Updated:** 2025-01-28  
**Status:** ✅ Core Implementation Complete

---

## Overview

Extended the Note Lookup feature to allow users to attach publicly verified evidence to ProductFamily models. This enables users to take OSINT-verified articles and intentionally associate them with product concepts or programs.

---

## What's Implemented

### ✅ Database Models

**Location:** `prisma/schema.prisma`

1. **ProductFamily Model**
   - `id`, `companyId` (optional), `name`, `description`
   - `status`: CONCEPT | ADVOCATED | PROGRAM
   - Links to Company (optional)
   - Can have multiple ExternalEvidence records

2. **ExternalEvidence Model**
   - `id`, `productFamilyId` (REQUIRED), `productPlatformId` (optional)
   - `title`, `url`, `publisher`, `publishedAt`, `snippet`, `capturedAt`
   - Always belongs to a ProductFamily (required anchor point)
   - Can optionally link to CompanyPlatformProduct for context

3. **EvidenceClassification Model**
   - `id`, `evidenceId`, `classificationType`, `confirmedByUser`
   - Stores inferred classifications ONLY after user confirmation
   - Types: COMPANY_PRODUCTS | COMPANY_PUBLIC_PERCEPTION | EXTERNAL_COMPANY_PRESSURE

**Migration:** `prisma/migrations/20250128000000_add_product_family_and_external_evidence/migration.sql`

---

### ✅ API Endpoints

1. **POST /api/company/product-family/evidence**
   - **Location:** `app/api/company/product-family/evidence/route.ts`
   - **Purpose:** Persist evidence to ProductFamily
   - **Auth:** Firebase token required
   - **Features:**
     - Validates evidence array
     - Creates ProductFamily if needed, or uses existing
     - Validates ProductPlatform if provided
     - Persists ExternalEvidence records
     - Stores classifications ONLY if `confirmedByUser = true`

2. **GET /api/company/product-family/list**
   - **Location:** `app/api/company/product-family/list/route.ts`
   - **Purpose:** Fetch ProductFamily options for dropdown
   - **Auth:** Firebase token required
   - **Returns:** Array of ProductFamily options with id, name, description, status

3. **GET /api/company/products/platform/list** (Updated)
   - **Location:** `app/api/company/products/platform/list/route.ts`
   - **Purpose:** Fetch ProductPlatform options for dropdown
   - **Auth:** Firebase token required (added)
   - **Returns:** Array of CompanyPlatformProduct options

---

### ✅ Frontend UI

**Location:** `app/signal/note/page.tsx`

**Flow:**
1. **Input** (unchanged)
   - User enters signal phrase
   - System performs OSINT lookup via serper.dev

2. **Verification** (unchanged)
   - System displays public results
   - Shows "Publicly Verifiable" or "Not Found Publicly"
   - Note Lookup remains fully stateless

3. **Evidence Selection** (NEW)
   - "Attach Evidence To Product Family" button appears when results are public
   - User selects 1+ articles via checkboxes
   - No auto-selection - user must explicitly choose

4. **Attachment** (NEW)
   - User chooses:
     - **Product Family:** Select existing OR create new (name + description)
     - **Product Platform:** Optional dropdown selection
   - User clicks "Save Evidence"
   - Evidence persisted under ProductFamily

5. **Confirmation** (NEW)
   - Success message displayed
   - User can attach more evidence or start new lookup

---

## Type Definitions

**Location:** `lib/types/signal.ts`

Added types:
- `EvidenceAttachmentRequest`
- `EvidenceAttachmentResponse`
- `EvidenceAttachmentError`
- `ProductFamilyOption`
- `ProductPlatformOption`

---

## Design Decisions

1. **ProductFamily as Anchor Point**
   - Evidence MUST belong to a ProductFamily (required)
   - ProductFamily can optionally belong to a Company
   - This ensures no orphan evidence records

2. **No Auto-Classification**
   - Classifications stored ONLY after user confirmation
   - Inference can be added later but requires explicit user approval

3. **Stateless Lookup Preserved**
   - Note Lookup endpoint (`/api/signalingest/note/lookup`) unchanged
   - No database writes during lookup
   - Evidence attachment is separate, intentional step

4. **Optional ProductPlatform**
   - Evidence can optionally link to CompanyPlatformProduct
   - Provides additional context but not required

---

## Future Extensions

The current implementation focuses on **Products → ProductFamily** flow. Future enhancements could include:

1. **Inference Step**
   - Analyze selected evidence to suggest classification type
   - Present suggestions (Products, Public Perception, External Pressure, etc.)
   - User confirms or changes selection

2. **Additional Model Types**
   - Attach evidence to CompanyPublicPerception (if model created)
   - Attach evidence to ExternalCompanyPressure records
   - Attach evidence to CompanyMilestone records
   - Attach evidence to Workforce records

3. **Enhanced Classification**
   - Store multiple classifications per evidence
   - Track confidence scores for inferences
   - Allow users to override or add classifications

---

## Usage Example

1. User enters: "Trump calling for a Golden Fleet"
2. System finds 5 public articles
3. User selects 3 articles via checkboxes
4. User clicks "Attach Evidence To Product Family"
5. User creates new ProductFamily: "Golden Fleet"
6. User optionally selects ProductPlatform: "Virginia-class"
7. User clicks "Save Evidence"
8. System persists 3 ExternalEvidence records under "Golden Fleet" ProductFamily

---

## Migration Status

⚠️ **Migration file created but not yet applied**

To apply the migration:
```bash
npx prisma migrate deploy
```

Or for development:
```bash
npx prisma db push
```

---

## Testing Checklist

- [ ] Note Lookup still works (stateless)
- [ ] Evidence selection with checkboxes works
- [ ] Can select existing ProductFamily
- [ ] Can create new ProductFamily
- [ ] Can optionally select ProductPlatform
- [ ] Evidence persists correctly
- [ ] Success message displays
- [ ] Error handling works correctly
- [ ] Authentication enforced on all endpoints
