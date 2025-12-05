# WorkMe Architecture

**Version:** 1.0  
**Last Updated:** 2025-01-04  
**Status:** Production

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Identity Model](#identity-model)
3. [Profile System](#profile-system)
4. [Company & Division Registry](#company--division-registry)
5. [Work History](#work-history)
6. [Skills Intelligence](#skills-intelligence)
7. [API Architecture](#api-architecture)
8. [Data Flow Patterns](#data-flow-patterns)
9. [Key Design Decisions](#key-design-decisions)

---

## Core Principles

### 1. **WorkMe as Universal Identity Container**

`WorkMe` is the **single source of truth** for user identity. It is a pure identity model with:
- ✅ Firebase authentication linkage (`firebaseId`)
- ✅ Email (unique identifier)
- ✅ **NO** personal data (firstName, lastName, photoUrl)
- ✅ **NO** employment data (company, division, job title)
- ✅ **NO** skills or capabilities

**Why:** Clean separation of concerns. WorkMe = "Who you are" (identity only). All other data lives in specialized modules.

### 2. **Modular Intelligence Architecture**

Each capability area is a **standalone module** attached directly to `WorkMe`:

```
WorkMe (Identity)
├── WorkProfile (Personal Identity)
├── WorkEntry[] (Work History)
├── MySkills (Capability Intelligence)
├── MyWorkOutlook (Productivity)
└── AdminWorkItem[] (Admin Tasks)
```

**Why:** Scalability. Each module can evolve independently without affecting others.

### 3. **Registry Pattern for Reusable Entities**

Company and Division use a **registry pattern** (like `RaceRegistry` in GoFast):
- Searchable, reusable entities
- Many users can reference the same company/division
- Prevents data duplication
- Enables company-wide features

---

## Identity Model

### WorkMe Model

```prisma
model WorkMe {
  id         String   @id @default(uuid())
  firebaseId String?  @unique
  email      String   @unique
  createdAt  DateTime @default(now())

  // One-to-one relations
  profile     WorkProfile?
  mySkills    MySkills?
  myWorkOutlook MyWorkOutlook?

  // One-to-many relations
  workEntries WorkEntry[]
  adminWorkItems AdminWorkItem[]

  // WorkWorld Architecture (for hierarchical orgs)
  workplaces             Workplace[]
  companyUnitMemberships CompanyUnitMembers[]

  // Reverse relations (for Prisma validation only)
  // WorkMe is pure identity - work outputs reference WorkMe via createdByWorkMeId
  originatedCommsOutputs       CommsOutput[]
  originatedObjectives         Objective[]
  originatedAchievements       Achievement[]
  createdWorkOutputStandalones WorkOutputStandalone[]
  // ... other work output relations
}
```

**Key Points:**
- ✅ Pure identity container
- ✅ No personal or employment data
- ✅ All modules attach via foreign keys
- ✅ Universal reference point for all user data

---

## Profile System

### WorkProfile Model

```prisma
model WorkProfile {
  id              String  @id @default(cuid())
  userId          String  @unique // References WorkMe.id
  firstName       String?
  lastName        String?
  headline        String? // LinkedIn-style headline
  currentRole     String? // Optional current role display
  handle          String  @unique // Unique username
  linkedinUrl     String?
  profileImage    String? // Profile photo URL
  
  // Workforce affiliation (registry pattern)
  companyUnitId   String?  // FK to CompanyUnit
  divisionUnitId  String?   // FK to DivisionUnit

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      WorkMe         @relation(fields: [userId], references: [id], onDelete: Cascade)
  company   CompanyUnit?   @relation(fields: [companyUnitId], references: [id])
  division  DivisionUnit?   @relation(fields: [divisionUnitId], references: [id])
}
```

**Purpose:** Personal identity only (like GoFast Athlete profile)

**Fields:**
- ✅ Personal identity (firstName, lastName, headline, handle)
- ✅ Professional presence (linkedinUrl, profileImage)
- ✅ Current role display (optional)
- ✅ Company/Division affiliation (via relationships)

**NOT Included:**
- ❌ Employment history (belongs in WorkEntry)
- ❌ Skills (belongs in MySkills)
- ❌ Job responsibilities (belongs in MySkills)

**API Endpoints:**
- `GET /api/workme/profile` - Get profile
- `PUT /api/workme/profile` - Update profile

---

## Company & Division Registry

### Registry Pattern

Companies and Divisions are **reusable registry entities**, similar to `RaceRegistry` in GoFast:

```prisma
// Company Registry (One canonical record per company)
model CompanyUnit {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  divisions DivisionUnit[]
  profiles  WorkProfile[]
  workEntries WorkEntry[]
}

// Division Registry (Parent → CompanyUnit, unique on name + companyUnitId)
model DivisionUnit {
  id            String   @id @default(uuid())
  name          String
  companyUnitId String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  company CompanyUnit @relation(fields: [companyUnitId], references: [id], onDelete: Cascade)
  profiles WorkProfile[]
}
```

**Key Features:**
- ✅ **Searchable** - Users can search for existing companies/divisions
- ✅ **Reusable** - Many users can reference the same company/division
- ✅ **Unique** - CompanyUnit.name is unique globally
- ✅ **Hierarchical** - DivisionUnit belongs to CompanyUnit

**Workflow:**
1. User types company name → Search CompanyUnit registry
2. If found → Select existing
3. If not found → Create new CompanyUnit
4. Same for DivisionUnit (within selected CompanyUnit)

**API Endpoints:**
- `POST /api/company/search` - Search CompanyUnit registry
- `POST /api/company/create` - Create new CompanyUnit
- `POST /api/division/search` - Search DivisionUnit registry
- `POST /api/division/create` - Create new DivisionUnit
- `POST /api/profile/company-division/save` - Save to WorkProfile

**Location:** Company/Division editing is in `/settings/company` (Settings page)

---

## Work History

### WorkEntry Model

```prisma
model WorkEntry {
  id            String    @id @default(cuid())
  userId        String    // References WorkMe.id
  companyUnitId String    // References CompanyUnit.id
  division      String?   // Simple string for MVP1
  title         String?   // Job title
  startDate     DateTime? // Employment start date
  endDate       DateTime? // Employment end date (null = current)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user        WorkMe      @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyUnit CompanyUnit @relation(fields: [companyUnitId], references: [id], onDelete: Cascade)
}
```

**Purpose:** Store work history (current + past jobs)

**Key Points:**
- ✅ **Junction table** - Links WorkMe to CompanyUnit
- ✅ **Multiple entries** - Each WorkMe can have many WorkEntries
- ✅ **Current job** - `endDate = null` indicates current employment
- ✅ **Division** - Simple string for MVP1 (can be upgraded to DivisionUnit later)

**API Endpoints:**
- `POST /api/work-entry/create` - Create new WorkEntry
- `GET /api/work-entry/list` - List all WorkEntries for user

**Note:** WorkProfile.companyUnitId is for **current affiliation** (quick reference). WorkEntry is for **full work history**.

---

## Skills Intelligence

### MySkills Model

```prisma
model MySkills {
  id       String @id @default(cuid())
  workMeId String @unique // Foreign key to WorkMe.id

  // User-entered freeform inputs
  mySkillsRaw              String? // "What do you do?"
  myJobResponsibilitiesRaw String? // "What are your tasks?"
  myStrengthsRaw           String? // "What are your specialties?"

  // AI-enriched fields
  mySkillsAI              String?
  myJobResponsibilitiesAI String?
  myStrengthsAI           String?

  // Reserved for future: JSON snapshot for intelligence graph
  insightSnapshot String? // optional, JSON blob

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workMe WorkMe @relation(fields: [workMeId], references: [id], onDelete: Cascade)
}
```

**Purpose:** Standalone intelligence module for user capabilities

**Key Points:**
- ✅ **Attached directly to WorkMe** - Not to Profile or WorkEntry
- ✅ **Raw + AI-enriched** - User inputs + AI-generated insights
- ✅ **Future-ready** - `insightSnapshot` for intelligence graph

**API Endpoints:**
- `GET /api/myskills` - Get MySkills
- `PUT /api/myskills/save-raw` - Save raw user inputs
- `POST /api/myskills/enrich` - Trigger AI enrichment

---

## API Architecture

### Authentication

All API routes use Firebase authentication:

```typescript
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// In route handler:
const { firebaseId } = await verifyAuth(request as Request)
const workMe = await loadWorkMe(firebaseId)
const { id: workMeId } = workMe
```

**Pattern:**
1. Verify Firebase token → Get `firebaseId`
2. Load WorkMe by `firebaseId` → Get `workMeId`
3. Use `workMeId` for all database operations

### Core API Routes

#### Identity & Profile
- `POST /api/workme/create` - Find or create WorkMe
- `GET /api/workme/me` - Get current user's complete profile
- `GET /api/workme/hydrate` - Hydrate session (basic WorkMe only)
- `GET /api/workme/profile` - Get WorkProfile
- `PUT /api/workme/profile` - Update WorkProfile

#### Company & Division
- `POST /api/company/search` - Search CompanyUnit registry
- `POST /api/company/create` - Create CompanyUnit
- `POST /api/division/search` - Search DivisionUnit registry
- `POST /api/division/create` - Create DivisionUnit
- `POST /api/profile/company-division/save` - Save to WorkProfile

#### Work History
- `POST /api/work-entry/create` - Create WorkEntry
- `GET /api/work-entry/list` - List WorkEntries

#### Skills
- `GET /api/myskills` - Get MySkills
- `PUT /api/myskills/save-raw` - Save raw inputs
- `POST /api/myskills/enrich` - AI enrichment

---

## Data Flow Patterns

### User Onboarding Flow

```
1. Sign Up (Firebase)
   ↓
2. POST /api/workme/create
   - Find or create WorkMe
   - Create WorkProfile (with temp handle)
   ↓
3. User completes profile
   - PUT /api/workme/profile (headline, handle, etc.)
   ↓
4. User sets company affiliation
   - POST /api/company/search → Select or create
   - POST /api/division/search → Select or create
   - POST /api/profile/company-division/save
   ↓
5. User adds work history (optional)
   - POST /api/work-entry/create
   ↓
6. User adds skills (optional)
   - PUT /api/myskills/save-raw
   - POST /api/myskills/enrich
```

### Profile Hydration Flow

```
1. User loads dashboard
   ↓
2. GET /api/workme/hydrate
   - Returns basic WorkMe (id, email, firebaseId)
   ↓
3. GET /api/workme/profile (parallel)
   - Returns WorkProfile + company/division
   ↓
4. PersonalUX component checks:
   - Profile complete? (headline + handle)
   - Company set? (companyUnitId)
   - Goals set? (objectives)
   - Skills set? (mySkillsRaw)
```

---

## Key Design Decisions

### 1. Why WorkMe is Pure Identity

**Decision:** WorkMe contains only `id`, `firebaseId`, `email`, `createdAt`

**Rationale:**
- ✅ Single responsibility - Identity only
- ✅ Scalability - Modules can evolve independently
- ✅ Clean separation - Personal data in WorkProfile, employment in WorkEntry
- ✅ Future-proof - Easy to add new modules

### 2. Why Registry Pattern for Company/Division

**Decision:** CompanyUnit and DivisionUnit are reusable registry entities

**Rationale:**
- ✅ Prevents duplication - One "Microsoft" record, many users reference it
- ✅ Enables company-wide features - Can query all users in a company
- ✅ Searchable - Users can find existing companies
- ✅ Consistent - Same company name for all users

### 3. Why WorkProfile Has Company/Division

**Decision:** WorkProfile stores `companyUnitId` and `divisionUnitId` for current affiliation

**Rationale:**
- ✅ Quick reference - Don't need to query WorkEntry for current company
- ✅ Profile display - Show company on profile page
- ✅ Scoping - Can filter by company for features
- ✅ Separate from history - WorkEntry is for full work history

### 4. Why WorkEntry is Separate from WorkProfile

**Decision:** Work history stored in WorkEntry, not WorkProfile

**Rationale:**
- ✅ Multiple jobs - User can have many WorkEntries
- ✅ Historical data - Past jobs with start/end dates
- ✅ Current job - `endDate = null` indicates current
- ✅ Clean profile - WorkProfile stays focused on identity

### 5. Why MySkills is Attached to WorkMe

**Decision:** MySkills has `workMeId`, not `profileId` or `workEntryId`

**Rationale:**
- ✅ Personal capability - Skills belong to the person, not a job
- ✅ Persistent - Skills survive job changes
- ✅ Scalable - Can add more intelligence modules
- ✅ Consistent - All modules attach to WorkMe

---

## Module Relationship Overview

```
WorkMe (Identity Container)
│
├── WorkProfile (Personal Identity)
│   ├── firstName, lastName, headline, handle
│   ├── linkedinUrl, profileImage
│   └── companyUnitId, divisionUnitId (current affiliation)
│
├── WorkEntry[] (Work History)
│   ├── companyUnitId (which company)
│   ├── division, title (job details)
│   └── startDate, endDate (employment period)
│
├── MySkills (Capability Intelligence)
│   ├── mySkillsRaw, myJobResponsibilitiesRaw, myStrengthsRaw
│   └── mySkillsAI, myJobResponsibilitiesAI, myStrengthsAI
│
├── MyWorkOutlook (Productivity)
│   └── MyWorkItem[] (tasks, notes, status)
│
└── AdminWorkItem[] (Admin Tasks)
    └── title, notes, status
```

**All modules key to `workMeId`** - This ensures:
- ✅ Clean separation of concerns
- ✅ Scalable architecture
- ✅ Easy to query by user
- ✅ Consistent pattern across all modules

---

## Navigation & UX

### Avatar Menu (Top Right)

- **Your Profile** → `/profile` (Personal identity only)
- **Settings** → `/settings` (Account settings)
  - **Company & Division** → `/settings/company` (Edit affiliation)
- **Sign Out**

### Sidebar Navigation

**MyCompany:**
- Workforce Stuff
- Company Milestones
- WorkSignal

**MyWork:**
- Create Output
- Work From Company Stuff
- Stuff I'm Working On
- My Work Outlook
- Admin

**MyCareer:**
- Career Track
- Achievements
- Reflections

**Note:** "My Workforce Profile" was removed from sidebar. Company affiliation editing is now in Settings.

---

## Database Schema Summary

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `WorkMe` | Identity container | `id`, `firebaseId`, `email` |
| `WorkProfile` | Personal identity | `userId`, `headline`, `handle`, `companyUnitId`, `divisionUnitId` |
| `CompanyUnit` | Company registry | `id`, `name` (unique) |
| `DivisionUnit` | Division registry | `id`, `name`, `companyUnitId` |
| `WorkEntry` | Work history | `userId`, `companyUnitId`, `title`, `startDate`, `endDate` |
| `MySkills` | Capability intelligence | `workMeId`, `mySkillsRaw`, `mySkillsAI` |

### Relationships

- `WorkMe` → `WorkProfile` (1:1)
- `WorkMe` → `WorkEntry[]` (1:many)
- `WorkMe` → `MySkills` (1:1)
- `WorkProfile` → `CompanyUnit` (many:1)
- `WorkProfile` → `DivisionUnit` (many:1)
- `WorkEntry` → `CompanyUnit` (many:1)

---

## Future Considerations

### Potential Enhancements

1. **DivisionUnit in WorkEntry**
   - Currently: `division` is a string
   - Future: Could link to `DivisionUnit` model

2. **Skills Intelligence Graph**
   - `insightSnapshot` field reserved for future intelligence features
   - Could build capability graph from skills data

3. **Company-Wide Features**
   - Registry pattern enables company-wide queries
   - Could add company dashboards, company-wide signals

4. **Work History Enhancements**
   - Could add job descriptions, achievements per job
   - Could link WorkEntry to MySkills for job-specific skills

---

## Migration Notes

### Key Migrations

1. **WorkProfile Separation** - Moved personal data from WorkMe to WorkProfile
2. **CompanyUnit Registry** - Created registry pattern for companies
3. **WorkEntry Creation** - Created junction table for work history
4. **MySkills Module** - Created standalone skills intelligence module

### Deprecated Fields

- ❌ `WorkMe.firstName`, `lastName`, `photoUrl` → Moved to `WorkProfile`
- ❌ `WorkMe.companyUnit`, `companyDivision` → Moved to `WorkProfile.companyUnitId`, `divisionUnitId`
- ❌ `WorkMe.specialty`, `jobTitle` → Moved to `WorkEntry` or `MySkills`

---

## References

- **Prisma Schema:** `/prisma/schema.prisma`
- **API Routes:** `/app/api/`
- **Components:** `/components/`
- **Documentation:** `/docs/`

---

**Last Updated:** 2025-01-04  
**Maintained By:** WorkMe Development Team

