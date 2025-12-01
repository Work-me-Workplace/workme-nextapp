# WorkMe Architecture - Deep Dive

**Last Updated**: 2025-01-XX  
**Status**: Complete Architecture Reference

---

## 🎯 **EXECUTIVE SUMMARY**

WorkMe is a multi-tenant platform built on a **identity-first architecture** where:
- **WorkMe** = Universal personal identity container (WORKMEID)
- **companyUnit** = Multi-tenant routing key (required for all operations)
- **CompanyX Models** = Content ingestion layer (events, training, careers, etc.)
- **Products** = Generated outputs (email digests, etc.)

**Core Principle**: All operations flow through `Firebase Auth → WorkMe → companyUnit`

---

## 1. IDENTITY ARCHITECTURE

### 1.1 Identity Chain

```
┌─────────────────┐
│  Firebase Auth  │  (External - Google/Email)
└────────┬────────┘
         │ firebaseId
         ▼
┌─────────────────┐
│  verifyAuth()   │  (lib/server/verifyAuth.ts)
│  - Pure auth    │  Returns: { firebaseId, email, displayName, photoUrl }
└────────┬────────┘
         │ firebaseId
         ▼
┌─────────────────┐
│  loadWorkMe()   │  (lib/auth/loadWorkMe.ts)
│  - Identity     │  Returns: { id, companyUnit, companyDivision, ... }
└────────┬────────┘
         │ workMeId, companyUnit
         ▼
┌─────────────────┐
│  Business Logic │  (All API routes / server actions)
└─────────────────┘
```

### 1.2 WorkMe Model (Core Identity)

```prisma
model WorkMe {
  id              String   @id @default(uuid())
  firebaseId      String?  @unique
  email           String   @unique
  firstName       String?
  lastName        String?
  photoUrl        String?
  
  // ⚠️ CRITICAL: Multi-tenant scoping
  companyUnit     String?  // Required for WorkContext, collected AFTER signup
  companyDivision String?  // Optional grouping layer
  
  // Profile fields
  jobTitle    String?
  specialty   String?
  industry    String?
  jobRole     JobRole?
  salaryRange SalaryRange?
  
  createdAt   DateTime @default(now())
  
  // Relations
  workplaces             Workplace[]              // Link to companies
  companyUnitMemberships CompanyUnitMembers[]     // Unit membership with roles
  
  // Reverse relations (for Prisma validation only - NOT queried)
  originatedCommsOutputs       CommsOutput[]
  originatedObjectives         Objective[]
  originatedAchievements      Achievement[]
  createdWorkOutputStandalones WorkOutputStandalone[]
  createdEmailDigestProducts   WorkForceEnduringProdEmailDigest[]
  createdCompanyCampaigns      CompanyCampaign[]
  createdCompanyImpactEvents   CompanyImpactEvent[]
  createdCompanyTrainings      CompanyTraining[]
  createdCompanyEvents         CompanyEvent[]
  createdCompanyCommunities    CompanyCommunity[]
  createdCompanyCareers        CompanyCareer[]
}
```

**Key Points**:
- `firebaseId` = Link to Firebase Auth (unique)
- `email` = Unique identifier (can exist without firebaseId)
- `companyUnit` = **REQUIRED** for all multi-tenant operations
- `companyDivision` = Optional, only on WorkMe (not on domain objects)

### 1.3 Authentication Flow

**Every API Route Pattern**:
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
  
  // 4. Business Logic (scoped by companyUnit)
  const items = await prisma.companyX.findMany({
    where: { companyUnit }  // Always scope by companyUnit
  })
}
```

---

## 2. MULTI-TENANT ARCHITECTURE

### 2.1 Tenant Scoping Model

**Primary Key**: `companyUnit` (String)

**Rules**:
- All domain objects (CompanyX, Products, Editions) are scoped by `companyUnit`
- `companyUnit` is **required** for all multi-tenant operations
- `companyDivision` is **optional** and only exists on `WorkMe` (not on domain objects)

### 2.2 Company Models

#### Company (Independent Entity)
```prisma
model Company {
  id           String        @id @default(uuid())
  name         String        @unique  // Globally unique
  industry     String?
  website      String?
  // ... enrichment fields (Apollo.io)
  
  // Note: No direct relation to WorkMe
  // Users are scoped by companyUnit strings, not Company relations
}
```

**Purpose**: Enterprise-level metadata, enrichment data  
**Usage**: Directory lookup, company search, enrichment

#### CompanyRegistry (WorkConnect Anchor)
```prisma
model CompanyRegistry {
  id        String   @id @default(cuid())
  name      String
  domain    String?
  
  units      CompanyUnit[]    // Hierarchical units
  workplaces Workplace[]      // User-company links
}
```

**Purpose**: Global company-level anchor for WorkConnect

#### CompanyUnit (Hierarchical Structure)
```prisma
model CompanyUnit {
  id           String   @id @default(cuid())
  companyId    String   // References CompanyRegistry
  name         String
  unit         String   @unique  // Unique identifier for membership
  parentUnitId String?  // Allows parent → child nesting
  
  company    CompanyRegistry      @relation(...)
  parentUnit CompanyUnit?         @relation("UnitHierarchy", ...)
  subUnits   CompanyUnit[]        @relation("UnitHierarchy")
  members    CompanyUnitMembers[]
}
```

**Purpose**: Subdivision (HQ, directorates, departments) with hierarchical structure

#### CompanyUnitMembers (Junction Table)
```prisma
model CompanyUnitMembers {
  id          String          @id @default(uuid())
  workMeId    String
  companyUnit String          // References CompanyUnit.unit
  role        CompanyUnitRole @default(MEMBER)
  
  workMe WorkMe      @relation(...)
  unit   CompanyUnit @relation(...)
  
  @@unique([workMeId, companyUnit])
}
```

**Purpose**: Link WorkMe to CompanyUnit with role (MEMBER, MANAGER, ADMIN)

#### Workplace (User-Company Link)
```prisma
model Workplace {
  id        String   @id @default(cuid())
  workMeId  String
  companyId String   // References CompanyRegistry
  
  workMe  WorkMe          @relation(...)
  company CompanyRegistry @relation(...)
  
  @@unique([workMeId, companyId])
}
```

**Purpose**: Link between a user (WORKMEID) and a specific company

### 2.3 Multi-Tenant Query Pattern

**All queries scoped by companyUnit**:
```typescript
// ✅ Correct
const items = await prisma.companyEvent.findMany({
  where: { companyUnit }  // Always scope by companyUnit
})

// ❌ Wrong - no scoping
const items = await prisma.companyEvent.findMany()  // Returns all tenants!
```

**Indexing**:
- All CompanyX models have `@@index([companyUnit])`
- All product models have `@@index([companyUnit])`
- Enables fast tenant-scoped queries

---

## 3. CONTENT INGESTION LAYER (CompanyX Models)

### 3.1 Standardized CompanyX Contract

**All CompanyX models follow this contract**:

```prisma
model CompanyX {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  
  // Core Content
  title       String
  description String?
  
  // Standardized Fields (REQUIRED)
  summary String?              // AI-synthesized paragraph (for EmailDigest)
  companyUnit String?          // Multi-tenant routing key
  createdByWorkMeId String     // Actor identity (required)
  
  // Relations
  createdBy WorkMe @relation(...)
  
  // Model-specific fields
  // ... (POC, dates, metadata, etc.)
  
  @@index([companyUnit])
  @@index([createdByWorkMeId])
}
```

### 3.2 CompanyX Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `CompanyCampaign` | Marketing campaigns | `windowStart`, `windowEnd`, `ctaLink`, `sponsor` |
| `CompanyImpactEvent` | Organizational impact events | `effectiveDate`, `impactedPopulation`, `urgency` |
| `CompanyTraining` | Training opportunities | `trainingDate`, `startTime`, `endTime`, `mandatory`, `location`, `format` |
| `CompanyEvent` | Social/company events | `eventDate`, `eventCategory`, `audience`, `vibe`, `perks` |
| `CompanyCommunity` | Community initiatives | `partnerOrg`, `date`, `location`, `signUpLink` |
| `CompanyBenefits` | Employee benefits | `windowStart`, `windowEnd`, `deadlines`, `actionLink`, `resources` |
| `CompanyCareer` | Career opportunities | `level`, `type`, `eligibility`, `application`, `extras` |
| `CompanyEmployeeCause` | Employee-driven causes | `partnerOrg`, `sponsoringDepartment`, `windowStart`, `windowEnd`, `locations` |

**Key Fields (All Models)**:
- `summary String?` - **Required for all models** (standardized contract)
- `companyUnit String?` - Multi-tenant scoping
- `createdByWorkMeId String` - Actor identity (required)
- Model-specific fields (POC, dates, metadata, etc.)

### 3.3 Content Ingestion Flow

```
User Input → AI Parsing → Normalization → CompanyX Creation
```

**Example: Event Ingestion**
1. User submits raw text → `POST /api/ingest/event/ai`
2. GPT parses and structures → `EventIngestionResponse`
3. Normalize with `normalizeGPTIngestionOutput()` → `NormalizedEventData`
4. Create `CompanyEvent` with `createdByWorkMeId` and `companyUnit`
5. Create related `EventItem` records

---

## 4. PRODUCT GENERATION LAYER

### 4.1 Product Architecture

**Principle**: Explicit models for each product type (no polymorphism)

**Current Products**:
- `WorkForceEnduringProdEmailDigest` - Email digest product
- `EmailDigestEdition` - Individual digest editions

### 4.2 Product Models

#### WorkForceEnduringProdEmailDigest
```prisma
model WorkForceEnduringProdEmailDigest {
  id                String   @id @default(uuid())
  title             String
  description       String?
  companyUnit       String   // Required
  createdByWorkMeId String   // Required
  createdAt         DateTime @default(now())
  
  createdBy WorkMe @relation("EmailDigestProductCreator", ...)
  editions  EmailDigestEdition[]
  
  @@index([companyUnit])
  @@index([createdByWorkMeId])
}
```

**Purpose**: Represents a reusable email digest product configuration

#### EmailDigestEdition
```prisma
model EmailDigestEdition {
  id            String   @id @default(uuid())
  emailDigestId String   // Explicit FK (not generic productId)
  product       WorkForceEnduringProdEmailDigest @relation(...)
  
  contentJson   Json     // Flexible structure
  generatedAt   DateTime @default(now())
  originatorId  String   // Attribution
  companyUnit   String   // Required
  
  @@index([emailDigestId])
  @@index([companyUnit])
  @@index([generatedAt])
}
```

**Purpose**: Individual generated edition of an email digest

**Key Design Decisions**:
- **Explicit FK**: `emailDigestId` (not generic `productId`)
- **No Polymorphism**: Each product type has its own model
- **Content Storage**: `contentJson` for flexible structure
- **Originator Tracking**: `originatorId` for attribution

### 4.3 Product Generation Flow

```
User Creates Product → Select CompanyX Items → Generate Edition → Store Edition
```

**Edition Generation Process**:
1. Verify auth → Load WorkMe → Get `companyUnit`
2. Query CompanyX models for `companyUnit`
3. Extract `summary` fields from CompanyX items
4. Build prompt with CompanyX summaries
5. Send to OpenAI for content generation
6. Save `EmailDigestEdition` with `contentJson`

---

## 5. DATA FLOW PATTERNS

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
        companyUnit,              // ⚠️ Always include
        createdByWorkMeId: workMeId,  // ⚠️ Always include
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
      where: { companyUnit },  // ⚠️ Tenant scoping
      select: { id, title, description, summary, ... }
    })
```

---

## 6. RELATIONSHIPS DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE AUTH                            │
│                  (External Provider)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │ firebaseId
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      WORKME                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ id: uuid                                              │  │
│  │ firebaseId: string (unique)                          │  │
│  │ email: string (unique)                                │  │
│  │ companyUnit: string?  ⚠️ REQUIRED                    │  │
│  │ companyDivision: string? (optional)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────┬─────────────────────────────────────────────────┘
            │
            ├───► CompanyUnitMembers ──► CompanyUnit
            │
            ├───► Workplace ──► CompanyRegistry
            │
            ├───► createdCompanyCampaigns ──► CompanyCampaign
            ├───► createdCompanyImpactEvents ──► CompanyImpactEvent
            ├───► createdCompanyTrainings ──► CompanyTraining
            ├───► createdCompanyEvents ──► CompanyEvent
            ├───► createdCompanyCommunities ──► CompanyCommunity
            ├───► createdCompanyCareers ──► CompanyCareer
            │
            └───► createdEmailDigestProducts ──► WorkForceEnduringProdEmailDigest
                                                  └───► EmailDigestEdition

┌─────────────────────────────────────────────────────────────┐
│                    COMPANY (Directory)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ id: uuid                                              │  │
│  │ name: string (unique globally)                        │  │
│  │ industry, website, etc.                               │  │
│  │ (Apollo enrichment fields)                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  Note: Independent entity, no direct relation to WorkMe    │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. KEY DESIGN DECISIONS

### 7.1 Identity Separation

**Decision**: `verifyAuth` is auth-only; `loadWorkMe` handles identity.

**Rationale**:
- Clear separation of concerns
- Prevents circular dependencies
- Makes identity loading explicit and testable

### 7.2 Explicit Product Models

**Decision**: Each product type has its own model (no polymorphism).

**Rationale**:
- Type safety
- Clear schema
- Easy to extend with new product types
- No confusion about generic `productId` fields

### 7.3 Standardized CompanyX Contract

**Decision**: All CompanyX models have `summary`, `companyUnit`, `createdByWorkMeId`.

**Rationale**:
- Consistent querying for product generation
- Predictable data structure
- Easy to extend with new CompanyX types

### 7.4 companyUnit-Only Scoping

**Decision**: `companyDivision` removed from all domain objects; only on `WorkMe`.

**Rationale**:
- Simpler multi-tenant model
- Clearer routing logic
- Easier to reason about access control

### 7.5 Explicit Foreign Keys

**Decision**: Use explicit FK names like `emailDigestId` (not generic `productId`).

**Rationale**:
- Self-documenting schema
- Type-safe relations
- No ambiguity about what a FK references

---

## 8. FILE STRUCTURE

### 8.1 Core Identity Files

```
lib/
  server/
    verifyAuth.ts          # Firebase auth only
  auth/
    loadWorkMe.ts          # WorkMe identity loader
```

### 8.2 Content Ingestion Files

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

### 8.3 Product Files

```
lib/
  actions/
    email-digest.ts        # Email digest product actions
app/
  workforce/
    enduring/
      email-digest/        # Email digest UI pages
```

---

## 9. API REFERENCE

### 9.1 Identity Endpoints

**`POST /api/workme/create`**
- Creates/finds WorkMe from Firebase auth
- Returns: `{ success, workMe }`

**`GET /api/workme/profile`**
- Returns: Full WorkMe identity with `companyUnit`, `companyDivision`

**`GET /api/workme/hydrate`**
- Returns: Full WorkMe data for client hydration

### 9.2 Content Ingestion Endpoints

**`POST /api/ingest/event/ai`**
- Parses raw event text with GPT
- Returns: `EventIngestionResponse`

**`POST /api/ingest/event/save`**
- Saves parsed event as `CompanyEvent`
- Returns: `{ success, eventId }`

**Similar patterns for**: Training, Career, Campaign, etc.

### 9.3 Product Endpoints

**`POST /api/workforce/enduring/email-digest`**
- Creates new `WorkForceEnduringProdEmailDigest`
- Returns: `{ success, product }`

**`POST /api/workforce/enduring/email-digest/[emailDigestId]/editions`**
- Generates new `EmailDigestEdition`
- Returns: `{ success, edition }`

---

## 10. SUMMARY

This architecture provides:

✅ **Clear Identity Chain**: Firebase → WorkMe → CompanyUnit  
✅ **Standardized Content**: All CompanyX models share consistent contract  
✅ **Explicit Products**: No polymorphism, clear models for each type  
✅ **Multi-Tenant Scoping**: `companyUnit` as universal routing key  
✅ **Clean Separation**: Identity, content, and products are distinct layers  
✅ **Maintainable**: Easy to extend with new product types or CompanyX models  
✅ **Type-Safe**: Prisma schema enforces structure at compile time  

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Maintained By**: WorkMe Engineering Team

