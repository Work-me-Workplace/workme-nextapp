# Company Models Architecture Audit

**Date:** 2025-01-28  
**Purpose:** Complete read-only audit of all Prisma models beginning with "Company"  
**Status:** ✅ Audit Complete

---

## Executive Summary

This audit examines **8 content models** and **1 junction table** that begin with "Company" to verify compliance with the architecture. Additionally, **4 non-content models** (Company, CompanyRegistry, CompanyUnit, CompanyRole) are noted as correctly structured and excluded from detailed analysis.

1. **Pure Content Models** should have NO `workMeId`, NO `companyUnit`, NO `companyDivision`
2. **Ingestion Tables** (CompanyXIngestion) should have `workMeId` (REQUIRED) + `companyUnit` (REQUIRED), but NO `companyDivision`
3. **WorkMeCompanyUnit** junction table is the ONLY place where `workMeId`, `companyUnit`, and `companyDivision` appear together

**Critical Finding:** ❌ **ALL CompanyX content models currently violate the architecture** - they contain `companyUnit` and `companyDivision` fields that should NOT be present in pure content models.

**Ingestion Models Status:** ⚠️ **NO CompanyXIngestion models exist** - ingestion context is currently stored directly in content models (incorrect architecture).

---

## Architecture Rules Reference

### Rule 1: Pure Content Models (CompanyX)
- ✅ **MUST HAVE:** Content fields only (title, description, dates, POC, etc.)
- ❌ **MUST NOT HAVE:** `workMeId`, `companyUnit`, `companyDivision`
- **Purpose:** Store pure content that can be referenced by multiple contexts

### Rule 2: Ingestion Models (CompanyXIngestion)
- ✅ **MUST HAVE:** `workMeId` (REQUIRED), `companyUnit` (REQUIRED)
- ❌ **MUST NOT HAVE:** `companyDivision`
- **Purpose:** Track who ingested what content and from which company unit
- **Relation:** References CompanyX content via foreign key

### Rule 3: WorkMeCompanyUnit Junction Table
- ✅ **MUST HAVE:** `workMeId`, `companyUnit`, `companyDivision`
- **Purpose:** User metadata - which users belong to which units/divisions

---

## Non-Content Models (Correctly Structured - Excluded from Detailed Analysis)

The following models beginning with "Company" are **NOT content models** and are correctly structured according to their purpose:

### Company (Independent Entity)
- **Purpose:** Enterprise-level metadata registry
- **Status:** ✅ Correctly structured
- **Note:** This is an independent entity, not a content model. It does not contain identity fields and is not part of the ingestion architecture.

### CompanyRegistry (WorkWorld Architecture)
- **Purpose:** Global company-level anchor for WorkConnect
- **Status:** ✅ Correctly structured
- **Note:** Part of WorkWorld architecture, references CompanyUnit via `companyId` (different from content model `companyUnit` string field).

### CompanyUnit (WorkWorld Architecture)
- **Purpose:** Subdivision (HQ, directorates, departments) with hierarchical structure
- **Status:** ✅ Correctly structured
- **Note:** Part of WorkWorld architecture, has `companyId` referencing CompanyRegistry (different from content model `companyUnit` string field).

### CompanyRole (WorkWorld Architecture)
- **Purpose:** Defines permissions inside a company or unit
- **Status:** ✅ Correctly structured
- **Note:** Part of WorkWorld architecture, links to Workplace model.

---

## 1. CompanyCampaign

### A. Raw Prisma Model Definition

```prisma
model CompanyCampaign {
  id           String    @id @default(cuid())
  createdAt    DateTime  @default(now())
  title        String
  description  String?
  windowStart  DateTime?
  windowEnd    DateTime?
  ctaLink      String?
  sponsor      String?
  pocFirstName String?
  pocLastName  String?
  pocEmail     String?
  pocPhone     String?

  companyUnit     String?
  companyDivision String?

  links CompanyWorkLink[]

  @@index([companyUnit])
}
```

### B. Model Classification

**Type:** ❌ **Incorrectly Structured** - Pure content model with identity fields

**Should Be:** Pure content model (no identity fields)

**Currently Has:** `companyUnit`, `companyDivision` (should NOT be here)

### C. Field Analysis

| Field | Purpose | Required/Optional | NTK Needs | Misplaced? |
|-------|---------|-------------------|-----------|------------|
| `id` | Primary key | Required | ✅ Yes | ❌ No |
| `createdAt` | Timestamp | Required | ✅ Yes | ❌ No |
| `title` | Campaign title | Required | ✅ Yes | ❌ No |
| `description` | Campaign description | Optional | ✅ Yes | ❌ No |
| `windowStart` | Campaign start date | Optional | ✅ Yes | ❌ No |
| `windowEnd` | Campaign end date | Optional | ✅ Yes | ❌ No |
| `ctaLink` | Call-to-action link | Optional | ✅ Yes | ❌ No |
| `sponsor` | Sponsor name | Optional | ✅ Yes | ❌ No |
| `pocFirstName` | POC first name | Optional | ✅ Yes | ❌ No |
| `pocLastName` | POC last name | Optional | ✅ Yes | ❌ No |
| `pocEmail` | POC email | Optional | ✅ Yes | ❌ No |
| `pocPhone` | POC phone | Optional | ✅ Yes | ❌ No |
| `companyUnit` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in ingestion table** |
| `companyDivision` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in junction table only** |
| `links` | Junction relation | Optional | ✅ Yes | ❌ No |

### D. Architecture Compliance Check

- ❌ **Violates Rule 1:** Contains `companyUnit` and `companyDivision` (identity fields in pure content model)
- ❌ **Missing:** No `CompanyCampaignIngestion` model to track ingestion context
- ✅ **Correct:** Content fields are appropriate for NTK generation

### E. NTK Readiness Score: **7/10**

**Strengths:**
- ✅ Has all core content fields (title, description, dates, POC)
- ✅ Has window dates for deadline tracking
- ✅ Has CTA link for action items

**Weaknesses:**
- ❌ Identity fields pollute pure content model
- ❌ No ingestion tracking model
- ⚠️ Missing urgency/priority field

### F. Recommended Surgical Fixes

1. **Remove identity fields from CompanyCampaign:**
   ```prisma
   // REMOVE:
   companyUnit     String?
   companyDivision String?
   @@index([companyUnit])
   ```

2. **Create CompanyCampaignIngestion model:**
   ```prisma
   model CompanyCampaignIngestion {
     id           String   @id @default(cuid())
     campaignId   String
     campaign     CompanyCampaign @relation(...)
     workMeId     String   // REQUIRED
     companyUnit  String   // REQUIRED
     ingestedAt   DateTime @default(now())
     
     @@index([workMeId])
     @@index([companyUnit])
     @@index([campaignId])
   }
   ```

---

## 2. CompanyImpactEvent

### A. Raw Prisma Model Definition

```prisma
model CompanyImpactEvent {
  id                 String    @id @default(cuid())
  createdAt          DateTime  @default(now())
  title              String
  description        String?
  effectiveDate      DateTime?
  impactedPopulation String?
  urgency            String?
  pocFirstName       String?
  pocLastName        String?
  pocEmail           String?
  pocPhone           String?

  companyUnit     String?
  companyDivision String?

  links CompanyWorkLink[]

  @@index([companyUnit])
}
```

### B. Model Classification

**Type:** ❌ **Incorrectly Structured** - Pure content model with identity fields

**Should Be:** Pure content model (no identity fields)

**Currently Has:** `companyUnit`, `companyDivision` (should NOT be here)

### C. Field Analysis

| Field | Purpose | Required/Optional | NTK Needs | Misplaced? |
|-------|---------|-------------------|-----------|------------|
| `id` | Primary key | Required | ✅ Yes | ❌ No |
| `createdAt` | Timestamp | Required | ✅ Yes | ❌ No |
| `title` | Impact event title | Required | ✅ Yes | ❌ No |
| `description` | Impact event description | Optional | ✅ Yes | ❌ No |
| `effectiveDate` | When impact takes effect | Optional | ✅ Yes | ❌ No |
| `impactedPopulation` | Who is affected | Optional | ✅ Yes | ❌ No |
| `urgency` | Urgency level | Optional | ✅ Yes | ❌ No |
| `pocFirstName` | POC first name | Optional | ✅ Yes | ❌ No |
| `pocLastName` | POC last name | Optional | ✅ Yes | ❌ No |
| `pocEmail` | POC email | Optional | ✅ Yes | ❌ No |
| `pocPhone` | POC phone | Optional | ✅ Yes | ❌ No |
| `companyUnit` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in ingestion table** |
| `companyDivision` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in junction table only** |
| `links` | Junction relation | Optional | ✅ Yes | ❌ No |

### D. Architecture Compliance Check

- ❌ **Violates Rule 1:** Contains `companyUnit` and `companyDivision` (identity fields in pure content model)
- ❌ **Missing:** No `CompanyImpactEventIngestion` model to track ingestion context
- ✅ **Correct:** Content fields are appropriate for NTK generation
- ✅ **Good:** Has `urgency` field which is valuable for NTK

### E. NTK Readiness Score: **8/10**

**Strengths:**
- ✅ Has all core content fields
- ✅ Has `urgency` field (valuable for NTK prioritization)
- ✅ Has `effectiveDate` for deadline tracking
- ✅ Has `impactedPopulation` for audience targeting

**Weaknesses:**
- ❌ Identity fields pollute pure content model
- ❌ No ingestion tracking model

### F. Recommended Surgical Fixes

1. **Remove identity fields from CompanyImpactEvent:**
   ```prisma
   // REMOVE:
   companyUnit     String?
   companyDivision String?
   @@index([companyUnit])
   ```

2. **Create CompanyImpactEventIngestion model:**
   ```prisma
   model CompanyImpactEventIngestion {
     id              String   @id @default(cuid())
     impactEventId   String
     impactEvent     CompanyImpactEvent @relation(...)
     workMeId        String   // REQUIRED
     companyUnit     String   // REQUIRED
     ingestedAt      DateTime @default(now())
     
     @@index([workMeId])
     @@index([companyUnit])
     @@index([impactEventId])
   }
   ```

---

## 3. CompanyTraining

### A. Raw Prisma Model Definition

```prisma
model CompanyTraining {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  // Core
  title            String?
  topic            String?
  description      String?
  mandatory        Boolean @default(false)
  sponsoringOffice String?

  // Date / Time
  trainingDate DateTime?
  startTime    String?
  endTime      String?

  // Format / Location
  location String?
  format   String?
  link     String?

  // POC
  pocFirstName   String?
  pocLastName    String?
  pocEmail       String?
  pocPhone       String?
  pocRankOrTitle String?

  // Stage 1 Ingest Snapshot
  ingestRawText   String?
  ingestType      String?
  ingestStatus    String?   @default("pending")
  ingestCreatedAt DateTime? @default(now())

  // Relations
  companyUnit     String?
  companyDivision String?

  links CompanyWorkLink[]

  @@index([companyUnit])
}
```

### B. Model Classification

**Type:** ❌ **Incorrectly Structured** - Hybrid model mixing content + ingestion + identity

**Should Be:** 
- Pure content model (CompanyTraining) - content fields only
- Separate ingestion model (CompanyTrainingIngestion) - ingestion context

**Currently Has:** 
- Content fields ✅
- Ingestion fields (ingestRawText, ingestType, ingestStatus, ingestCreatedAt) ⚠️ **Should be in ingestion model**
- Identity fields (companyUnit, companyDivision) ❌ **Should be in ingestion model**

### C. Field Analysis

| Field | Purpose | Required/Optional | NTK Needs | Misplaced? |
|-------|---------|-------------------|-----------|------------|
| `id` | Primary key | Required | ✅ Yes | ❌ No |
| `createdAt` | Timestamp | Required | ✅ Yes | ❌ No |
| `title` | Training title | Optional | ✅ Yes | ❌ No |
| `topic` | Training topic | Optional | ✅ Yes | ❌ No |
| `description` | Training description | Optional | ✅ Yes | ❌ No |
| `mandatory` | Is training mandatory | Optional | ✅ Yes | ❌ No |
| `sponsoringOffice` | Sponsor office | Optional | ✅ Yes | ❌ No |
| `trainingDate` | Training date | Optional | ✅ Yes | ❌ No |
| `startTime` | Start time | Optional | ✅ Yes | ❌ No |
| `endTime` | End time | Optional | ✅ Yes | ❌ No |
| `location` | Training location | Optional | ✅ Yes | ❌ No |
| `format` | Training format | Optional | ✅ Yes | ❌ No |
| `link` | Registration link | Optional | ✅ Yes | ❌ No |
| `pocFirstName` | POC first name | Optional | ✅ Yes | ❌ No |
| `pocLastName` | POC last name | Optional | ✅ Yes | ❌ No |
| `pocEmail` | POC email | Optional | ✅ Yes | ❌ No |
| `pocPhone` | POC phone | Optional | ✅ Yes | ❌ No |
| `pocRankOrTitle` | POC rank/title | Optional | ✅ Yes | ❌ No |
| `ingestRawText` | **Ingestion field** | Optional | ❌ No | ✅ **YES - Should be in ingestion model** |
| `ingestType` | **Ingestion field** | Optional | ❌ No | ✅ **YES - Should be in ingestion model** |
| `ingestStatus` | **Ingestion field** | Optional | ❌ No | ✅ **YES - Should be in ingestion model** |
| `ingestCreatedAt` | **Ingestion field** | Optional | ❌ No | ✅ **YES - Should be in ingestion model** |
| `companyUnit` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in ingestion model** |
| `companyDivision` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in junction table only** |
| `links` | Junction relation | Optional | ✅ Yes | ❌ No |

### D. Architecture Compliance Check

- ❌ **Violates Rule 1:** Contains `companyUnit` and `companyDivision` (identity fields in pure content model)
- ❌ **Violates Rule 2:** Ingestion fields (`ingestRawText`, `ingestType`, `ingestStatus`, `ingestCreatedAt`) are in content model instead of ingestion model
- ❌ **Missing:** No `CompanyTrainingIngestion` model to track ingestion context
- ✅ **Correct:** Content fields are comprehensive and appropriate for NTK generation

### E. NTK Readiness Score: **9/10**

**Strengths:**
- ✅ Comprehensive content fields (title, description, dates, times, location, format)
- ✅ Has POC information with rank/title
- ✅ Has mandatory flag (important for NTK)
- ✅ Has registration link
- ✅ Has sponsoring office

**Weaknesses:**
- ❌ Identity and ingestion fields pollute pure content model
- ❌ No ingestion tracking model

### F. Recommended Surgical Fixes

1. **Remove identity and ingestion fields from CompanyTraining:**
   ```prisma
   // REMOVE:
   ingestRawText   String?
   ingestType      String?
   ingestStatus    String?   @default("pending")
   ingestCreatedAt DateTime? @default(now())
   companyUnit     String?
   companyDivision String?
   @@index([companyUnit])
   ```

2. **Create CompanyTrainingIngestion model:**
   ```prisma
   model CompanyTrainingIngestion {
     id              String   @id @default(cuid())
     trainingId      String
     training        CompanyTraining @relation(...)
     workMeId        String   // REQUIRED
     companyUnit     String   // REQUIRED
     ingestRawText   String?
     ingestType      String?
     ingestStatus    String?  @default("pending")
     ingestedAt      DateTime @default(now())
     
     @@index([workMeId])
     @@index([companyUnit])
     @@index([trainingId])
   }
   ```

---

## 4. CompanyEvent

### A. Raw Prisma Model Definition

```prisma
model CompanyEvent {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Core identity
  title       String
  theme       String? // NEW (tagline / theme)
  description String?

  // Timing
  eventDate DateTime?
  startTime String?
  endTime   String?

  // Category (enum)
  eventCategory EventCategory?

  // Registration
  registrationRequired String?
  registrationLink     String?

  // Highlights extracted from GPT
  audience      EventAudience?
  vibe          String?
  perks         String[]       @default([])
  participation String[]       @default([])

  // Food
  foodProvided String?
  foodTypes    String?

  // Speaker + POC
  speakers String[] @default([])
  pocEmail String?
  pocPhone String?

  companyUnit     String?
  companyDivision String?

  // Relations
  eventItems EventItem[]
  links      CompanyWorkLink[]

  @@index([companyUnit])
}
```

### B. Model Classification

**Type:** ❌ **Incorrectly Structured** - Pure content model with identity fields

**Should Be:** Pure content model (no identity fields)

**Currently Has:** `companyUnit`, `companyDivision` (should NOT be here)

### C. Field Analysis

| Field | Purpose | Required/Optional | NTK Needs | Misplaced? |
|-------|---------|-------------------|-----------|------------|
| `id` | Primary key | Required | ✅ Yes | ❌ No |
| `createdAt` | Timestamp | Required | ✅ Yes | ❌ No |
| `updatedAt` | Timestamp | Required | ✅ Yes | ❌ No |
| `title` | Event title | Required | ✅ Yes | ❌ No |
| `theme` | Event theme/tagline | Optional | ✅ Yes | ❌ No |
| `description` | Event description | Optional | ✅ Yes | ❌ No |
| `eventDate` | Event date | Optional | ✅ Yes | ❌ No |
| `startTime` | Start time | Optional | ✅ Yes | ❌ No |
| `endTime` | End time | Optional | ✅ Yes | ❌ No |
| `eventCategory` | Event category enum | Optional | ✅ Yes | ❌ No |
| `registrationRequired` | Registration requirement | Optional | ✅ Yes | ❌ No |
| `registrationLink` | Registration link | Optional | ✅ Yes | ❌ No |
| `audience` | Event audience enum | Optional | ✅ Yes | ❌ No |
| `vibe` | Event vibe/atmosphere | Optional | ✅ Yes | ❌ No |
| `perks` | Event perks array | Optional | ✅ Yes | ❌ No |
| `participation` | Participation types | Optional | ✅ Yes | ❌ No |
| `foodProvided` | Food availability | Optional | ✅ Yes | ❌ No |
| `foodTypes` | Types of food | Optional | ✅ Yes | ❌ No |
| `speakers` | Speakers array | Optional | ✅ Yes | ❌ No |
| `pocEmail` | POC email | Optional | ✅ Yes | ❌ No |
| `pocPhone` | POC phone | Optional | ✅ Yes | ❌ No |
| `companyUnit` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in ingestion table** |
| `companyDivision` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in junction table only** |
| `eventItems` | Related event items | Optional | ✅ Yes | ❌ No |
| `links` | Junction relation | Optional | ✅ Yes | ❌ No |

### D. Architecture Compliance Check

- ❌ **Violates Rule 1:** Contains `companyUnit` and `companyDivision` (identity fields in pure content model)
- ❌ **Missing:** No `CompanyEventIngestion` model to track ingestion context
- ✅ **Correct:** Content fields are comprehensive and excellent for NTK generation
- ✅ **Excellent:** Has rich metadata (audience, vibe, perks, participation, food)

### E. NTK Readiness Score: **10/10**

**Strengths:**
- ✅ Comprehensive content fields (title, theme, description, dates, times)
- ✅ Has category and audience enums (perfect for NTK)
- ✅ Has rich metadata (vibe, perks, participation, food)
- ✅ Has speakers array
- ✅ Has registration information
- ✅ Has POC contact info
- ✅ Has related EventItem model for agenda items

**Weaknesses:**
- ❌ Identity fields pollute pure content model
- ❌ No ingestion tracking model

### F. Recommended Surgical Fixes

1. **Remove identity fields from CompanyEvent:**
   ```prisma
   // REMOVE:
   companyUnit     String?
   companyDivision String?
   @@index([companyUnit])
   ```

2. **Create CompanyEventIngestion model:**
   ```prisma
   model CompanyEventIngestion {
     id          String   @id @default(cuid())
     eventId     String
     event       CompanyEvent @relation(...)
     workMeId    String   // REQUIRED
     companyUnit String   // REQUIRED
     ingestedAt  DateTime @default(now())
     
     @@index([workMeId])
     @@index([companyUnit])
     @@index([eventId])
   }
   ```

---

## 5. CompanyCommunity

### A. Raw Prisma Model Definition

```prisma
model CompanyCommunity {
  id           String    @id @default(cuid())
  createdAt    DateTime  @default(now())
  title        String
  description  String?
  partnerOrg   String?
  date         DateTime?
  location     String?
  signUpLink   String?
  pocFirstName String?
  pocLastName  String?
  pocEmail     String?
  pocPhone     String?

  companyUnit     String?
  companyDivision String?

  links CompanyWorkLink[]

  @@index([companyUnit])
}
```

### B. Model Classification

**Type:** ❌ **Incorrectly Structured** - Pure content model with identity fields

**Should Be:** Pure content model (no identity fields)

**Currently Has:** `companyUnit`, `companyDivision` (should NOT be here)

### C. Field Analysis

| Field | Purpose | Required/Optional | NTK Needs | Misplaced? |
|-------|---------|-------------------|-----------|------------|
| `id` | Primary key | Required | ✅ Yes | ❌ No |
| `createdAt` | Timestamp | Required | ✅ Yes | ❌ No |
| `title` | Community title | Required | ✅ Yes | ❌ No |
| `description` | Community description | Optional | ✅ Yes | ❌ No |
| `partnerOrg` | Partner organization | Optional | ✅ Yes | ❌ No |
| `date` | Community event date | Optional | ✅ Yes | ❌ No |
| `location` | Event location | Optional | ✅ Yes | ❌ No |
| `signUpLink` | Sign-up link | Optional | ✅ Yes | ❌ No |
| `pocFirstName` | POC first name | Optional | ✅ Yes | ❌ No |
| `pocLastName` | POC last name | Optional | ✅ Yes | ❌ No |
| `pocEmail` | POC email | Optional | ✅ Yes | ❌ No |
| `pocPhone` | POC phone | Optional | ✅ Yes | ❌ No |
| `companyUnit` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in ingestion table** |
| `companyDivision` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in junction table only** |
| `links` | Junction relation | Optional | ✅ Yes | ❌ No |

### D. Architecture Compliance Check

- ❌ **Violates Rule 1:** Contains `companyUnit` and `companyDivision` (identity fields in pure content model)
- ❌ **Missing:** No `CompanyCommunityIngestion` model to track ingestion context
- ✅ **Correct:** Content fields are appropriate for NTK generation

### E. NTK Readiness Score: **7/10**

**Strengths:**
- ✅ Has all core content fields (title, description, date, location)
- ✅ Has partner organization (useful context)
- ✅ Has sign-up link for action items
- ✅ Has POC information

**Weaknesses:**
- ❌ Identity fields pollute pure content model
- ❌ No ingestion tracking model
- ⚠️ Missing urgency/priority field

### F. Recommended Surgical Fixes

1. **Remove identity fields from CompanyCommunity:**
   ```prisma
   // REMOVE:
   companyUnit     String?
   companyDivision String?
   @@index([companyUnit])
   ```

2. **Create CompanyCommunityIngestion model:**
   ```prisma
   model CompanyCommunityIngestion {
     id          String   @id @default(cuid())
     communityId String
     community   CompanyCommunity @relation(...)
     workMeId    String   // REQUIRED
     companyUnit String   // REQUIRED
     ingestedAt  DateTime @default(now())
     
     @@index([workMeId])
     @@index([companyUnit])
     @@index([communityId])
   }
   ```

---

## 6. CompanyBenefits

### A. Raw Prisma Model Definition

```prisma
model CompanyBenefits {
  id               String    @id @default(cuid())
  createdAt        DateTime  @default(now())
  title            String
  description      String?
  windowStart      DateTime?
  windowEnd        DateTime?
  fehbLink         String?
  fedvipLink      String?
  fsafedsLink      String?
  faqLink          String?
  pocFirstName     String?
  pocLastName      String?
  pocEmail         String?
  pocPhone         String?
  pocDepartment    String?
  annualRecurrence Boolean   @default(false)

  companyUnit     String?
  companyDivision String?

  links CompanyWorkLink[]

  @@index([companyUnit])
}
```

### B. Model Classification

**Type:** ❌ **Incorrectly Structured** - Pure content model with identity fields

**Should Be:** Pure content model (no identity fields)

**Currently Has:** `companyUnit`, `companyDivision` (should NOT be here)

### C. Field Analysis

| Field | Purpose | Required/Optional | NTK Needs | Misplaced? |
|-------|---------|-------------------|-----------|------------|
| `id` | Primary key | Required | ✅ Yes | ❌ No |
| `createdAt` | Timestamp | Required | ✅ Yes | ❌ No |
| `title` | Benefits title | Required | ✅ Yes | ❌ No |
| `description` | Benefits description | Optional | ✅ Yes | ❌ No |
| `windowStart` | Enrollment window start | Optional | ✅ Yes | ❌ No |
| `windowEnd` | Enrollment window end | Optional | ✅ Yes | ❌ No |
| `fehbLink` | FEHB link | Optional | ✅ Yes | ❌ No |
| `fedvipLink` | FEDVIP link | Optional | ✅ Yes | ❌ No |
| `fsafedsLink` | FSAFEDS link | Optional | ✅ Yes | ❌ No |
| `faqLink` | FAQ link | Optional | ✅ Yes | ❌ No |
| `pocFirstName` | POC first name | Optional | ✅ Yes | ❌ No |
| `pocLastName` | POC last name | Optional | ✅ Yes | ❌ No |
| `pocEmail` | POC email | Optional | ✅ Yes | ❌ No |
| `pocPhone` | POC phone | Optional | ✅ Yes | ❌ No |
| `pocDepartment` | POC department | Optional | ✅ Yes | ❌ No |
| `annualRecurrence` | Recurrence flag | Optional | ✅ Yes | ❌ No |
| `companyUnit` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in ingestion table** |
| `companyDivision` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in junction table only** |
| `links` | Junction relation | Optional | ✅ Yes | ❌ No |

### D. Architecture Compliance Check

- ❌ **Violates Rule 1:** Contains `companyUnit` and `companyDivision` (identity fields in pure content model)
- ❌ **Missing:** No `CompanyBenefitsIngestion` model to track ingestion context
- ✅ **Correct:** Content fields are comprehensive and appropriate for NTK generation
- ✅ **Excellent:** Has enrollment window dates (critical for NTK deadlines)

### E. NTK Readiness Score: **9/10**

**Strengths:**
- ✅ Comprehensive content fields (title, description, enrollment windows)
- ✅ Has multiple benefit links (FEHB, FEDVIP, FSAFEDS, FAQ)
- ✅ Has POC with department
- ✅ Has annual recurrence flag
- ✅ Has enrollment window dates (perfect for NTK deadlines)

**Weaknesses:**
- ❌ Identity fields pollute pure content model
- ❌ No ingestion tracking model

### F. Recommended Surgical Fixes

1. **Remove identity fields from CompanyBenefits:**
   ```prisma
   // REMOVE:
   companyUnit     String?
   companyDivision String?
   @@index([companyUnit])
   ```

2. **Create CompanyBenefitsIngestion model:**
   ```prisma
   model CompanyBenefitsIngestion {
     id          String   @id @default(cuid())
     benefitsId  String
     benefits    CompanyBenefits @relation(...)
     workMeId    String   // REQUIRED
     companyUnit String   // REQUIRED
     ingestedAt DateTime @default(now())
     
     @@index([workMeId])
     @@index([companyUnit])
     @@index([benefitsId])
   }
   ```

---

## 7. CompanyCareer

### A. Raw Prisma Model Definition

```prisma
model CompanyCareer {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  title       String
  description String?

  // Classification enums
  level CareerLevel? // NAVSEA | NAVY | DOD
  type  CareerType? // Leadership | Fellowship | Other

  // Eligibility JSON
  eligibility Json? // {
  //   paygradeRange: { min: string | null, max: string | null },
  //   timeInServiceMonths?: number | null,
  //   timeInPositionMonths?: number | null,
  //   who?: string | null
  // }

  // Application JSON
  application Json? // { instructions: string | null, link?: string | null }

  // Optional extras
  extras Json? // { cost?: string | null, notes?: string[] | null }

  // Raw ingest text (no workflow status)
  ingestRawText String?

  // Relations
  companyUnit     String?
  companyDivision String?
  links           CompanyWorkLink[]

  @@index([companyUnit])
}
```

### B. Model Classification

**Type:** ❌ **Incorrectly Structured** - Hybrid model mixing content + ingestion + identity

**Should Be:** 
- Pure content model (CompanyCareer) - content fields only
- Separate ingestion model (CompanyCareerIngestion) - ingestion context

**Currently Has:** 
- Content fields ✅
- Ingestion field (ingestRawText) ⚠️ **Should be in ingestion model**
- Identity fields (companyUnit, companyDivision) ❌ **Should be in ingestion model**

### C. Field Analysis

| Field | Purpose | Required/Optional | NTK Needs | Misplaced? |
|-------|---------|-------------------|-----------|------------|
| `id` | Primary key | Required | ✅ Yes | ❌ No |
| `createdAt` | Timestamp | Required | ✅ Yes | ❌ No |
| `title` | Career opportunity title | Required | ✅ Yes | ❌ No |
| `description` | Career description | Optional | ✅ Yes | ❌ No |
| `level` | Career level enum | Optional | ✅ Yes | ❌ No |
| `type` | Career type enum | Optional | ✅ Yes | ❌ No |
| `eligibility` | Eligibility JSON | Optional | ✅ Yes | ❌ No |
| `application` | Application JSON | Optional | ✅ Yes | ❌ No |
| `extras` | Extras JSON | Optional | ✅ Yes | ❌ No |
| `ingestRawText` | **Ingestion field** | Optional | ❌ No | ✅ **YES - Should be in ingestion model** |
| `companyUnit` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in ingestion model** |
| `companyDivision` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in junction table only** |
| `links` | Junction relation | Optional | ✅ Yes | ❌ No |

### D. Architecture Compliance Check

- ❌ **Violates Rule 1:** Contains `companyUnit` and `companyDivision` (identity fields in pure content model)
- ❌ **Violates Rule 2:** Ingestion field (`ingestRawText`) is in content model instead of ingestion model
- ❌ **Missing:** No `CompanyCareerIngestion` model to track ingestion context
- ✅ **Correct:** Content fields are comprehensive and appropriate for NTK generation
- ✅ **Good:** Uses JSON for flexible structured data (eligibility, application, extras)

### E. NTK Readiness Score: **8/10**

**Strengths:**
- ✅ Has core content fields (title, description)
- ✅ Has classification enums (level, type)
- ✅ Has structured JSON fields (eligibility, application, extras)
- ✅ Flexible structure supports various career opportunity types

**Weaknesses:**
- ❌ Identity and ingestion fields pollute pure content model
- ❌ No ingestion tracking model
- ⚠️ Missing POC fields (could be in extras JSON, but not explicit)
- ⚠️ Missing deadline fields (could be in application JSON, but not explicit)

### F. Recommended Surgical Fixes

1. **Remove identity and ingestion fields from CompanyCareer:**
   ```prisma
   // REMOVE:
   ingestRawText   String?
   companyUnit     String?
   companyDivision String?
   @@index([companyUnit])
   ```

2. **Create CompanyCareerIngestion model:**
   ```prisma
   model CompanyCareerIngestion {
     id           String   @id @default(cuid())
     careerId     String
     career       CompanyCareer @relation(...)
     workMeId     String   // REQUIRED
     companyUnit  String   // REQUIRED
     ingestRawText String?
     ingestedAt   DateTime @default(now())
     
     @@index([workMeId])
     @@index([companyUnit])
     @@index([careerId])
   }
   ```

---

## 8. CompanyEmployeeCause

### A. Raw Prisma Model Definition

```prisma
model CompanyEmployeeCause {
  id                   String    @id @default(cuid())
  createdAt            DateTime  @default(now())
  title                String
  description          String?
  partnerOrg           String?
  windowStart          DateTime?
  windowEnd            DateTime?
  location             String?
  neededItems          String[]
  collectionPoints     String[]
  signUpLink           String?
  pocFirstName         String?
  pocLastName         String?
  pocEmail             String?
  pocPhone             String?
  sponsoringDepartment String?

  companyUnit     String?
  companyDivision String?

  links CompanyWorkLink[]

  @@index([companyUnit])
}
```

### B. Model Classification

**Type:** ❌ **Incorrectly Structured** - Pure content model with identity fields

**Should Be:** Pure content model (no identity fields)

**Currently Has:** `companyUnit`, `companyDivision` (should NOT be here)

### C. Field Analysis

| Field | Purpose | Required/Optional | NTK Needs | Misplaced? |
|-------|---------|-------------------|-----------|------------|
| `id` | Primary key | Required | ✅ Yes | ❌ No |
| `createdAt` | Timestamp | Required | ✅ Yes | ❌ No |
| `title` | Cause title | Required | ✅ Yes | ❌ No |
| `description` | Cause description | Optional | ✅ Yes | ❌ No |
| `partnerOrg` | Partner organization | Optional | ✅ Yes | ❌ No |
| `windowStart` | Cause window start | Optional | ✅ Yes | ❌ No |
| `windowEnd` | Cause window end | Optional | ✅ Yes | ❌ No |
| `location` | Collection location | Optional | ✅ Yes | ❌ No |
| `neededItems` | Items needed array | Optional | ✅ Yes | ❌ No |
| `collectionPoints` | Collection points array | Optional | ✅ Yes | ❌ No |
| `signUpLink` | Sign-up link | Optional | ✅ Yes | ❌ No |
| `pocFirstName` | POC first name | Optional | ✅ Yes | ❌ No |
| `pocLastName` | POC last name | Optional | ✅ Yes | ❌ No |
| `pocEmail` | POC email | Optional | ✅ Yes | ❌ No |
| `pocPhone` | POC phone | Optional | ✅ Yes | ❌ No |
| `sponsoringDepartment` | Sponsoring department | Optional | ✅ Yes | ❌ No |
| `companyUnit` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in ingestion table** |
| `companyDivision` | **Identity field** | Optional | ❌ No | ✅ **YES - Should be in junction table only** |
| `links` | Junction relation | Optional | ✅ Yes | ❌ No |

### D. Architecture Compliance Check

- ❌ **Violates Rule 1:** Contains `companyUnit` and `companyDivision` (identity fields in pure content model)
- ❌ **Missing:** No `CompanyEmployeeCauseIngestion` model to track ingestion context
- ✅ **Correct:** Content fields are comprehensive and appropriate for NTK generation
- ✅ **Excellent:** Has window dates and collection details

### E. NTK Readiness Score: **8/10**

**Strengths:**
- ✅ Comprehensive content fields (title, description, partner org)
- ✅ Has window dates (perfect for NTK deadlines)
- ✅ Has collection details (location, needed items, collection points)
- ✅ Has sign-up link for action items
- ✅ Has POC information
- ✅ Has sponsoring department

**Weaknesses:**
- ❌ Identity fields pollute pure content model
- ❌ No ingestion tracking model

### F. Recommended Surgical Fixes

1. **Remove identity fields from CompanyEmployeeCause:**
   ```prisma
   // REMOVE:
   companyUnit     String?
   companyDivision String?
   @@index([companyUnit])
   ```

2. **Create CompanyEmployeeCauseIngestion model:**
   ```prisma
   model CompanyEmployeeCauseIngestion {
     id          String   @id @default(cuid())
     causeId     String
     cause       CompanyEmployeeCause @relation(...)
     workMeId    String   // REQUIRED
     companyUnit String   // REQUIRED
     ingestedAt  DateTime @default(now())
     
     @@index([workMeId])
     @@index([companyUnit])
     @@index([causeId])
   }
   ```

---

## 9. CompanyWorkLink (Junction Table)

### A. Raw Prisma Model Definition

```prisma
model CompanyWorkLink {
  id String @id @default(uuid())

  companyEventId String?
  companyEvent   CompanyEvent? @relation(fields: [companyEventId], references: [id], onDelete: Cascade)

  companyTrainingId String?
  companyTraining   CompanyTraining? @relation(fields: [companyTrainingId], references: [id], onDelete: Cascade)

  companyBenefitsId String?
  companyBenefits   CompanyBenefits? @relation(fields: [companyBenefitsId], references: [id], onDelete: Cascade)

  companyCampaignId String?
  companyCampaign   CompanyCampaign? @relation(fields: [companyCampaignId], references: [id], onDelete: Cascade)

  companyImpactEventId String?
  companyImpactEvent   CompanyImpactEvent? @relation(fields: [companyImpactEventId], references: [id], onDelete: Cascade)

  companyCommunityId String?
  companyCommunity   CompanyCommunity? @relation(fields: [companyCommunityId], references: [id], onDelete: Cascade)

  companyCareerId String?
  companyCareer   CompanyCareer? @relation(fields: [companyCareerId], references: [id], onDelete: Cascade)

  companyEmployeeCauseId String?
  companyEmployeeCause   CompanyEmployeeCause? @relation(fields: [companyEmployeeCauseId], references: [id], onDelete: Cascade)

  workCommsProductId String
  workCommsProduct   WorkCommsProduct @relation(fields: [workCommsProductId], references: [id], onDelete: Cascade)

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

### B. Model Classification

**Type:** ⚠️ **Partially Correct** - Junction table with identity fields

**Should Be:** Junction table linking CompanyX content to WorkCommsProduct

**Currently Has:** `companyUnit`, `companyDivision` (context fields for the link)

**Analysis:** This is a junction table, not a pure content model. The presence of `companyUnit` and `companyDivision` here is **questionable** - these fields represent the context in which the link was created, but according to the architecture, `companyDivision` should only appear in the WorkMeCompanyUnit junction table.

### C. Field Analysis

| Field | Purpose | Required/Optional | NTK Needs | Misplaced? |
|-------|---------|-------------------|-----------|------------|
| `id` | Primary key | Required | ✅ Yes | ❌ No |
| `companyEventId` | Link to event | Optional | ✅ Yes | ❌ No |
| `companyTrainingId` | Link to training | Optional | ✅ Yes | ❌ No |
| `companyBenefitsId` | Link to benefits | Optional | ✅ Yes | ❌ No |
| `companyCampaignId` | Link to campaign | Optional | ✅ Yes | ❌ No |
| `companyImpactEventId` | Link to impact event | Optional | ✅ Yes | ❌ No |
| `companyCommunityId` | Link to community | Optional | ✅ Yes | ❌ No |
| `companyCareerId` | Link to career | Optional | ✅ Yes | ❌ No |
| `companyEmployeeCauseId` | Link to cause | Optional | ✅ Yes | ❌ No |
| `workCommsProductId` | Link to comms product | Required | ✅ Yes | ❌ No |
| `companyUnit` | **Context field** | Optional | ⚠️ Maybe | ⚠️ **QUESTIONABLE - Should this be here?** |
| `companyDivision` | **Context field** | Optional | ⚠️ Maybe | ✅ **YES - Should be in WorkMeCompanyUnit only** |
| `createdAt` | Timestamp | Required | ✅ Yes | ❌ No |

### D. Architecture Compliance Check

- ⚠️ **Questionable:** Contains `companyUnit` and `companyDivision` - these represent link context, but `companyDivision` should only be in WorkMeCompanyUnit
- ✅ **Correct:** Junction table structure is appropriate
- ⚠️ **Missing:** No `workMeId` field to track who created the link (if needed for audit)

### E. NTK Readiness Score: **6/10**

**Strengths:**
- ✅ Proper junction table structure
- ✅ Links all CompanyX models to WorkCommsProduct
- ✅ Has timestamp for tracking

**Weaknesses:**
- ⚠️ `companyDivision` should not be here (only in WorkMeCompanyUnit)
- ⚠️ No `workMeId` to track link creator (if needed for audit)

### F. Recommended Surgical Fixes

1. **Remove companyDivision from CompanyWorkLink:**
   ```prisma
   // REMOVE:
   companyDivision String?
   ```

2. **Consider adding workMeId if link creator tracking is needed:**
   ```prisma
   // OPTIONAL (if audit trail needed):
   workMeId String?
   workMe   WorkMe? @relation(...)
   ```

---

## 10. Summary: Architecture Violations

### All CompanyX Content Models Violate Architecture

**Common Violations:**
1. ❌ All 8 content models contain `companyUnit` (should be in ingestion models)
2. ❌ All 8 content models contain `companyDivision` (should only be in WorkMeCompanyUnit)
3. ❌ CompanyTraining and CompanyCareer contain ingestion fields (should be in ingestion models)
4. ❌ No CompanyXIngestion models exist (ingestion context is missing)

### Missing Ingestion Models

The following ingestion models need to be created:

1. `CompanyCampaignIngestion`
2. `CompanyImpactEventIngestion`
3. `CompanyTrainingIngestion`
4. `CompanyEventIngestion`
5. `CompanyCommunityIngestion`
6. `CompanyBenefitsIngestion`
7. `CompanyCareerIngestion`
8. `CompanyEmployeeCauseIngestion`

### Missing WorkMeCompanyUnit Junction Table

**Critical Finding:** ⚠️ **WorkMeCompanyUnit junction table does NOT exist in the schema!**

According to the architecture rules, this should be the ONLY table where `workMeId`, `companyUnit`, and `companyDivision` appear together. This table is **missing** and needs to be created.

**Note:** The WorkMe model has `companyUnit` and `companyDivision` as direct fields (lines 21-22), which may serve as a temporary solution, but the architecture specifies a junction table for proper many-to-many relationships between users and company units/divisions.

---

## 11. Recommended Architecture Fixes

### Phase 1: Create Missing Junction Table

```prisma
model WorkMeCompanyUnit {
  id              String   @id @default(uuid())
  workMeId        String
  companyUnit     String
  companyDivision String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  workMe WorkMe @relation(...)

  @@unique([workMeId, companyUnit, companyDivision])
  @@index([workMeId])
  @@index([companyUnit])
}
```

### Phase 2: Create All Ingestion Models

For each CompanyX model, create a corresponding CompanyXIngestion model with:
- `workMeId` (REQUIRED)
- `companyUnit` (REQUIRED)
- `companyDivision` (NOT included - only in WorkMeCompanyUnit)
- Ingestion-specific fields (ingestRawText, ingestStatus, etc.)
- Foreign key to CompanyX model

### Phase 3: Remove Identity Fields from Content Models

For each CompanyX model:
1. Remove `companyUnit` field
2. Remove `companyDivision` field
3. Remove `@@index([companyUnit])`
4. Remove ingestion fields (if present)

### Phase 4: Update CompanyWorkLink

1. Remove `companyDivision` field
2. Optionally add `workMeId` if link creator tracking is needed

---

## 12. NTK Readiness Summary

| Model | Score | Strengths | Weaknesses |
|-------|-------|----------|------------|
| CompanyCampaign | 7/10 | Core fields, window dates, POC | Missing urgency, identity fields |
| CompanyImpactEvent | 8/10 | Core fields, urgency, effective date | Identity fields |
| CompanyTraining | 9/10 | Comprehensive fields, mandatory flag | Identity + ingestion fields |
| CompanyEvent | 10/10 | Excellent metadata, rich fields | Identity fields |
| CompanyCommunity | 7/10 | Core fields, partner org | Missing urgency, identity fields |
| CompanyBenefits | 9/10 | Enrollment windows, multiple links | Identity fields |
| CompanyCareer | 8/10 | Flexible JSON structure | Identity + ingestion fields, missing explicit POC |
| CompanyEmployeeCause | 8/10 | Window dates, collection details | Identity fields |

**Overall Average:** 8.25/10

**Conclusion:** Content models are well-structured for NTK generation, but architecture violations (identity fields in content models) need to be fixed before proceeding with NTK ingestion.

---

**END OF AUDIT**

