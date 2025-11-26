# Work.me Architecture Map Report

**Generated:** 2025-01-XX  
**Purpose:** Complete diagnostic map of current architecture vs. new canonical structure  
**Status:** Analysis Only - No Changes Made

---

## Executive Summary

This report provides a comprehensive map of the Work.me application architecture, identifying all routes, API endpoints, Prisma models, components, and their alignment (or misalignment) with the proposed canonical structure:

- **MyCompany** - Company profile, workforce stuff, milestones, work signals
- **MyWork** - Work contexts, outputs, active work
- **MyCareer** - Achievements, reflections, career tracking
- **MyNetwork** - Connections, suggestions
- **Dashboard** - Overview and quick access

**Key Finding:** The app has a mix of legacy routes (`/events`, `/profile`, `/tasks`, `/career`, `/connections`) that need migration to the new structure, alongside newer routes already aligned (`/mycompany/*`, `/mywork/*`, `/mycareer/*`, `/mynetwork/*`).

---

## 1. ROUTES MAP (App Router)

### 1.1 Root & Authentication Routes

| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/` | `app/page.tsx` | Root landing/redirect | ✅ Good - Entry point |
| `/signin` | `app/signin/page.tsx` | Sign in page | ✅ Good - Auth entry |
| `/signup` | `app/signup/page.tsx` | Sign up page | ✅ Good - Auth entry |
| `/auth` | `app/auth/page.tsx` | Auth handler | ✅ Good - Auth flow |
| `/welcome` | `app/welcome/page.tsx` | Welcome/onboarding | ✅ Good - Onboarding |

### 1.2 Dashboard

| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/dashboard` | `app/dashboard/page.tsx` | Main dashboard with 3-card scaffold (My Progress, Top Signals, Stuff I'm Working On) | ✅ Good - Maps to Dashboard |

### 1.3 MyCompany Routes

| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/mycompany/profile` | `app/mycompany/profile/page.tsx` | Company profile page with enrichment data | ✅ Good - Maps to MyCompany → Profile |
| `/mycompany/workforcestuff` | `app/mycompany/workforcestuff/page.tsx` | Workforce stuff listing (conceptual - no backend yet) | ⚠️ Partial - Page exists but no WorkforceStuffItem model |
| `/mycompany/workforcestuff/[id]` | `app/mycompany/workforcestuff/[id]/page.tsx` | Workforce stuff detail page | ⚠️ Partial - Page exists but no backend |
| `/mycompany/milestones` | `app/mycompany/milestones/page.tsx` | Company milestones listing | ✅ Good - Maps to MyCompany → Milestones |
| `/mycompany/milestones/new` | `app/mycompany/milestones/new/page.tsx` | Create new milestone | ✅ Good |
| `/mycompany/milestones/[id]` | `app/mycompany/milestones/[id]/page.tsx` | Milestone detail page | ✅ Good |
| `/mycompany/worksignal` | `app/mycompany/worksignal/page.tsx` | WorkSignal listing | ⚠️ Partial - Page exists but no WorkSignal model |
| `/mycompany/worksignal/[id]` | `app/mycompany/worksignal/[id]/page.tsx` | WorkSignal detail page | ⚠️ Partial - Page exists but no backend |

**Legacy Routes (Need Migration):**
| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/profile` | `app/profile/page.tsx` | User profile (contains company info) | 🔄 Legacy - Should migrate to `/mycompany/profile` |
| `/workforce-comms` | `app/workforce-comms/page.tsx` | Workforce communications product management | 🔄 Legacy - Different from WorkforceStuff (this is for email products) |
| `/workforce-comms/new` | `app/workforce-comms/new/page.tsx` | Create new workforce comms product | 🔄 Legacy - Part of email system, not WorkforceStuff |
| `/workforce-comms/[productId]` | `app/workforce-comms/[productId]/page.tsx` | Workforce comms product detail | 🔄 Legacy |
| `/workforce-comms/[productId]/drafts/new` | `app/workforce-comms/[productId]/drafts/new/page.tsx` | Create draft | 🔄 Legacy |
| `/workforce-comms/[productId]/drafts/[draftId]` | `app/workforce-comms/[productId]/drafts/[draftId]/page.tsx` | Draft detail | 🔄 Legacy |
| `/workforce-comms/[productId]/drafts/[draftId]/generate` | `app/workforce-comms/[productId]/drafts/[draftId]/generate/page.tsx` | Generate edition from draft | 🔄 Legacy |
| `/workforce-comms/[productId]/editions` | `app/workforce-comms/[productId]/editions/page.tsx` | Editions listing | 🔄 Legacy |
| `/workforce-comms/[productId]/editions/[editionId]` | `app/workforce-comms/[productId]/editions/[editionId]/page.tsx` | Edition detail | 🔄 Legacy |
| `/events` | `app/events/page.tsx` | Generic events page (stub) | 🔄 Legacy - Should migrate to `/mycompany/worksignal` or `/mywork/events` |
| `/events/new` | `app/events/new/page.tsx` | Create event (stub) | 🔄 Legacy - Unclear if this is company-level or work-level |
| `/milestones` | `app/milestones/new/page.tsx` | Create milestone (root level) | 🔄 Legacy - Should be under `/mycompany/milestones/new` |

### 1.4 MyWork Routes

| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/mywork` | `app/mywork/page.tsx` | WorkplaceSandbox hub - lists all work contexts by type | ✅ Good - Maps to MyWork → WorkplaceSandbox |
| `/mywork/active` | `app/mywork/active/page.tsx` | Active work items | ✅ Good - Maps to MyWork → Active |
| `/mywork/create` | `app/mywork/create/page.tsx` | Create work item | ✅ Good |
| `/mywork/context` | `app/mywork/context/page.tsx` | All contexts listing | ✅ Good |
| `/mywork/context/new` | `app/mywork/context/new/page.tsx` | Context type selector | ✅ Good |
| `/mywork/context/new/event` | `app/mywork/context/new/event/page.tsx` | Create event context | ✅ Good |
| `/mywork/context/new/campaign` | `app/mywork/context/new/campaign/page.tsx` | Create campaign context | ✅ Good |
| `/mywork/context/new/training` | `app/mywork/context/new/training/page.tsx` | Create training context | ✅ Good |
| `/mywork/context/new/impact-event` | `app/mywork/context/new/impact-event/page.tsx` | Create impact event context | ✅ Good |
| `/mywork/context/new/community` | `app/mywork/context/new/community/page.tsx` | Create community context | ✅ Good |
| `/mywork/context/new/benefits` | `app/mywork/context/new/benefits/page.tsx` | Create benefits context | ✅ Good |
| `/mywork/context/new/career` | `app/mywork/context/new/career/page.tsx` | Create career context | ✅ Good |
| `/mywork/context/new/employee-cause` | `app/mywork/context/new/employee-cause/page.tsx` | Create employee cause context | ✅ Good |
| `/mywork/context/[contextId]` | `app/mywork/context/[contextId]/page.tsx` | Context detail page | ✅ Good |
| `/mywork/context/[contextId]/success` | `app/mywork/context/[contextId]/success/page.tsx` | Context creation success | ✅ Good |
| `/mywork/events` | `app/mywork/events/page.tsx` | Events listing (work-level) | ✅ Good - Maps to MyWork → Events |
| `/mywork/outputs` | `app/mywork/outputs/page.tsx` | Output type selector | ✅ Good - Maps to MyWork → Outputs |
| `/mywork/outputs/[id]` | `app/mywork/outputs/[id]/page.tsx` | Output detail | ✅ Good |
| `/mywork/outputs/builder/[outputId]` | `app/mywork/outputs/builder/[outputId]/page.tsx` | Output builder | ✅ Good |
| `/mywork/outputs/email/new` | `app/mywork/outputs/email/new/page.tsx` | Create email output | ✅ Good |
| `/mywork/fromcompanystuff` | `app/mywork/fromcompanystuff/page.tsx` | Work items from company stuff | ✅ Good |
| `/mywork/support/[routerId]` | `app/mywork/support/[routerId]/page.tsx` | WorkSupport detail | ✅ Good |
| `/mywork/support/[routerId]/setup` | `app/mywork/support/[routerId]/setup/page.tsx` | WorkSupport setup | ✅ Good |

**Legacy Routes (Need Migration):**
| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/tasks` | `app/tasks/page.tsx` | Tasks listing | 🔄 Legacy - Should migrate to `/mywork/tasks` |
| `/tasks/new` | `app/tasks/new/page.tsx` | Create task | 🔄 Legacy - Should migrate to `/mywork/tasks/new` |
| `/tasks/[taskId]` | `app/tasks/[taskId]/page.tsx` | Task detail | 🔄 Legacy - Should migrate to `/mywork/tasks/[taskId]` |

**Special Routes:**
| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/attention/events/[eventId]/view` | `app/attention/events/[eventId]/view/page.tsx` | Event detail view | ⚠️ Unclear - Special event view page |
| `/attention/events/[eventId]/promo/new` | `app/attention/events/[eventId]/promo/new/page.tsx` | Create promotional work item | ⚠️ Unclear - Event promotion flow |
| `/attention/events/[eventId]/promo/new/ai` | `app/attention/events/[eventId]/promo/new/ai/page.tsx` | AI promo creation | ⚠️ Unclear |
| `/attention/events/[eventId]/promo/new/scratch` | `app/attention/events/[eventId]/promo/new/scratch/page.tsx` | Manual promo creation | ⚠️ Unclear |
| `/attention/events/[eventId]/promo/new/previous` | `app/attention/events/[eventId]/promo/new/previous/page.tsx` | Use previous promo | ⚠️ Unclear |
| `/attention/events/[eventId]/promo/[promoId]` | `app/attention/events/[eventId]/promo/[promoId]/page.tsx` | Promo detail | ⚠️ Unclear |
| `/attention/events/[eventId]/promo/[promoId]/success` | `app/attention/events/[eventId]/promo/[promoId]/success/page.tsx` | Promo success | ⚠️ Unclear |

### 1.5 MyCareer Routes

| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/mycareer/achievements` | `app/mycareer/achievements/page.tsx` | Achievements page (stub - "Coming Soon") | ✅ Good - Maps to MyCareer → Achievements (but not implemented) |
| `/mycareer/reflections` | `app/mycareer/reflections/page.tsx` | Reflections page (stub) | ✅ Good - Maps to MyCareer → Reflections (but not implemented) |
| `/mycareer/track` | `app/mycareer/track/page.tsx` | Career tracking page (stub) | ✅ Good - Maps to MyCareer → Track (but not implemented) |

**Legacy Routes (Need Migration):**
| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/career` | `app/career/page.tsx` | Career dashboard (deprecated features) | 🔄 Legacy - Should migrate to `/mycareer/track` |

### 1.6 MyNetwork Routes

| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/mynetwork/connections` | `app/mynetwork/connections/page.tsx` | Connections page (stub - "Coming Soon") | ✅ Good - Maps to MyNetwork → Connections (but not implemented) |
| `/mynetwork/suggestions` | `app/mynetwork/suggestions/page.tsx` | Suggestions page (stub) | ✅ Good - Maps to MyNetwork → Suggestions (but not implemented) |

**Legacy Routes (Need Migration):**
| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/connections` | `app/connections/page.tsx` | Connections listing | 🔄 Legacy - Should migrate to `/mynetwork/connections` |
| `/connections/new` | `app/connections/new/page.tsx` | Create connection | 🔄 Legacy - Should migrate to `/mynetwork/connections/new` |

### 1.7 Settings & Setup

| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/setup` | `app/setup/page.tsx` | Setup dashboard (deprecated features) | 🔄 Legacy - Should rename to `/settings` |

### 1.8 Special Feature Routes

| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/ntk` | `app/ntk/page.tsx` | NTK generator hub | ⚠️ Legacy Feature - Standalone NTK system |
| `/ntk/new` | `app/ntk/new/page.tsx` | Create NTK | ⚠️ Legacy Feature |
| `/ntk/[id]` | `app/ntk/[id]/page.tsx` | NTK detail | ⚠️ Legacy Feature |
| `/ntk/parse` | `app/ntk/parse/page.tsx` | Parse NTK from CSV | ⚠️ Legacy Feature |
| `/ntk/editions` | `app/ntk/editions/page.tsx` | NTK editions listing | ⚠️ Legacy Feature |
| `/ntk/editions/[editionId]` | `app/ntk/editions/[editionId]/page.tsx` | NTK edition detail | ⚠️ Legacy Feature |
| `/ntk/items/[itemId]` | `app/ntk/items/[itemId]/page.tsx` | NTK item detail | ⚠️ Legacy Feature |
| `/holiday` | `app/holiday/page.tsx` | Holiday builder hub | ⚠️ Legacy Feature - Holiday asset system |
| `/holiday/new` | `app/holiday/new/page.tsx` | Create holiday | ⚠️ Legacy Feature |
| `/holiday/[holidayId]` | `app/holiday/[holidayId]/page.tsx` | Holiday detail | ⚠️ Legacy Feature |
| `/assets` | `app/assets/page.tsx` | Assets listing | ⚠️ Legacy Feature - Asset management |
| `/assets/upload` | `app/assets/upload/page.tsx` | Upload asset | ⚠️ Legacy Feature |
| `/assets/[assetId]` | `app/assets/[assetId]/page.tsx` | Asset detail | ⚠️ Legacy Feature |
| `/assets/import/dvids` | `app/assets/import/dvids/page.tsx` | Import DVIDS assets | ⚠️ Legacy Feature |
| `/goals` | `app/goals/page.tsx` | Goals listing | ⚠️ Legacy Feature - Goals system |
| `/goals/new` | `app/goals/new/page.tsx` | Create goal | ⚠️ Legacy Feature |
| `/goals/[goalId]` | `app/goals/[goalId]/page.tsx` | Goal detail | ⚠️ Legacy Feature |

### 1.9 Authenticated Route Groups

| Route Path | File Location | Current Renders | Architecture Status |
|------------|---------------|-----------------|---------------------|
| `/(authenticated)/workme/company/enrich` | `app/(authenticated)/workme/company/enrich/page.tsx` | Company enrichment page | ✅ Good - Company enrichment |
| `/(authenticated)/worksupport` | `app/(authenticated)/worksupport/page.tsx` | WorkSupport listing | ✅ Good - WorkSupport feature |
| `/(authenticated)/worksupport/[workSupportId]` | `app/(authenticated)/worksupport/[workSupportId]/page.tsx` | WorkSupport detail | ✅ Good |

---

## 2. API ROUTES MAP

### 2.1 WorkMe Core API

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `POST /api/workme/create` | `app/api/workme/create/route.ts` | Create WorkMe user from Firebase auth | ✅ Good - Core identity |
| `GET /api/workme/profile` | `app/api/workme/profile/route.ts` | Get WorkMe profile | ✅ Good |
| `GET /api/workme/company` | `app/api/workme/company/route.ts` | Get company by ID | ✅ Good |
| `GET /api/workme/hydrate` | `app/api/workme/hydrate/route.ts` | Hydrate WorkMe data | ✅ Good |
| `POST /api/workme/super-admin/create` | `app/api/workme/super-admin/create/route.ts` | Create super admin | ✅ Good |

### 2.2 Context API (WorkContext)

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `GET /api/context` | `app/api/context/route.ts` | List all work contexts | ✅ Good - Maps to MyWork |
| `GET /api/context/[contextId]` | `app/api/context/[contextId]/route.ts` | Get context by ID | ✅ Good |
| `POST /api/context/create/[type]` | `app/api/context/create/[type]/route.ts` | Create typed context (campaign, training, etc.) | ✅ Good |

### 2.3 Event API

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `POST /api/events/hydrate` | `app/api/events/hydrate/route.ts` | Hydrate events for company | ✅ Good - Event hydration |
| `POST /api/ingest/event/ai` | `app/api/ingest/event/ai/route.ts` | AI event ingestion | ✅ Good |
| `POST /api/ingest/event/save` | `app/api/ingest/event/save/route.ts` | Save ingested event | ✅ Good |
| `POST /api/ai/parse-event` | `app/api/ai/parse-event/route.ts` | Parse event from text | ✅ Good |

### 2.4 WorkSupport API

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `GET /api/worksupport` | `app/api/worksupport/route.ts` | List WorkSupport items | ✅ Good - Maps to MyWork |
| `GET /api/worksupport/[id]` | `app/api/worksupport/[id]/route.ts` | Get WorkSupport by ID | ✅ Good |

### 2.5 WorkOutput API

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `GET /api/output-standalone` | `app/api/output-standalone/route.ts` | List standalone outputs | ✅ Good - Maps to MyWork → Outputs |
| `POST /api/output-standalone/create` | `app/api/output-standalone/create/route.ts` | Create standalone output | ✅ Good |
| `GET /api/output-standalone/[id]` | `app/api/output-standalone/[id]/route.ts` | Get output by ID | ✅ Good |

### 2.6 Workforce Communications API

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `POST /api/workforce-comms/generate` | `app/api/workforce-comms/generate/route.ts` | Generate workforce comms edition | ⚠️ Legacy - Email system, not WorkforceStuff |

### 2.7 NTK API (Legacy Feature)

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `GET /api/ntk` | `app/api/ntk/route.ts` | List NTKs | ⚠️ Legacy Feature |
| `POST /api/ntk/create` | `app/api/ntk/create/route.ts` | Create NTK | ⚠️ Legacy Feature |
| `GET /api/ntk/[ntkId]` | `app/api/ntk/[ntkId]/route.ts` | Get NTK by ID | ⚠️ Legacy Feature |
| `POST /api/ntk/parse` | `app/api/ntk/parse/route.ts` | Parse NTK from text | ⚠️ Legacy Feature |
| `POST /api/ntk/generate` | `app/api/ntk/generate/route.ts` | Generate NTK | ⚠️ Legacy Feature |
| `GET /api/ntk/csv-preview` | `app/api/ntk/csv-preview/route.ts` | Preview CSV for NTK | ⚠️ Legacy Feature |
| `GET /api/ntk/editions` | `app/api/ntk/editions/route.ts` | List NTK editions | ⚠️ Legacy Feature |
| `GET /api/ntk/editions/[editionId]` | `app/api/ntk/editions/[editionId]/route.ts` | Get NTK edition | ⚠️ Legacy Feature |
| `GET /api/ntk/items/[itemId]` | `app/api/ntk/items/[itemId]/route.ts` | Get NTK item | ⚠️ Legacy Feature |
| `POST /api/ntk/items/[itemId]/regenerate` | `app/api/ntk/items/[itemId]/regenerate/route.ts` | Regenerate NTK item | ⚠️ Legacy Feature |
| `POST /api/ntk/items/[itemId]/mark-final` | `app/api/ntk/items/[itemId]/mark-final/route.ts` | Mark NTK item as final | ⚠️ Legacy Feature |

### 2.8 Holiday API (Legacy Feature)

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `GET /api/holidays` | `app/api/holidays/route.ts` | List holidays | ⚠️ Legacy Feature |
| `POST /api/holidays/create` | `app/api/holidays/create/route.ts` | Create holiday | ⚠️ Legacy Feature |
| `POST /api/holidays/generate` | `app/api/holidays/generate/route.ts` | Generate holiday assets | ⚠️ Legacy Feature |

### 2.9 Assets API (Legacy Feature)

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `GET /api/assets` | `app/api/assets/route.ts` | List assets | ⚠️ Legacy Feature |
| `POST /api/assets/upload` | `app/api/assets/upload/route.ts` | Upload asset | ⚠️ Legacy Feature |
| `POST /api/assets/import/dvids` | `app/api/assets/import/dvids/route.ts` | Import DVIDS assets | ⚠️ Legacy Feature |

### 2.10 Company Enrichment API

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `POST /api/enrich/company` | `app/api/enrich/company/route.ts` | Enrich company with Apollo data | ✅ Good - Maps to MyCompany |

### 2.11 Promotional Work Item API

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `POST /api/ingest/promotional/ai` | `app/api/ingest/promotional/ai/route.ts` | AI promotional work item ingestion | ⚠️ Unclear - Part of event promotion flow |

### 2.12 Super Admin API

| Route | File Location | Purpose | Architecture Status |
|-------|--------------|---------|---------------------|
| `POST /api/super-admin/create` | `app/api/super-admin/create/route.ts` | Create super admin | ✅ Good |

---

## 3. PRISMA MODELS MAP

### 3.1 Core Identity Models

| Model | Fields | Relations | Architecture Alignment |
|-------|--------|-----------|----------------------|
| **WorkMe** | id, firebaseId, email, firstName, lastName, photoUrl, companyId, workMeCompanyId, jobTitle, specialty, industry, jobRole, salaryRange, createdAt | Company, WorkMeCompany, SuperAdmin, Workplace[], originated* (many reverse relations) | ✅ Good - Core identity model |
| **WorkMeCompany** | id, name, description, createdAt, updatedAt | employees: WorkMe[] | ✅ Good - Platform container |
| **SuperAdmin** | id, firebaseId, email, firstName, lastName, photoUrl, workMeId, createdAt, updatedAt | workMe: WorkMe? | ✅ Good - Admin identity |
| **Company** | id, name, industry, website, city, state, description, headcount, companyType, revenueRange, missionStatement, vision, values, brandTagline, brandLogoUrl, brandColorPrimary, brandColorSecondary, ceoName, ceoTitle, deputyName, deputyTitle, chiefOfStaff, directorates, linkedinUrl, twitterUrl, facebookUrl, phone, country, createdAt | employees: WorkMe[], commsOutputs, objectives, achievements, workEventRouters, workContexts*, workEvents, workSupports, workOutputs, ntks, workforceComms* | ✅ Good - Maps to MyCompany |

### 3.2 WorkWorld Architecture Models

| Model | Fields | Relations | Architecture Alignment |
|-------|--------|-----------|----------------------|
| **CompanyRegistry** | id, name, domain, createdAt, updatedAt | units: CompanyUnit[], workplaces: Workplace[] | ✅ Good - WorkWorld structure |
| **CompanyUnit** | id, companyId, name, parentUnitId, createdAt, updatedAt | company: CompanyRegistry, parentUnit: CompanyUnit?, subUnits: CompanyUnit[] | ✅ Good - WorkWorld structure |
| **Workplace** | id, workMeId, companyId, createdAt, updatedAt | workMe: WorkMe, company: CompanyRegistry, roles: CompanyRole[] | ✅ Good - WorkWorld structure |
| **CompanyRole** | id, workplaceId, role, createdAt, updatedAt | workplace: Workplace | ✅ Good - WorkWorld structure |

### 3.3 Achievement Models (Deprecated/Unused)

| Model | Fields | Relations | Architecture Alignment |
|-------|--------|-----------|----------------------|
| **CommsOutput** | id, companyId, originatorId, type, title, description, wordCount, dateSent, topics, createdAt, updatedAt | company: Company, originator: WorkMe, achievements: Achievement[] | ⚠️ Deprecated - Referenced in UI but not actively used |
| **Objective** | id, companyId, originatorId, title, description, howMeasured, createdAt, updatedAt | company: Company, originator: WorkMe, achievements: Achievement[] | ⚠️ Deprecated - Referenced in UI but not actively used |
| **Achievement** | id, companyId, originatorId, title, category, audienceName, audienceSize, objectiveId, commsOutputId, whatYouDid, frequency, volume, processSteps, impact, createdAt, updatedAt | company: Company, originator: WorkMe, objective: Objective?, commsOutput: CommsOutput? | ⚠️ Deprecated - Referenced in MyCareer but not implemented |

### 3.4 Work Architecture Models

| Model | Fields | Relations | Architecture Alignment |
|-------|--------|-----------|----------------------|
| **WorkEventRouter** | id, createdAt, type, eventRefId, companyId, originatorId | company: Company, originator: WorkMe, outputs: WorkOutput[], supports: WorkSupport[] | ✅ Good - Maps to MyWork → Contexts |
| **WorkContextCampaign** | id, createdAt, title, description, windowStart, windowEnd, ctaLink, sponsor, pocFirstName, pocLastName, pocEmail, pocPhone, companyId, originatorId | company: Company, originator: WorkMe | ✅ Good - Maps to MyWork → Contexts |
| **WorkContextImpactEvent** | id, createdAt, title, description, effectiveDate, impactedPopulation, urgency, pocFirstName, pocLastName, pocEmail, pocPhone, companyId, originatorId | company: Company, originator: WorkMe | ✅ Good - Maps to MyWork → Contexts |
| **WorkContextTraining** | id, createdAt, title, description, trainingDate, deadline, link, mandatory, sponsoringOffice, pocFirstName, pocLastName, pocEmail, pocPhone, companyId, originatorId | company: Company, originator: WorkMe | ✅ Good - Maps to MyWork → Contexts |
| **WorkEvent** | id, createdAt, updatedAt, title, theme, description, eventDate, startTime, endTime, eventCategory, registrationRequired, registrationLink, audience, vibe, perks, participation, foodProvided, foodTypes, speakers, pocEmail, pocPhone, companyId, originatorId | company: Company, originator: WorkMe, eventItems: EventItem[], promotionalWorkItems: PromotionalWorkItem[] | ✅ Good - Maps to MyWork → Events |
| **EventItem** | id, eventId, title, description, metadata, createdAt, updatedAt | event: WorkEvent | ✅ Good - Event detail items |
| **PromotionalWorkItem** | id, createdAt, updatedAt, eventId, name, type, title, headline, subheadline, details, perks, participation, foodProvided, foodTypes, theme, eventDateBlock, eventTimeBlock, rsvpLink, metadata | event: WorkEvent | ✅ Good - Event promotional materials |
| **WorkContextCommunity** | id, createdAt, title, description, partnerOrg, date, location, signUpLink, pocFirstName, pocLastName, pocEmail, pocPhone, companyId, originatorId | company: Company, originator: WorkMe | ✅ Good - Maps to MyWork → Contexts |
| **WorkContextBenefits** | id, createdAt, title, description, windowStart, windowEnd, fehbLink, fedvipLink, fsafedsLink, faqLink, pocFirstName, pocLastName, pocEmail, pocPhone, pocDepartment, annualRecurrence, companyId, originatorId | company: Company, originator: WorkMe | ✅ Good - Maps to MyWork → Contexts |
| **WorkContextCareer** | id, createdAt, title, description, deadlines, supervisorName, resourceLink, pocFirstName, pocLastName, pocEmail, pocPhone, pocDepartment, companyId, originatorId | company: Company, originator: WorkMe | ✅ Good - Maps to MyWork → Contexts |
| **WorkContextEmployeeCause** | id, createdAt, title, description, partnerOrg, windowStart, windowEnd, location, neededItems, collectionPoints, signUpLink, pocFirstName, pocLastName, pocEmail, pocPhone, sponsoringDepartment, companyId, originatorId | company: Company, originator: WorkMe | ✅ Good - Maps to MyWork → Contexts |
| **WorkSupport** | id, createdAt, updatedAt, eventRouterId, companyId, originatorId, supportType, selectedOutputs, evolvingInfo, assets, status | eventRouter: WorkEventRouter, company: Company, originator: WorkMe, outputs: WorkOutput[] | ✅ Good - Maps to MyWork → Support |
| **WorkOutput** | id, createdAt, updatedAt, eventRouterId, supportId, workforceCommsId, companyId, originatorId, outputType, dataJson, status | eventRouter: WorkEventRouter?, support: WorkSupport?, workforceComms: WorkforceComms?, company: Company, originator: WorkMe | ✅ Good - Maps to MyWork → Outputs |

### 3.5 Workforce Communications Models

| Model | Fields | Relations | Architecture Alignment |
|-------|--------|-----------|----------------------|
| **WorkforceComms** | workforceCommsId, type, name, description, createdAt, updatedAt, companyId, originatorId | company: Company, originator: WorkMe, editions: WorkforceCommsEdition[], drafts: WorkforceCommsDraft[], workOutputs: WorkOutput[] | ⚠️ Legacy - Email system, different from WorkforceStuffItem |
| **WorkforceCommsDraft** | draftId, workforceCommsId, eventRouterIds, lastEditionId, authorNotes, whatChanged, priorityNotes, status, createdAt, updatedAt | product: WorkforceComms, lastEdition: WorkforceCommsEdition?, company: Company, originator: WorkMe | ⚠️ Legacy - Email system |
| **WorkforceCommsEdition** | editionId, workforceCommsId, subject, body, sentAt, createdAt, updatedAt | product: WorkforceComms, referencedBy: WorkforceCommsDraft[], company: Company, originator: WorkMe | ⚠️ Legacy - Email system |

### 3.6 Standalone Output Model

| Model | Fields | Relations | Architecture Alignment |
|-------|--------|-----------|----------------------|
| **WorkOutputStandalone** | id, createdAt, updatedAt, outputType, title, description, draftContent, metadata, workSupportId, companyId, originatorId | company: Company, originator: WorkMe | ✅ Good - Maps to MyWork → Outputs |

### 3.7 NTK Models (Legacy Feature)

| Model | Fields | Relations | Architecture Alignment |
|-------|--------|-----------|----------------------|
| **NTK** | ntkId, createdAt, updatedAt, header, poc, summary, sourceText, draftContent, metadata, companyId, originatorId | company: Company, originator: WorkMe | ⚠️ Legacy Feature - Standalone NTK system |
| **NTKEdition** | id, createdAt, updatedAt, date, title, originatorId, companyId | originator: WorkMe, company: Company, items: NTKItem[] | ⚠️ Legacy Feature |
| **NTKItem** | id, editionId, inputId, rawFields, validated, plainLanguage, feedback, status, createdAt, updatedAt | edition: NTKEdition | ⚠️ Legacy Feature |

### 3.8 Holiday Models (Legacy Feature)

| Model | Fields | Relations | Architecture Alignment |
|-------|--------|-----------|----------------------|
| **Holiday** | id, name, slug, createdAt, updatedAt | assets: Asset[] | ⚠️ Legacy Feature - Holiday asset system |
| **Asset** | id, url, fileName, category, holidaySlug, createdAt | holiday: Holiday? | ⚠️ Legacy Feature |

### 3.9 Missing Models (Referenced in New Architecture)

| Model | Status | Notes |
|-------|--------|-------|
| **WorkforceStuffItem** | ❌ Missing | Referenced in `/mycompany/workforcestuff` page but not in Prisma. Should be a unified model for events, training, benefits, campaigns, etc. |
| **WorkSignal** | ❌ Missing | Referenced in `/mycompany/worksignal` page but not in Prisma. Should represent company-level signals/announcements. |

### 3.10 Model Alignment Summary

**✅ Aligned Models:**
- WorkMe, Company, WorkMeCompany, SuperAdmin (Core identity)
- WorkWorld models (CompanyRegistry, CompanyUnit, Workplace, CompanyRole)
- WorkContext* models (all 7 types)
- WorkEventRouter, WorkEvent, EventItem, PromotionalWorkItem
- WorkSupport, WorkOutput, WorkOutputStandalone

**⚠️ Legacy/Deprecated Models:**
- CommsOutput, Objective, Achievement (deprecated but still in schema)
- WorkforceComms, WorkforceCommsDraft, WorkforceCommsEdition (email system, not WorkforceStuff)
- NTK, NTKEdition, NTKItem (legacy feature)
- Holiday, Asset (legacy feature)

**❌ Missing Models:**
- WorkforceStuffItem (unified model for company-level happenings)
- WorkSignal (company-level signals/announcements)

---

## 4. COMPONENT MAP

### 4.1 MyCompany Components

| Component | Location | Purpose | Architecture Status |
|-----------|----------|---------|---------------------|
| None found | - | No dedicated MyCompany components | ⚠️ Missing - Components may be inline in pages |

### 4.2 MyWork Components

| Component | Location | Purpose | Architecture Status |
|-----------|----------|---------|---------------------|
| **SidebarNav** | `components/mywork/SidebarNav.tsx` | Sidebar navigation for MyWork pages | ✅ Good - Used across MyWork pages |

### 4.3 Event Components

| Component | Location | Purpose | Architecture Status |
|-----------|----------|---------|---------------------|
| **EventAIForm** | `components/events/EventAIForm.tsx` | AI-powered event creation form | ✅ Good - Used in event creation |
| **EventCreationFork** | `components/events/EventCreationFork.tsx` | Event creation type selector | ✅ Good |
| **EventManualForm** | `components/events/EventManualForm.tsx` | Manual event creation form | ✅ Good |
| **EventReviewScreen** | `components/events/EventReviewScreen.tsx` | Event review before save | ✅ Good |
| **EventTemplatePicker** | `components/events/EventTemplatePicker.tsx` | Event template selection | ✅ Good |

### 4.4 Holiday Components (Legacy Feature)

| Component | Location | Purpose | Architecture Status |
|-----------|----------|---------|---------------------|
| **AssetCard** | `components/holiday/AssetCard.tsx` | Holiday asset card display | ⚠️ Legacy Feature |
| **AssetCategorySelector** | `components/holiday/AssetCategorySelector.tsx` | Asset category selector | ⚠️ Legacy Feature |
| **AssetGrid** | `components/holiday/AssetGrid.tsx` | Asset grid display | ⚠️ Legacy Feature |
| **DownloadPackageButton** | `components/holiday/DownloadPackageButton.tsx` | Download asset package | ⚠️ Legacy Feature |
| **HolidayGeneratorPanel** | `components/holiday/HolidayGeneratorPanel.tsx` | Holiday generator UI | ⚠️ Legacy Feature |
| **HolidaySelector** | `components/holiday/HolidaySelector.tsx` | Holiday selection dropdown | ⚠️ Legacy Feature |

### 4.5 NTK Components (Legacy Feature)

| Component | Location | Purpose | Architecture Status |
|-----------|----------|---------|---------------------|
| **CSVUpload** | `components/ntk/CSVUpload.tsx` | CSV upload for NTK | ⚠️ Legacy Feature |
| **NTKPreview** | `components/ntk/NTKPreview.tsx` | NTK preview display | ⚠️ Legacy Feature |

### 4.6 Component Gaps

**Missing Components:**
- No dedicated components for WorkforceStuffItem display/creation
- No dedicated components for WorkSignal display/creation
- No dedicated components for MyCareer features
- No dedicated components for MyNetwork features
- Most components are inline in pages rather than reusable

---

## 5. ARCHITECTURE ALIGNMENT REPORT

### 5.1 Dashboard

**Current Routes/Components:**
- ✅ `/dashboard` - Main dashboard page with 3-card scaffold
- ✅ Uses `SidebarNav` component
- ✅ Links to `/career` (legacy), `/events` (legacy), `/tasks` (legacy)

**Alignment Status:** ✅ **Good** - Dashboard exists and is stable

**Migration Needed:**
- Update links to point to new routes (`/mycareer/track`, `/mycompany/worksignal`, `/mywork/tasks`)

### 5.2 MyCompany

**Current Routes:**
- ✅ `/mycompany/profile` - Company profile (good)
- ⚠️ `/mycompany/workforcestuff` - Page exists but no backend model
- ⚠️ `/mycompany/worksignal` - Page exists but no backend model
- ✅ `/mycompany/milestones` - Company milestones (good)

**Legacy Routes Needing Migration:**
- 🔄 `/profile` → `/mycompany/profile`
- 🔄 `/workforce-comms` → Keep separate (this is email system, not WorkforceStuff)
- 🔄 `/events` → `/mycompany/worksignal` OR `/mywork/events` (unclear which)
- 🔄 `/milestones` (root) → `/mycompany/milestones/new`

**Prisma Models:**
- ✅ `Company` - Fully aligned
- ❌ `WorkforceStuffItem` - **MISSING** (referenced in page but not in schema)
- ❌ `WorkSignal` - **MISSING** (referenced in page but not in schema)
- ⚠️ `WorkforceComms` - Exists but is email system, not WorkforceStuff

**Alignment Status:** ⚠️ **Partial** - Structure exists but missing core models

**Migration Needed:**
1. Create `WorkforceStuffItem` model in Prisma
2. Create `WorkSignal` model in Prisma
3. Migrate `/profile` → `/mycompany/profile`
4. Clarify `/events` routing (company-level vs work-level)

### 5.3 MyWork

**Current Routes:**
- ✅ `/mywork` - WorkplaceSandbox hub (good)
- ✅ `/mywork/context/*` - All context types (good)
- ✅ `/mywork/events` - Events listing (good)
- ✅ `/mywork/outputs` - Output creation (good)
- ✅ `/mywork/support/*` - WorkSupport (good)
- ✅ `/mywork/active` - Active work (good)
- ✅ `/mywork/fromcompanystuff` - Work from company stuff (good)

**Legacy Routes Needing Migration:**
- 🔄 `/tasks` → `/mywork/tasks`
- 🔄 `/tasks/new` → `/mywork/tasks/new`
- 🔄 `/tasks/[taskId]` → `/mywork/tasks/[taskId]`

**Prisma Models:**
- ✅ `WorkEventRouter` - Fully aligned
- ✅ `WorkContext*` (all 7 types) - Fully aligned
- ✅ `WorkEvent`, `EventItem`, `PromotionalWorkItem` - Fully aligned
- ✅ `WorkSupport` - Fully aligned
- ✅ `WorkOutput`, `WorkOutputStandalone` - Fully aligned

**Components:**
- ✅ `SidebarNav` - Good
- ✅ Event components (5 components) - Good

**Alignment Status:** ✅ **Excellent** - MyWork is well-structured and aligned

**Migration Needed:**
1. Migrate `/tasks/*` routes under `/mywork/tasks/*`

### 5.4 MyCareer

**Current Routes:**
- ✅ `/mycareer/achievements` - Page exists (stub - "Coming Soon")
- ✅ `/mycareer/reflections` - Page exists (stub)
- ✅ `/mycareer/track` - Page exists (stub)

**Legacy Routes Needing Migration:**
- 🔄 `/career` → `/mycareer/track`

**Prisma Models:**
- ⚠️ `Achievement` - Exists but deprecated, not implemented
- ⚠️ `Objective` - Exists but deprecated, not implemented
- ⚠️ `CommsOutput` - Exists but deprecated, not implemented

**Alignment Status:** ⚠️ **Stubs Only** - Pages exist but features not implemented

**Migration Needed:**
1. Migrate `/career` → `/mycareer/track`
2. Decide on Achievement/Objective/CommsOutput models (keep or remove)
3. Implement MyCareer features if keeping models

### 5.5 MyNetwork

**Current Routes:**
- ✅ `/mynetwork/connections` - Page exists (stub - "Coming Soon")
- ✅ `/mynetwork/suggestions` - Page exists (stub)

**Legacy Routes Needing Migration:**
- 🔄 `/connections` → `/mynetwork/connections`
- 🔄 `/connections/new` → `/mynetwork/connections/new`

**Prisma Models:**
- ❌ `Connection` - **MISSING** (commented out in schema)

**Alignment Status:** ⚠️ **Stubs Only** - Pages exist but features not implemented

**Migration Needed:**
1. Migrate `/connections/*` routes under `/mynetwork/connections/*`
2. Uncomment or recreate `Connection` model if needed
3. Implement MyNetwork features

### 5.6 Settings

**Current Routes:**
- 🔄 `/setup` - Setup page (deprecated features)

**Alignment Status:** 🔄 **Needs Rename** - Should be `/settings`

**Migration Needed:**
1. Rename `/setup` → `/settings`
2. Update or remove deprecated features (Objectives, CommsOutputs)

---

## 6. GAPS & RISKS

### 6.1 Missing Routes

**High Priority:**
- ❌ `/mywork/tasks` - Tasks listing (currently at `/tasks`)
- ❌ `/mywork/tasks/new` - Create task (currently at `/tasks/new`)
- ❌ `/mywork/tasks/[taskId]` - Task detail (currently at `/tasks/[taskId]`)
- ❌ `/settings` - Settings page (currently at `/setup`)

**Medium Priority:**
- ⚠️ `/mycompany/workforcestuff/[id]` - Detail page exists but no backend
- ⚠️ `/mycompany/worksignal/[id]` - Detail page exists but no backend

### 6.2 Missing Prisma Models

**Critical:**
- ❌ **WorkforceStuffItem** - Referenced in `/mycompany/workforcestuff` page but not in schema
  - Should unify: events, training, benefits, campaigns, impact events, causes, communities, announcements
  - Currently these are separate WorkContext* models, but WorkforceStuff needs a unified view

- ❌ **WorkSignal** - Referenced in `/mycompany/worksignal` page but not in schema
  - Should represent company-level signals/announcements
  - Unclear relationship to WorkEvent or WorkforceStuffItem

**Optional:**
- ⚠️ **Connection** - Commented out in schema, needed for MyNetwork
  - Currently commented out: `// model Connection { ... }`
  - Needed if MyNetwork features are to be implemented

### 6.3 Model Refactoring Needs

**WorkforceStuffItem Unification:**
- Current: Separate models for each context type (WorkContextCampaign, WorkContextTraining, etc.)
- Proposed: Unified WorkforceStuffItem model that references WorkContext* models
- Risk: Breaking change if WorkforceStuffItem replaces WorkContext* models
- Recommendation: Create WorkforceStuffItem as a view/aggregation layer, not replacement

**WorkSignal Clarification:**
- Unclear if WorkSignal should be:
  - A separate model for company announcements
  - A filtered view of WorkEvents
  - A type of WorkforceStuffItem
- Risk: Duplicate data if WorkSignal duplicates WorkEvent
- Recommendation: Define WorkSignal as a type of WorkforceStuffItem or a view of WorkEvents

### 6.4 API Route Risks

**Potential Breaking Changes:**
- ⚠️ `/api/workforce-comms/*` - Email system, not WorkforceStuff
  - Risk: Confusion between WorkforceComms (email) and WorkforceStuff (unified items)
  - Recommendation: Keep separate, rename WorkforceComms to WorkforceCommsEmail for clarity

- ⚠️ `/api/context/*` - Works with WorkContext* models
  - Risk: If WorkforceStuffItem is created, may need new API routes
  - Recommendation: Create `/api/workforce-stuff/*` routes that aggregate WorkContext* data

**Missing API Routes:**
- ❌ `/api/workforce-stuff` - List unified workforce stuff items
- ❌ `/api/workforce-stuff/[id]` - Get workforce stuff item
- ❌ `/api/worksignal` - List work signals
- ❌ `/api/worksignal/[id]` - Get work signal

### 6.5 Naming Inconsistencies

**Route Naming:**
- ⚠️ `/workforce-comms` vs `/mycompany/workforcestuff` - Different concepts (email vs unified items)
- ⚠️ `/events` vs `/mywork/events` vs `/mycompany/worksignal` - Unclear event routing
- ⚠️ `/attention/events/*` - Special event promotion flow, unclear relationship

**Model Naming:**
- ⚠️ `WorkforceComms` vs `WorkforceStuffItem` - Different concepts, similar names
- ⚠️ `WorkEvent` vs `WorkSignal` - Unclear distinction

### 6.6 Legacy Feature Dependencies

**NTK System:**
- ⚠️ Standalone NTK system with own routes, models, components
- Risk: May conflict with WorkOutput system if NTK becomes a WorkOutput type
- Recommendation: Keep separate for now, consider integration later

**Holiday System:**
- ⚠️ Standalone holiday asset system
- Risk: May need integration with WorkforceStuffItem if holidays become company happenings
- Recommendation: Keep separate for now

**Goals System:**
- ⚠️ Goals routes exist but unclear relationship to MyCareer
- Risk: May need integration with MyCareer tracking
- Recommendation: Clarify relationship or remove if unused

### 6.7 Component Architecture Gaps

**Missing Reusable Components:**
- ❌ WorkforceStuffItem card/list component
- ❌ WorkSignal card/list component
- ❌ MyCareer achievement/reflection components
- ❌ MyNetwork connection components
- ⚠️ Most components are inline in pages, not reusable

**Recommendation:**
- Extract reusable components for common patterns
- Create component library for MyCompany, MyWork, MyCareer, MyNetwork

### 6.8 Context Directory Structure

**Current Structure:**
- `/mywork/context/` - Contains all context type creation pages
- `/mywork/context/new/[type]` - Type-specific creation pages

**Status:** ✅ **Good** - Well-organized, no refactoring needed

**Note:** This is the "context" directory mentioned in requirements - it's already well-structured and doesn't need refactoring.

---

## 7. SUMMARY & RECOMMENDATIONS

### 7.1 Critical Gaps

1. **Missing Models:**
   - `WorkforceStuffItem` - Needed for `/mycompany/workforcestuff`
   - `WorkSignal` - Needed for `/mycompany/worksignal`

2. **Route Migrations:**
   - `/profile` → `/mycompany/profile`
   - `/tasks/*` → `/mywork/tasks/*`
   - `/career` → `/mycareer/track`
   - `/connections/*` → `/mynetwork/connections/*`
   - `/setup` → `/settings`
   - `/events` → Clarify routing (company vs work level)

3. **Missing API Routes:**
   - `/api/workforce-stuff/*` - For unified workforce stuff
   - `/api/worksignal/*` - For work signals

### 7.2 Architecture Strengths

1. ✅ **MyWork** - Well-structured, fully aligned
2. ✅ **WorkContext** - All 7 types implemented
3. ✅ **WorkOutput** - Fully implemented
4. ✅ **WorkSupport** - Fully implemented
5. ✅ **Dashboard** - Stable structure

### 7.3 Architecture Weaknesses

1. ⚠️ **MyCompany** - Missing core models (WorkforceStuffItem, WorkSignal)
2. ⚠️ **MyCareer** - Stubs only, deprecated models
3. ⚠️ **MyNetwork** - Stubs only, missing Connection model
4. ⚠️ **Legacy Routes** - Many routes need migration
5. ⚠️ **Naming Confusion** - WorkforceComms vs WorkforceStuff, WorkEvent vs WorkSignal

### 7.4 Recommended Next Steps

**Phase 1: Model Creation**
1. Create `WorkforceStuffItem` model (unified view of WorkContext* models)
2. Create `WorkSignal` model (or clarify as type of WorkforceStuffItem)
3. Uncomment or recreate `Connection` model if needed

**Phase 2: Route Migration**
1. Migrate `/profile` → `/mycompany/profile`
2. Migrate `/tasks/*` → `/mywork/tasks/*`
3. Migrate `/career` → `/mycareer/track`
4. Migrate `/connections/*` → `/mynetwork/connections/*`
5. Rename `/setup` → `/settings`
6. Clarify `/events` routing

**Phase 3: API Route Creation**
1. Create `/api/workforce-stuff/*` routes
2. Create `/api/worksignal/*` routes
3. Update existing routes to use new models

**Phase 4: Component Extraction**
1. Create reusable WorkforceStuffItem components
2. Create reusable WorkSignal components
3. Extract common patterns into component library

**Phase 5: Feature Implementation**
1. Implement MyCareer features (if keeping models)
2. Implement MyNetwork features
3. Complete WorkforceStuffItem backend

---

## 8. APPENDIX: FILE COUNTS

- **Total Page Routes:** 87
- **Total API Routes:** 38
- **Total Prisma Models:** 28 (including commented out)
- **Total Components:** 13
- **Legacy Routes Needing Migration:** ~15
- **Missing Models:** 2 (WorkforceStuffItem, WorkSignal)
- **Stub Pages:** 5 (MyCareer: 3, MyNetwork: 2)

---

**Report End**

