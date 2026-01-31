# Global Artifact Bank - The Correct Flow

## The Truth About Artifacts

**Artifacts can be about ANYTHING:**
- ✅ Company-wide news
- ✅ Platform/product updates
- ✅ Unit-specific updates
- ✅ Leader statements
- ✅ External pressures
- ✅ Processes/policies
- ✅ Workforce stuff
- ✅ Milestones

**You don't know what it's about until you parse it!**

## The Model

### CompanyNewsArtifact (GLOBAL)
- Belongs to: `companyId` (company-level, not unit-specific)
- Can link to:
  - `CompanyPlatformStatement[]` (platform-level)
  - `CompanyPlatformUnitStatement[]` (unit-level)
  - `CompanyMilestone[]` (milestones)
  - `CompanyExternalEnv[]` (external pressures)
- Stores: Raw article text, parsed intelligence, metadata

## The Correct Flow

### Step 1: Create Artifact (Global)
```
Ingest Article → Create CompanyNewsArtifact
```
- Store raw text
- Parse with AI to determine `artifactType`
- Store parsed intelligence
- **No unit/platform required** - it's global!

### Step 2: Parse Artifact → Determine What It's About
```
Select Artifact → Parse → Determine Type:
- "unit_update" → About a specific unit
- "milestone" → Company-wide milestone
- "external_pressure" → External pressure
- "workforce" → Workforce stuff
- "leadership" → Leader statement
- "platform" → Platform-level update
```

### Step 3: Route to Appropriate Model
Based on `artifactType`:
- **unit_update** → Create `CompanyPlatformUnitStatement` + `CompanyPlatformUnitUpdate`
- **milestone** → Create `CompanyMilestone`
- **external_pressure** → Create `CompanyExternalEnv`
- **workforce** → Create workforce record
- **platform** → Create `CompanyPlatformStatement` + `CompanyPlatformUpdate`
- **leadership** → Create leader statement/engagement

## What We Need

### 1. Global Artifact Bank Page
**Route:** `/mycompany/articles`

**Features:**
- List ALL `CompanyNewsArtifact` records (company-wide)
- Filter by: `artifactType`, `sentiment`, date, source
- Show parsed intelligence (what it's about)
- Actions:
  - View artifact
  - Parse/Route → Create appropriate record
  - Delete artifact

### 2. Navigation Link
Add to sidebar:
```
MYCOMPANY
- Workforce Stuff
- Company Milestones
- Employee Highlights
- Company Products
- Article Bank  ← NEW (global artifacts)
- External Company Pressures
```

### 3. Parse & Route Flow
```
Global Artifact Bank
  ↓
Select Artifact
  ↓
Parse → Determine artifactType
  ↓
Route Based on Type:
  - unit_update → Unit Update Page
  - milestone → Milestone Creation
  - external_pressure → External Pressure Creation
  - workforce → Workforce Stuff Creation
  - platform → Platform Statement Creation
```

## The Problem We're Fixing

**Before (Broken):**
- Artifacts tied to units (wrong - don't know unit until parse!)
- Can't see artifacts until you know which unit
- Artifacts can only be about units

**After (Fixed):**
- Artifacts are GLOBAL (company-level)
- See all artifacts in one place
- Parse artifact → Determine what it's about → Route appropriately
- Artifacts can be about anything (company, product, unit, leader, process, etc.)

## Summary

**Artifacts are GLOBAL and can be about ANYTHING:**
- Company news
- Platform updates
- Unit updates
- Leader statements
- External pressures
- Processes
- Workforce stuff
- Milestones

**The Flow:**
1. Create artifact (global, company-level)
2. Parse artifact → Determine what it's about
3. Route to appropriate model based on type

**What We Need:**
- Global artifact bank page (`/mycompany/articles`)
- Navigation link
- Parse & route flow (determine type → create appropriate record)
