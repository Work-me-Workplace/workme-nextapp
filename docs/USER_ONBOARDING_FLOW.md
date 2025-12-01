# WorkMe User Onboarding Flow

**Last Updated**: 2025-01-XX  
**Status**: 🚧 Refactoring in Progress

---

## 🎯 **OVERVIEW**

This document outlines the complete user onboarding flow for WorkMe users after signup. The flow has been refactored to include:

1. **Profile Setup** - Basic user information
2. **Company Selection** - Search and select from company directory (inserted from manage console)
3. **Company Unit & Division** - Set required companyUnit and optional division
4. **Career Setup** (Optional) - Can be skipped and returned to later

---

## 📋 **CURRENT FLOW**

### Step 1: Signup
- User signs up via `/signup` (Google or Email)
- Creates WorkMe record via `/api/workme/create`
- Redirects to `/profile`

### Step 2: Profile Setup (Current - Needs Refactoring)
- **Current**: Basic profile fields (jobTitle, specialty, industry, jobRole, salaryRange, companyName)
- **Issue**: Company is just a text field, no search/selection
- **Issue**: CompanyUnit and Division are handled separately in `/setup/unit`
- **Issue**: No career setup option

### Step 3: Welcome/Dashboard
- After profile → `/dashboard`
- Welcome page checks for companyUnit, redirects to `/setup/unit` if missing

---

## 🔄 **REFACTORED FLOW (Target)**

### Step 1: Signup
- ✅ Already working
- Creates WorkMe record
- Redirects to `/profile`

### Step 2: Profile Setup (Multi-Step)
**Location**: `/profile` (refactored)

#### Step 2a: Basic Profile
- First Name, Last Name (from signup, can edit)
- Job Title *
- Role Level *
- Specialty (optional)
- Industry (optional)
- Salary Range (optional)

#### Step 2b: Company Selection
- **Search company directory** (from manage console)
- Uses `/api/workme/company?q=...` for search
- Select from dropdown/list
- If company not found, can create new (but should be done via manage console)
- **Note**: Company is for reference/enrichment, not for scoping (companyUnit is for scoping)

#### Step 2c: Company Unit & Division
- **Company Unit** * (required)
  - Text input with suggestions/autocomplete
  - Examples: "NAVSEA", "SEA 02", "Engineering"
  - Required for WorkContext creation
- **Company Division** (optional)
  - Text input
  - Optional grouping layer
  - Examples: "Operations", "Development", "Support"

#### Step 2d: Career Setup (Optional)
- **Skip option**: "Set up later" button
- **Career fields** (if user wants to set up):
  - Career goals/interests
  - Career level preferences
  - Career type preferences
  - (TBD - needs design)
- **Return later**: Link in dashboard/profile to complete career setup

### Step 3: Dashboard
- After completing profile → `/dashboard`
- If career setup skipped, show reminder/banner to complete it

---

## 🛠 **IMPLEMENTATION PLAN**

### Phase 1: Refactor Profile Page
1. ✅ Convert to multi-step form
2. ✅ Add company search/selection component
3. ✅ Integrate companyUnit and division into profile flow
4. ✅ Add optional career setup step
5. ✅ Update routing logic

### Phase 2: Career Setup Component
1. ✅ Create career setup form component
2. ✅ Add "Set up later" option
3. ✅ Create return flow from dashboard

### Phase 3: API Updates
1. ✅ Verify company search API works
2. ✅ Update profile update API to handle all fields
3. ✅ Create career setup API endpoint (if needed)

---

## 📁 **FILES TO UPDATE**

### Core Files
- `app/profile/page.tsx` - Main profile setup page (refactor to multi-step)
- `app/api/workme/profile/route.ts` - Profile update API
- `app/api/user/update/route.ts` - CompanyUnit update API (may merge with profile)

### New Components
- `components/profile/CompanySearch.tsx` - Company search/selection
- `components/profile/CareerSetup.tsx` - Career setup form
- `components/profile/ProfileSteps.tsx` - Multi-step form wrapper

### Routing
- Update `/profile` to handle all onboarding steps
- Remove or deprecate `/setup/unit` (merge into profile)
- Add `/profile/career` for returning to career setup

---

## 🔑 **KEY DECISIONS**

1. **Company vs CompanyUnit**:
   - `Company` (from directory) = Enterprise-level metadata, enrichment
   - `companyUnit` (string) = User's work unit for scoping WorkContext
   - These are separate - user can select a Company but must set companyUnit

2. **Career Setup**:
   - Optional during onboarding
   - Can be skipped and returned to later
   - Stored in WorkMe model or separate CareerProfile model (TBD)

3. **Multi-Step Form**:
   - Use stepper UI component
   - Progress saved at each step
   - Can go back/forward between steps
   - Final submit saves all data

---

## 📝 **NOTES**

- Company directory is populated from `workme-manageconsole`
- Companies are globally unique by name
- CompanyUnit is required for WorkContext creation
- Career setup is optional but recommended

---

**Status**: 🚧 In Progress  
**Next Steps**: Refactor profile page to multi-step form

