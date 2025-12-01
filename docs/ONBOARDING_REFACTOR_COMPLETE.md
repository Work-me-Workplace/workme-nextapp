# WorkMe Onboarding Refactor - Complete

**Date**: 2025-01-XX  
**Status**: ✅ Implementation Complete

---

## 🎯 **WHAT WAS DONE**

Refactored the WorkMe onboarding flow to match the identity architecture with a clean, registry-backed workspace system.

---

## ✅ **IMPLEMENTATION SUMMARY**

### 1. Auth / Identity Creation Flow ✅

**File**: `app/api/workme/create/route.ts`

- ✅ Updated to use `verifyAuth(request)` instead of manual token verification
- ✅ Returns `{ firebaseId, email, displayName, photoUrl }` from verifyAuth
- ✅ Parses `firstName` and `lastName` from `displayName`
- ✅ Looks up WorkMe by `firebaseId`
- ✅ Creates new WorkMe if not found with minimal fields:
  ```typescript
  {
    firebaseId,
    email,
    firstName: parsed from displayName,
    lastName: parsed from displayName,
    photoUrl
  }
  ```
- ✅ Redirects user to `/profile` (handled by frontend)

### 2. Profile Page (Refactored to 2-Step) ✅

**File**: `app/profile/page.tsx`

**Step 1 - Basic Profile**:
- ✅ firstName
- ✅ lastName
- ✅ jobTitle *
- ✅ jobRole * (enum: INDIVIDUAL_CONTRIBUTOR, MANAGER, etc.)
- ✅ specialty (optional)
- ✅ industry (optional)
- ✅ salaryRange (optional)
- ✅ photoUrl (optional)
- ✅ **NO companyId or company directory** (commented out as requested)

**Step 2 - Workspace Selection**:
- ✅ Uses new `WorkspaceUnit` component
- ✅ Calls `/api/workme/companyunit` to set workspace
- ✅ Redirects to `/dashboard` on completion

### 3. Company Unit Registry ✅

**File**: `prisma/schema.prisma`

Added new model:
```prisma
model CompanyUnitRegistry {
  id         String   @id @default(cuid())
  name       String   @unique
  visibility String   @default("public")
  createdAt  DateTime @default(now())

  @@index([name])
  @@index([visibility])
}
```

**Purpose**:
- Open joinable workspace registry
- Users can create or join workspaces by name
- Supports both public (user-defined) and private (auto-generated) workspaces

### 4. Workspace Selection Logic ✅

**File**: `app/api/workme/companyunit/route.ts` (NEW)

**Behavior**:
- If user enters a name:
  - Trim and normalize
  - Upsert into `CompanyUnitRegistry` with `visibility: "public"`
  - Update `WorkMe.companyUnit` with registry name

- If user leaves blank:
  - Generate unique name: `unit_${nanoid(8)}`
  - Create registry entry with `visibility: "private"`
  - Update `WorkMe.companyUnit` with generated name

### 5. Profile API Update ✅

**File**: `app/api/workme/profile/route.ts`

- ✅ Updated to use `verifyAuth` + `loadWorkMe` pattern
- ✅ Only handles basic profile fields (no companyUnit here)
- ✅ Removed FieldMapperService dependency (direct field mapping)
- ✅ Clean separation: profile update vs workspace setup

### 6. Components Created ✅

**File**: `components/profile/WorkspaceUnit.tsx` (NEW)

- ✅ Reusable component for workspace selection
- ✅ Helper text explaining public/private workspace behavior
- ✅ Clean UI matching profile page design

### 7. Deprecated Routes ✅

**File**: `app/setup/unit/page.tsx`

- ✅ Deprecated - now redirects to `/profile`
- ✅ Old companyUnit text field removed from profile
- ✅ All companyId references removed (commented out)

---

## 🔄 **NEW ONBOARDING FLOW**

```
1. Firebase Login
   ↓
2. POST /api/workme/create
   - verifyAuth() → { firebaseId, email, displayName, photoUrl }
   - Find or create WorkMe
   - Return WorkMe
   ↓
3. /profile (Step 1: Basic Profile)
   - firstName, lastName, jobTitle, jobRole, specialty, industry, salaryRange
   - POST /api/workme/profile
   ↓
4. /profile (Step 2: Workspace Selection)
   - Enter workspace name (or leave blank)
   - POST /api/workme/companyunit
   - Upsert CompanyUnitRegistry (public) OR generate private
   - Update WorkMe.companyUnit
   ↓
5. /dashboard
   - Onboarding complete!
```

---

## 📁 **FILES MODIFIED/CREATED**

### API Routes
- ✅ `app/api/workme/create/route.ts` - Updated to use verifyAuth
- ✅ `app/api/workme/profile/route.ts` - Updated to use verifyAuth + loadWorkMe
- ✅ `app/api/workme/companyunit/route.ts` - **NEW** - Workspace registry logic

### Components
- ✅ `components/profile/WorkspaceUnit.tsx` - **NEW** - Workspace selection component

### Pages
- ✅ `app/profile/page.tsx` - Refactored to 2-step onboarding
- ✅ `app/setup/unit/page.tsx` - Deprecated (redirects to /profile)
- ✅ `app/signup/page.tsx` - Already redirects to /profile

### Schema
- ✅ `prisma/schema.prisma` - Added CompanyUnitRegistry model

### Dependencies
- ✅ `package.json` - Added `nanoid` for unique ID generation

---

## 🔑 **KEY DESIGN DECISIONS**

1. **Identity-First Architecture**: All routes use `verifyAuth` → `loadWorkMe` pattern
2. **Registry-Backed Workspaces**: Open joinable system with public/private visibility
3. **Clean Separation**: Profile update vs workspace setup are separate steps
4. **No Company Directory**: Company selection removed (as requested)
5. **Career Setup Skipped**: Left as breadcrumb for future implementation

---

## 🚧 **NEXT STEPS**

1. **Run Migration**: 
   ```bash
   npx prisma migrate dev --name add_company_unit_registry
   ```

2. **Test Flow**:
   - Sign up new user
   - Complete profile step
   - Test workspace selection (with name and blank)
   - Verify redirect to dashboard

3. **Future Enhancements**:
   - Career setup step (currently skipped)
   - Workspace search/autocomplete
   - Workspace management UI

---

## ✅ **CHECKLIST**

- [x] Update `/api/workme/create` to use verifyAuth
- [x] Add CompanyUnitRegistry model to schema
- [x] Create `/api/workme/companyunit` route
- [x] Update `/api/workme/profile` route
- [x] Refactor `/profile` to 2-step flow
- [x] Create WorkspaceUnit component
- [x] Deprecate `/setup/unit` page
- [x] Install nanoid dependency
- [x] Remove companyId references
- [x] Update signup redirect

---

**Status**: ✅ Ready for Testing  
**Migration Required**: Yes - Run Prisma migration for CompanyUnitRegistry

