# WorkMe Architecture - Deep Dive

**Last Updated**: 2025-01-XX  
**Status**: Complete Architecture Reference

---

## 🎯 **EXECUTIVE SUMMARY**

WorkMe is a multi-tenant platform built on a **identity-first architecture** with clean separation:

- **WorkMe** = Universal personal identity container (WORKMEID) - Pure identity only
- **WorkProfile** = Personal identity (firstName, lastName, headline, handle, linkedinUrl) - Like GoFast Athlete profile
- **WorkEntry** = Work history (employment data) - Links WorkMe to CompanyUnit
- **CompanyUnit** = Searchable registry (like RaceRegistry) - Employer/company registry
- **CompanyX Models** = Content ingestion layer (events, training, careers, etc.)
- **Products** = Generated outputs (email digests, etc.)

**Core Principle**: Clean separation - Profile (personal identity) vs MyWork (employment history) vs CompanyUnit (registry)

**Architecture Pattern**: Mirrors GoFast modularity - Profile is pure identity, WorkEntry is bolt-on module

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

### 1.2 WorkMe Model (Pure Identity Container)

```prisma
model WorkMe {
  id              String   @id @default(uuid())
  firebaseId      String?  @unique
  email           String   @unique
  createdAt       DateTime @default(now())
  
  // Relations
  profile WorkProfile?        // One-to-one: Personal identity
  workEntries WorkEntry[]      // One-to-many: Work history
  
  workplaces             Workplace[]              // Link to companies (WorkWorld)
  companyUnitMemberships CompanyUnitMembers[]     // Unit membership with roles (WorkWorld)
  
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
- **Pure Identity Only** - No profile fields, no employment data
- Profile data → `WorkProfile` model
- Employment data → `WorkEntry` model

### 1.3 WorkProfile Model (Personal Identity)

```prisma
model WorkProfile {
  id           String   @id @default(cuid())
  userId       String   @unique // References WorkMe.id
  firstName    String?
  lastName     String?
  headline     String?  // LinkedIn-style headline
  currentRole  String?  // Optional current role display
  handle       String   @unique // Unique username for future "Connect" features
  linkedinUrl  String?
  profileImage String?  // Profile photo URL
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  user WorkMe @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Key Points**:
- **Personal Identity Only** - No employment data
- Mirrors GoFast Athlete profile pattern
- `handle` = Unique username (auto-generated on signup)
- `headline` = LinkedIn-style professional headline
- No specialties, no job metadata, no work skills here

### 1.4 WorkEntry Model (Work History)

```prisma
model WorkEntry {
  id            String      @id @default(cuid())
  userId        String      // References WorkMe.id
  companyUnitId String      // References CompanyUnit.id
  division      String?     // Simple string for MVP1 (team, department, etc.)
  title         String?     // Job title
  startDate     DateTime?   // Employment start date
  endDate       DateTime?   // Employment end date (null = current)
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  user        WorkMe       @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyUnit CompanyUnit  @relation(fields: [companyUnitId], references: [id], onDelete: Cascade)
}
```

**Key Points**:
- **Employment Data Only** - Links WorkMe to CompanyUnit
- Each WorkMe can have multiple WorkEntries (current + past jobs)
- `division` = Simple string for MVP1 (can be normalized later)
- `endDate = null` = Current job

### 1.5 CompanyUnit Model (Registry Pattern)

```prisma
model CompanyUnit {
  id        String      @id @default(cuid())
  name      String      @unique // Company/employer name (unique globally)
  domain    String?     // Optional domain for matching
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  
  workEntries WorkEntry[]
  
  @@index([name])
  @@index([domain])
}
```

**Key Points**:
- **Registry Pattern** - Like RaceRegistry in GoFast
- Searchable by name (case-insensitive)
- Search-before-create pattern (if exists, return; if not, create)
- Public registry - no ownership required

### 1.6 Authentication Flow

**Every API Route Pattern**:
```typescript
export async function POST(request: Request) {
  // 1. Auth
  const { firebaseId } = await verifyAuth(request)
  
  // 2. Load WorkMe Identity
  const workMe = await loadWorkMe(firebaseId)
  const { id: workMeId } = workMe
  
  // 3. Business Logic
  // For multi-tenant operations, get companyUnit from WorkEntry (current job)
  const currentWorkEntry = await prisma.workEntry.findFirst({
    where: { 
      userId: workMeId,
      endDate: null // Current job
    },
    include: { companyUnit: true }
  })
  
  const companyUnit = currentWorkEntry?.companyUnit.name
  
  // 4. Business Logic (scoped by companyUnit)
  const items = await prisma.companyX.findMany({
    where: { companyUnit }  // Always scope by companyUnit
  })
}
```

---

## 2. MULTI-TENANT ARCHITECTURE

### 2.1 Tenant Scoping Model

**Primary Key**: `companyUnit` (String from CompanyUnit registry)

**Rules**:
- All domain objects (CompanyX, Products, Editions) are scoped by `companyUnit`
- `companyUnit` comes from `WorkEntry.companyUnit.name` (current job)
- `companyUnit` is **required** for all multi-tenant operations
- `division` is **optional** and only exists on `WorkEntry` (not on domain objects)

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

#### CompanyUnit (Registry - Simple MVP1)

**Purpose**: Searchable employer/company registry (like RaceRegistry)

**Pattern**: Search-before-create
- User types employer name → Search CompanyUnit
- If exists → Return existing
- If not → Create new

**Usage**: Links WorkMe to employers via WorkEntry

**Note**: For hierarchical org structure (WorkWorld/WorkConnect), see `CompanyUnitHierarchy` model below

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
- Returns: WorkProfile (personal identity only)
- Fields: firstName, lastName, headline, currentRole, handle, linkedinUrl, profileImage

**`PUT /api/workme/profile`**
- Updates WorkProfile fields
- Validates handle uniqueness
- Auto-generates handle if not provided

**`GET /api/workme/hydrate`**
- Returns: Full WorkMe data for client hydration

### 9.2 Company Unit Registry Endpoints

**`POST /api/company-unit/search`**
- Search company units by name (case-insensitive)
- Public search - no auth required
- Returns: `{ success, companyUnits: [...] }`

**`POST /api/company-unit/create`**
- Create company unit in registry (search-before-create pattern)
- If exists, returns existing; if not, creates new
- Returns: `{ success, companyUnit }`

### 9.3 Work Entry Endpoints

**`POST /api/work-entry/create`**
- Create work entry (employment history)
- Links WorkMe to CompanyUnit
- Fields: companyUnitId, division?, title?, startDate?, endDate?
- Returns: `{ success, workEntry }`

**`GET /api/work-entry/list`**
- Get all work entries for current authenticated user
- Returns current + past jobs
- Ordered by: endDate DESC (current first), startDate DESC
- Returns: `{ success, workEntries: [...] }`

### 9.4 Content Ingestion Endpoints

**`POST /api/ingest/event/ai`**
- Parses raw event text with GPT
- Returns: `EventIngestionResponse`

**`POST /api/ingest/event/save`**
- Saves parsed event as `CompanyEvent`
- Returns: `{ success, eventId }`

**Similar patterns for**: Training, Career, Campaign, etc.

### 9.5 Product Endpoints

**`POST /api/workforce/enduring/email-digest`**
- Creates new `WorkForceEnduringProdEmailDigest`
- Returns: `{ success, product }`

**`POST /api/workforce/enduring/email-digest/[emailDigestId]/editions`**
- Generates new `EmailDigestEdition`
- Returns: `{ success, edition }`

---

## 10. SUMMARY

This architecture provides:

✅ **Clean Identity Separation**: WorkMe (pure identity) → WorkProfile (personal) → WorkEntry (employment)  
✅ **Registry Pattern**: CompanyUnit registry (like RaceRegistry) - search-before-create  
✅ **Modular Design**: Mirrors GoFast - Profile is pure identity, WorkEntry is bolt-on module  
✅ **Standardized Content**: All CompanyX models share consistent contract  
✅ **Explicit Products**: No polymorphism, clear models for each type  
✅ **Multi-Tenant Scoping**: `companyUnit` from WorkEntry (current job)  
✅ **Clean Separation**: Profile (personal identity) vs MyWork (employment history) vs CompanyUnit (registry)  
✅ **Maintainable**: Easy to extend with new product types or CompanyX models  
✅ **Type-Safe**: Prisma schema enforces structure at compile time  
✅ **Future-Proof**: Handle field ready for "Connect" features, division can be normalized later

## 11. REFACTOR SUMMARY (MVP1)

### What Changed

**Before**:
- WorkMe had mixed concerns: identity + profile + employment data
- CompanyUnit was a foreign key mess
- No clear separation between personal identity and work history

**After**:
- WorkMe = Pure identity container only
- WorkProfile = Personal identity (firstName, lastName, headline, handle, linkedinUrl)
- WorkEntry = Employment history (links WorkMe to CompanyUnit)
- CompanyUnit = Searchable registry (like RaceRegistry pattern)

### Migration Notes

- Old `jobTitle`, `specialty`, `industry`, `jobRole`, `salaryRange` fields removed from WorkMe
- Employment data now stored in WorkEntry
- CompanyUnit is now a registry (search-before-create pattern)
- Profile setup flow: firstName, lastName, headline, currentRole, handle, linkedinUrl
- Work setup flow: Search/create CompanyUnit → Create WorkEntry with division, title, dates  

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Maintained By**: WorkMe Engineering Team

