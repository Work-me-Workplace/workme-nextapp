# WorkMe Product Build Architecture

**Last Updated:** 2025-01-28  
**Status:** Final Architecture (Post-Legacy Cleanup)

---

## Executive Summary

This document describes the final, clean architecture for WorkMe's product build system. After extensive refactoring, we've established a clear, explicit, multi-tenant architecture that separates identity, content ingestion, and product generation into distinct, maintainable layers.

**Key Principles:**
- **Identity-First:** All operations flow through Firebase Auth → WorkMe → CompanyUnit
- **Explicit Models:** No polymorphism or generic product tables
- **Multi-Tenant Scoping:** `companyUnit` is the universal routing key
- **Standardized Contracts:** All CompanyX models share a consistent field structure
- **Clean Separation:** Identity, content, and products are distinct layers

---

## 1. Identity & Authentication Layer

### 1.1 Identity Chain

All server-side operations follow this identity chain:

```
Firebase Token → verifyAuth() → loadWorkMe() → WorkMe Identity
```

**Components:**

1. **`verifyAuth(request)`** (`lib/server/verifyAuth.ts`)
   - **Purpose:** Pure Firebase authentication
   - **Returns:** `{ firebaseId, email, displayName, photoUrl }`
   - **Does NOT:** Fetch WorkMe, companyUnit, or business data
   - **Scope:** Auth-only, no business logic

2. **`loadWorkMe(firebaseId)`** (`lib/auth/loadWorkMe.ts`)
   - **Purpose:** Load WorkMe identity record
   - **Returns:** `WorkMe` object with `{ id, companyUnit, companyDivision, ... }`
   - **Validation:** Throws if WorkMe not found
   - **Usage:** Called after `verifyAuth` in all API routes

3. **WorkMe Model** (`prisma/schema.prisma`)
   ```prisma
   model WorkMe {
     id              String   @id @default(cuid())
     firebaseId      String   @unique
     email           String
     firstName       String?
     lastName        String?
     companyUnit     String?  // Required for multi-tenant operations
     companyDivision String?  // Optional grouping layer
     // ... other identity fields
   }
   ```

### 1.2 API Route Pattern

Every API route follows this pattern:

```typescript
export async function POST(request: Request) {
  // 1. Auth
  const { firebaseId } = await verifyAuth(request)
  
  // 2. Load WorkMe Identity
  const workMe = await loadWorkMe(firebaseId)
  const { id: workMeId, companyUnit, companyDivision } = workMe
  
  // 3. Validate companyUnit (if required)
  if (!companyUnit) {
    return error("User must set a companyUnit")
  }
  
  // 4. Business Logic
  // ... create/update/query operations
}
```

---

## 2. Content Ingestion Layer (CompanyX Models)

### 2.1 Standardized CompanyX Contract

All CompanyX models follow this contract:

```prisma
model CompanyX {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  
  // Core Content
  title       String
  description String?
  
  // Standardized Fields
  summary String?              // AI-synthesized paragraph (for EmailDigest)
  companyUnit String?          // Multi-tenant routing key
  createdByWorkMeId String     // Actor identity
  
  // Relations
  createdBy WorkMe @relation(...)
  
  @@index([companyUnit])
  @@index([createdByWorkMeId])
}
```

### 2.2 CompanyX Models

**Models:**
- `CompanyCampaign` - Marketing campaigns
- `CompanyImpactEvent` - Organizational impact events
- `CompanyTraining` - Training opportunities
- `CompanyEvent` - Social/company events
- `CompanyCommunity` - Community initiatives
- `CompanyBenefits` - Employee benefits
- `CompanyCareer` - Career opportunities
- `CompanyEmployeeCause` - Employee-driven causes

**Key Fields:**
- `summary String?` - **Required for all models** (standardized contract)
- `companyUnit String?` - Multi-tenant scoping
- `createdByWorkMeId String` - Actor identity (required)
- Model-specific fields (POC, dates, metadata, etc.)

### 2.3 Content Ingestion Flow

```
User Input → AI Parsing → Normalization → CompanyX Creation
```

**Example: Event Ingestion**
1. User submits raw text → `/api/ingest/event/ai`
2. GPT parses and structures → `EventIngestionResponse`
3. Normalize with `normalizeGPTIngestionOutput()` → `NormalizedEventData`
4. Create `CompanyEvent` with `createdByWorkMeId` and `companyUnit`
5. Create related `EventItem` records

---

## 3. Product Generation Layer

### 3.1 Product Architecture

**Principle:** Explicit models for each product type (no polymorphism)

**Current Product:**
- `WorkForceEnduringProdEmailDigest` - Email digest product
- `EmailDigestEdition` - Individual digest editions

### 3.2 Product Models

#### WorkForceEnduringProdEmailDigest

```prisma
model WorkForceEnduringProdEmailDigest {
  id                String   @id @default(uuid())
  title             String
  description       String?
  companyUnit       String
  createdByWorkMeId String
  createdAt         DateTime @default(now())

  createdBy WorkMe @relation("EmailDigestProductCreator", ...)
  editions  EmailDigestEdition[]

  @@index([companyUnit])
  @@index([createdByWorkMeId])
  @@index([createdAt])
}
```

**Purpose:** Represents a reusable email digest product configuration.

#### EmailDigestEdition

```prisma
model EmailDigestEdition {
  id             String   @id @default(uuid())
  emailDigestId  String
  product        WorkForceEnduringProdEmailDigest @relation(...)

  contentJson    Json
  generatedAt    DateTime @default(now())
  originatorId   String
  companyUnit    String

  @@index([emailDigestId])
  @@index([companyUnit])
  @@index([generatedAt])
}
```

**Purpose:** Individual generated edition of an email digest.

**Key Design Decisions:**
- **Explicit FK:** `emailDigestId` (not generic `productId`)
- **No Polymorphism:** Each product type has its own model
- **Content Storage:** `contentJson` for flexible structure
- **Originator Tracking:** `originatorId` for attribution

### 3.3 Product Generation Flow

```
User Creates Product → Select CompanyX Items → Generate Edition → Store Edition
```

**Server Actions:**
- `createEmailDigestProduct({ title, description })` - Create product
- `createEmailDigestEdition(emailDigestId)` - Generate edition

**Edition Generation Process:**
1. Verify auth → Load WorkMe → Get `companyUnit`
2. Query CompanyX models for `companyUnit`
3. Extract `summary` fields from CompanyX items
4. Build prompt with CompanyX summaries
5. Send to OpenAI for content generation
6. Save `EmailDigestEdition` with `contentJson`

---

## 4. Multi-Tenant Architecture

### 4.1 Tenant Scoping

**Primary Key:** `companyUnit` (String)

**Rules:**
- All domain objects (CompanyX, Products, Editions) are scoped by `companyUnit`
- `companyUnit` is required for all multi-tenant operations
- `companyDivision` is optional and only exists on `WorkMe` (not on domain objects)

### 4.2 Query Pattern

All multi-tenant queries follow this pattern:

```typescript
const items = await prisma.companyX.findMany({
  where: { companyUnit },  // Always scope by companyUnit
})
```

**Indexing:**
- All CompanyX models have `@@index([companyUnit])`
- All product models have `@@index([companyUnit])`
- Enables fast tenant-scoped queries

### 4.3 Access Control

**Current Model:**
- All users within a `companyUnit` can access all data for that unit
- No role-based access control (RBAC) at domain level
- `createdByWorkMeId` tracks who created each record

**Future Enhancement:**
- `CompanyUnitMembers` junction table exists but not fully utilized
- Can add `MEMBER`, `MANAGER`, `ADMIN` roles per unit

---

## 5. Data Flow Patterns

### 5.1 Content Creation Flow

```
User Action → API Route → verifyAuth → loadWorkMe → Validate companyUnit → Create CompanyX
```

**Example: Create CompanyEvent**
```typescript
POST /api/ingest/event/save
  → verifyAuth() → { firebaseId }
  → loadWorkMe(firebaseId) → { workMeId, companyUnit }
  → normalizeGPTIngestionOutput() → NormalizedEventData
  → prisma.companyEvent.create({
      data: {
        ...eventData,
        companyUnit,
        createdByWorkMeId: workMeId,
      }
    })
```

### 5.2 Product Generation Flow

```
User Action → Server Action → verifyAuth → loadWorkMe → Query CompanyX → Generate → Save Edition
```

**Example: Create EmailDigest Edition**
```typescript
createEmailDigestEdition(emailDigestId)
  → verifyAuth() → { firebaseId }
  → loadWorkMe(firebaseId) → { workMeId, companyUnit }
  → Query CompanyX models: findMany({ where: { companyUnit } })
  → Extract summaries from CompanyX items
  → Build prompt → OpenAI API
  → Save EmailDigestEdition with contentJson
```

### 5.3 Content Query Flow

```
User Request → API Route → verifyAuth → loadWorkMe → Query CompanyX (scoped by companyUnit)
```

**Example: List CompanyEvents**
```typescript
GET /api/events
  → verifyAuth() → { firebaseId }
  → loadWorkMe(firebaseId) → { workMeId, companyUnit }
  → prisma.companyEvent.findMany({
      where: { companyUnit },  // Tenant scoping
      select: { id, title, description, summary, ... }
    })
```

---

## 6. Removed Legacy Systems

### 6.1 Deleted Models

**Removed:**
- `WorkCommsProduct` - Generic product table
- `CompanyWorkLink` - Junction table linking CompanyX to products
- `NTK` - Need-To-Know system
- `NTKEdition` - NTK editions
- `NTKItem` - NTK items
- `WorkforceComms` - Legacy workforce communications
- `WorkforceCommsDraft` - Draft system
- `WorkforceCommsEdition` - Legacy editions
- `Flyer`, `Poster`, `DigitalSignage`, `TalkingPoints` - Specific product types

**Reason:** Confusing polymorphism, generic identifiers, and mixed concerns.

### 6.2 Deleted Code Layers

**Removed:**
- `lib/actions/work-output.ts` - Generic output actions
- `lib/actions/workforce-comms.ts` - Legacy comms actions
- `lib/actions/ntk*.ts` - All NTK actions
- `lib/server/ntk*.ts` - All NTK server utilities
- `/app/api/work-output/*` - Generic output routes
- `/app/api/workforce-comms/*` - Legacy comms routes
- `/app/api/ntk/*` - All NTK routes
- `/app/workforce-comms/*` - Legacy UI pages
- `/components/ntk/*` - NTK UI components

**Reason:** Replaced with explicit, clean product models.

### 6.3 Removed Fields

**From All Models:**
- `workforceCommsId` - Legacy identifier
- `workCommsProductId` - Generic product reference
- `companyDivision` - Removed from all domain objects (kept only on WorkMe)
- `outputType` - Generic output type enum
- `legacyOutputType` - Migration field

**Reason:** Standardized on explicit models and `companyUnit`-only scoping.

---

## 7. File Structure

### 7.1 Core Identity Files

```
lib/
  server/
    verifyAuth.ts          # Firebase auth only
  auth/
    loadWorkMe.ts          # WorkMe identity loader
```

### 7.2 Content Ingestion Files

```
lib/
  actions/
    event-ingestion.ts     # Event creation from AI
    company-x.ts           # CompanyX CRUD operations
  server/
    gptJsonMapperService.ts # Normalization utilities
app/api/
  ingest/
    event/
      ai/route.ts          # GPT parsing
      save/route.ts        # Save parsed event
  workstuff/
    ingest/                # CompanyX ingestion routes
```

### 7.3 Product Files

```
lib/
  actions/
    email-digest.ts        # Email digest product actions
app/
  workforce/
    enduring/
      email-digest/        # Email digest UI pages
        page.tsx           # List products
        new/page.tsx       # Create product
        [emailDigestId]/
          page.tsx         # View product
          editions/
            page.tsx      # List editions
            [editionId]/
              page.tsx    # View edition
```

---

## 8. Key Design Decisions

### 8.1 Identity Separation

**Decision:** `verifyAuth` is auth-only; `loadWorkMe` handles identity.

**Rationale:**
- Clear separation of concerns
- Prevents circular dependencies
- Makes identity loading explicit and testable

### 8.2 Explicit Product Models

**Decision:** Each product type has its own model (no polymorphism).

**Rationale:**
- Type safety
- Clear schema
- Easy to extend with new product types
- No confusion about generic `productId` fields

### 8.3 Standardized CompanyX Contract

**Decision:** All CompanyX models have `summary`, `companyUnit`, `createdByWorkMeId`.

**Rationale:**
- Consistent querying for product generation
- Predictable data structure
- Easy to extend with new CompanyX types

### 8.4 companyUnit-Only Scoping

**Decision:** `companyDivision` removed from all domain objects; only on `WorkMe`.

**Rationale:**
- Simpler multi-tenant model
- Clearer routing logic
- Easier to reason about access control

### 8.5 Explicit Foreign Keys

**Decision:** Use explicit FK names like `emailDigestId` (not generic `productId`).

**Rationale:**
- Self-documenting schema
- Type-safe relations
- No ambiguity about what a FK references

---

## 9. Migration Path

### 9.1 From Legacy to Current

**Old Pattern:**
```typescript
// Generic product creation
const product = await prisma.workCommsProduct.create({
  data: { type: 'EMAIL_DIGEST', ... }
})
const link = await prisma.companyWorkLink.create({
  data: { companyEventId, workCommsProductId: product.id }
})
```

**New Pattern:**
```typescript
// Explicit product creation
const product = await prisma.workForceEnduringProdEmailDigest.create({
  data: { title, description, companyUnit, createdByWorkMeId }
})
// No junction table needed - CompanyX items queried directly by companyUnit
```

### 9.2 Data Migration

**For Existing Data:**
- Legacy `WorkCommsProduct` records can be migrated to `WorkForceEnduringProdEmailDigest`
- `CompanyWorkLink` records are no longer needed (query CompanyX directly)
- NTK data can be archived or migrated to new product system

---

## 10. Future Enhancements

### 10.1 Additional Product Types

**Pattern:**
```prisma
model WorkForceEnduringProdNewsletter {
  id                String   @id @default(uuid())
  title             String
  companyUnit       String
  createdByWorkMeId String
  editions          NewsletterEdition[]
}

model NewsletterEdition {
  id            String
  newsletterId  String
  product       WorkForceEnduringProdNewsletter @relation(...)
  contentJson   Json
  // ...
}
```

**Key:** Follow the same pattern as `EmailDigest` - explicit models, explicit FKs.

### 10.2 Role-Based Access Control

**Enhancement:**
- Utilize `CompanyUnitMembers` junction table
- Add `MEMBER`, `MANAGER`, `ADMIN` roles
- Gate product creation/editing by role
- Scope queries by role permissions

### 10.3 Content Templates

**Enhancement:**
- Add template system for product generation
- Store templates in `contentJson` or separate `Template` model
- Allow users to customize prompt structure

---

## 11. API Reference

### 11.1 Identity Endpoints

**`POST /api/auth/verify`**
- Verifies Firebase token
- Returns: `{ firebaseId, email, displayName, photoUrl }`

**`GET /api/workme/me`**
- Returns: Full WorkMe identity with `companyUnit`, `companyDivision`

### 11.2 Content Ingestion Endpoints

**`POST /api/ingest/event/ai`**
- Parses raw event text with GPT
- Returns: `EventIngestionResponse`

**`POST /api/ingest/event/save`**
- Saves parsed event as `CompanyEvent`
- Returns: `{ success, eventId }`

**Similar patterns for:** Training, Career, Campaign, etc.

### 11.3 Product Endpoints

**`POST /api/workforce/enduring/email-digest`**
- Creates new `WorkForceEnduringProdEmailDigest`
- Returns: `{ success, product }`

**`POST /api/workforce/enduring/email-digest/[emailDigestId]/editions`**
- Generates new `EmailDigestEdition`
- Returns: `{ success, edition }`

**`GET /api/workforce/enduring/email-digest/[emailDigestId]/editions`**
- Lists all editions for a product
- Returns: `{ editions: EmailDigestEdition[] }`

---

## 12. Testing Patterns

### 12.1 Identity Testing

```typescript
// Mock verifyAuth
const mockVerifyAuth = jest.fn().mockResolvedValue({ firebaseId: 'test-id' })

// Mock loadWorkMe
const mockLoadWorkMe = jest.fn().mockResolvedValue({
  id: 'workme-id',
  companyUnit: 'test-unit',
  companyDivision: null,
})
```

### 12.2 Content Testing

```typescript
// Test CompanyX creation
const event = await prisma.companyEvent.create({
  data: {
    title: 'Test Event',
    companyUnit: 'test-unit',
    createdByWorkMeId: 'workme-id',
  },
})

expect(event.companyUnit).toBe('test-unit')
expect(event.createdByWorkMeId).toBe('workme-id')
```

### 12.3 Product Testing

```typescript
// Test product creation
const product = await createEmailDigestProduct({
  title: 'Test Digest',
  description: 'Test description',
})

expect(product.companyUnit).toBe('test-unit')
expect(product.createdByWorkMeId).toBe('workme-id')
```

---

## 13. Troubleshooting

### 13.1 Common Issues

**Issue:** "User must set a companyUnit"
- **Cause:** WorkMe record missing `companyUnit`
- **Fix:** User must complete setup flow to set `companyUnit`

**Issue:** "Property 'summary' does not exist"
- **Cause:** CompanyX model missing `summary` field
- **Fix:** Ensure all CompanyX models have `summary String?` in schema

**Issue:** "Property 'createdByWorkMeId' is missing"
- **Cause:** Creating domain object without actor identity
- **Fix:** Always include `createdByWorkMeId: workMeId` in create operations

**Issue:** "Access denied: not a member of this companyUnit"
- **Cause:** Querying data for different `companyUnit` than user's
- **Fix:** Ensure all queries are scoped by user's `companyUnit`

---

## 14. Summary

This architecture provides:

✅ **Clear Identity Chain:** Firebase → WorkMe → CompanyUnit  
✅ **Standardized Content:** All CompanyX models share consistent contract  
✅ **Explicit Products:** No polymorphism, clear models for each type  
✅ **Multi-Tenant Scoping:** `companyUnit` as universal routing key  
✅ **Clean Separation:** Identity, content, and products are distinct layers  
✅ **Maintainable:** Easy to extend with new product types or CompanyX models  
✅ **Type-Safe:** Prisma schema enforces structure at compile time  

**Next Steps:**
- Add new product types following the `EmailDigest` pattern
- Implement RBAC using `CompanyUnitMembers`
- Add content templates for product generation
- Build UI for product management and edition viewing

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-28  
**Maintained By:** WorkMe Engineering Team

