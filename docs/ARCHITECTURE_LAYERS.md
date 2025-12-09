# WorkMe Architecture Layers

## 🟦 LAYER 1 — WORKME (IDENTITY LAYER)

**Concern**: The person, their identity, their skills, their preferences, their personal workspace.

**WorkMe answers**: 👉 **"Who is the user?"**

### What Belongs to WorkMe (Exclusive Responsibilities)

#### 1. Identity & Profile
- `id` (workMeId)
- `email`
- `firebaseId`
- `handle`, `headline`, `title`
- `linkedinUrl`

#### 2. Default Organizational Context
- `companyId` (the user's authoritative org FK)
- `companyUnit` (label only - optional string)
- `workMeCompanyId` (silent tag for partitioning)

#### 3. Personal/Professional Modules
- `WorkProfile` (job role, seniority, summary)
- `WorkSkills` (skills, strengths, specialties)
- `WorkEntry[]` (work history)
- `WorkGoal[]` (personal goals)
- `WorkOpsOutlook` (task/ops brain)
- `WorkOpsItem[]` (items inside the outlook)

#### 4. User-Created Outputs
Anything authored by the user:
- `CommsOutputs`
- `Objectives`
- `Achievements`
- `EngageMessages`
- `DigitalSigns`
- `CompanyEvents`, `CompanyTrainings` they create
- `Highlights` they create (but highlight data belongs to Company domain)

#### 5. Ecosystem Intelligence (User-Centric CRM Layer)
- `MyEcosystemContacts`
- `WorkMeEcosystemCompany[]`
- `EcosystemPeople[]` (followed experts)
- `EcosystemCompanies[]` (derived)

#### 6. Personal Hydration
- On `/welcome` you hydrate WorkMe exactly once
- Store full object in localStorage
- Access via `getWorkMe()`

### WorkMe Does NOT Manage
- ❌ employees
- ❌ workforce org structure
- ❌ highlight associations (data)
- ❌ company event listings
- ❌ training catalogs
- ❌ benefits
- ❌ campaigns
- ❌ signage collections

**Those are Company concerns.**

---

## 🟩 LAYER 2 — COMPANY (ORGANIZATION LAYER)

**Concern**: The org the user belongs to, and all workforce data for that org.

**Company answers**: 👉 **"What is happening inside my organization?"**

### What Belongs to Company (Exclusive Responsibilities)

#### 1. Org Identity
- `companyId` (the authoritative FK for all org-scoped data)
- `name`, `description`
- `industry`, `headcount`
- `branding` (colors, logos, tagline)
- `leadership` metadata

#### 2. Workforce / Employees
- `CompanyEmployee[]`
  - `fullName`
  - `email`, `title`
  - `photoUrl`
  - `companyUnit` (label only)
- This is the internal org graph.

#### 3. Workforce Artifacts
These are not personal objects. They belong to the org the user is inside:
- `CompanyEmployeeHighlight[]`
- `CompanyTraining[]`
- `CompanyEvent[]`
- `CompanyCommunity[]`
- `CompanyCareer[]`
- `CompanyBenefits[]`
- `CompanyCampaign[]`
- `WorkForceEnduringProdEmailDigest[]`
- `ProductDigitalSign[]`

#### 4. Workforce Aggregations
Examples:
- "All employees in my org"
- "All highlights this month"
- "All events"
- "Upcoming trainings"
- "Benefits windows open"

These do not belong to WorkMe.

#### 5. Org-Level Hydration
- On `/dashboard` you hydrate:
  - `company`
  - `employees`
  - org-scope resources: events, trainings, careers, etc.

### Company Does NOT Manage
- ❌ user profile
- ❌ user skills
- ❌ user tasks
- ❌ user's external ecosystem follows
- ❌ user history or goals

**Those are WorkMe concerns.**

---

## 🔥 WORKMECOMPANY = BACKGROUND TAG

**It provides:**
- super admin grouping
- workspace grouping
- data partitioning behind the scenes

**It does NOT affect:**
- ❌ routing
- ❌ hydration
- ❌ API shape
- ❌ permissions
- ❌ component logic

**It is attached automatically to every record.**

**Pattern**: 👉 **"What workspace does this record belong to?"** (never surfaces to UI or routes)

---

## 🧬 THE ROUTE-SCOPING PATTERN (LOCKED)

### Client-Side Pattern
```typescript
// From localStorage (after Phase 1 hydration)
import { getWorkMe } from '@/lib/workme.client'

const workMe = getWorkMe()
const workMeId = workMe.id
const companyId = workMe.companyId
const workMeCompanyId = workMe.workMeCompanyId
```

### Server-Side Pattern (Recommended)

Use the helper function:

```typescript
import { getWorkMeScope } from '@/lib/server/getWorkMeScope'

export async function POST(request: NextRequest) {
  // Get scoping values
  const scope = await getWorkMeScope(request)
  
  // Use for object creation
  const employee = await prisma.companyEmployee.create({
    data: {
      ...employeeData,
      companyId: scope.companyId, // Authoritative org FK
      // workMeCompanyId can be auto-stamped if model supports it
    },
  })
}
```

### Manual Server-Side Pattern

```typescript
// Route receives request
const { id: workMeId } = await requireWorkMeAuth(request)

// Look up WorkMe to get companyId
const workMe = await prisma.workMe.findUnique({
  where: { id: workMeId },
  select: { 
    id: true,
    companyId: true, 
    companyUnit: true,
    workMeCompanyId: true,
  },
})

// Use for object creation
const employee = await prisma.companyEmployee.create({
  data: {
    ...employeeData,
    companyId: workMe.companyId, // Authoritative org FK
  },
})
```

### Values Available

- `workMeId` = `localStorage.workme.id` (client) or from auth (server)
- `companyId` = `localStorage.workme.companyId` (client) or from WorkMe lookup (server)
- `workMeCompanyId` = `localStorage.workme.workMeCompanyId` (background tag, server-stamped)

---

## 📋 THE SPLIT (Pin This)

### ✔️ WORKME RESPONSIBILITIES (PERSON LAYER)
- identity
- profile
- skills
- personal ops/tasks
- personal goals
- personal work history
- what the user follows (ecosystem)
- what the user creates (author metadata)
- linking user → company

**Pattern**: 👉 **"Who am I? What do I do? What do I own?"**

### ✔️ COMPANY RESPONSIBILITIES (ORG LAYER)
- workforce directory
- internal recognitions (highlights)
- internal events/training/careers/benefits
- company-facing signage
- workforce campaigns
- org metadata (brand, leadership, structure)

**Pattern**: 👉 **"What exists inside my organization?"**

---

## 🔄 Hydration Flow

### Phase 1: WorkMe Identity (Welcome)
- Endpoint: `GET /api/workme/me`
- Returns: Full WorkMe object (Layer 1)
- Stores: `localStorage.setItem('workme', JSON.stringify(workMe))`
- Access: `getWorkMe()`

### Phase 2: Company Data (Dashboard)
- Endpoint: `GET /api/dashboard/hydrate`
- Returns: All Company layer data (Layer 2)
- Stores: `localStorage.setItem('dashboard', JSON.stringify(dashboard))`
- Access: `getDashboard()`
- Requires: WorkMe already hydrated (needs `companyId`)

---

## 🎯 Route Scoping Rules

### For WorkMe Layer Objects
```typescript
// User's personal objects
where: {
  createdByWorkMeId: workMeId,
}
```

### For Company Layer Objects
```typescript
// Org-scoped objects
where: {
  companyId, // Authoritative FK
  // OR
  employees: {
    some: {
      employee: {
        companyId,
      },
    },
  },
}
```

### For CompanyX Objects (string-scoped)
```typescript
// Scoped by companyUnit string
where: {
  companyUnit: workMe.companyUnit,
}
```

