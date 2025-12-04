# Company Profile Navigation Investigation

**Date:** 2025-01-04  
**Issue:** Confusion about `/mycompany/profile` vs `/mywork/profile-build` navigation and purpose

---

## 🔍 Current State

### Sidebar Navigation (SidebarNav.tsx)

**MyCompany Section:**
- ❌ **REMOVED:** "Company Profile" (was `/mycompany/profile`)
- ✅ "Workforce Stuff" → `/mycompany/workforcestuff`
- ✅ "Company Milestones" → `/mycompany/milestones`
- ✅ "WorkSignal" → `/mycompany/worksignal`

**MyWork Section:**
- ✅ "My Workforce Profile" → `/mywork/profile-build` (NEW - for editing)
- ✅ "Create Output" → `/mywork/create`
- ✅ "Work From Company Stuff" → `/mywork/fromcompanystuff`
- ✅ "Stuff I'm Working On" → `/mywork/active`
- ✅ "My Work Outlook" → `/my/outlook`
- ✅ "Admin" → `/my/admin`

### Routes

#### `/mycompany/profile` (READ-ONLY)
**Purpose:** Display read-only company/division information from registry
**Status:** Still exists as a page, but NOT in sidebar nav
**Content:**
- Shows CompanyUnit name (read-only)
- Shows DivisionUnit name (read-only)
- Has link to `/mywork/profile-build` for editing
- Shows "No Company Profile" state if nothing set

#### `/mywork/profile-build` (EDITABLE)
**Purpose:** Edit company/division affiliation (Profile Build section)
**Status:** Active in sidebar nav under MyWork
**Content:**
- Search/create CompanyUnit
- Search/create DivisionUnit (after company selected)
- Save to WorkProfile.companyUnitId and WorkProfile.divisionUnitId

---

## 🤔 The Question

**Why does `/mycompany/profile` still exist if it's not in the nav?**

### Possible Reasons:

1. **Legacy Route Preservation**
   - Old bookmarks/links might point to it
   - External references might exist
   - Migration period - keeping it for backward compatibility

2. **Read-Only View Purpose**
   - `/mywork/profile-build` = Edit mode
   - `/mycompany/profile` = View mode
   - Separation of concerns: editing vs viewing

3. **Future Company Features**
   - `/mycompany/profile` might be for company-level features (not just affiliation)
   - Company milestones, workforce stuff, etc. might need a landing page
   - Could be a hub for all company-related read-only info

4. **Architectural Intent**
   - `/mycompany/*` = Company-level features (read-only, company-wide)
   - `/mywork/*` = Personal work features (editable, personal)
   - Profile Build is personal (your affiliation), Company Profile is company-level (company info)

---

## 📋 Investigation Findings

### What `/mycompany/profile` Currently Does:

1. **Loads from WorkProfile:**
   ```typescript
   const response = await api.get('/api/workme/profile')
   // Shows profile.company.name and profile.division.name
   ```

2. **Read-Only Display:**
   - Shows CompanyUnit name
   - Shows DivisionUnit name
   - Links to `/mywork/profile-build` for editing

3. **Empty State:**
   - Shows "No Company Profile" message
   - Links to `/mywork/profile-build` to set up

### What `/mywork/profile-build` Does:

1. **Search/Create CompanyUnit:**
   - Search registry
   - Create if not found
   - Select company

2. **Search/Create DivisionUnit:**
   - Only after company selected
   - Search within company
   - Create if not found

3. **Save to WorkProfile:**
   - Updates `WorkProfile.companyUnitId`
   - Updates `WorkProfile.divisionUnitId`
   - This is the source of truth

---

## 🎯 Intended Architecture (Based on Refactor)

### Profile Build Section (NEW)
- **Location:** `/mywork/profile-build`
- **Purpose:** User manages their personal workforce affiliation
- **Scope:** Personal - your company, your division
- **Action:** Editable - search, create, save

### Company Profile (EXISTING)
- **Location:** `/mycompany/profile`
- **Purpose:** View company-level information
- **Scope:** Company-wide - read-only company data
- **Action:** Read-only - view only

### The Separation:
- **Personal Affiliation** = Profile Build (editable, personal)
- **Company Information** = Company Profile (read-only, company-wide)

---

## 💡 Why We Can't Remove `/mycompany/profile` (Yet)

### 1. **MyCompany Section Needs a Landing Page**
The MyCompany section in the nav has:
- Workforce Stuff
- Company Milestones  
- WorkSignal

But no "home" or "overview" page. `/mycompany/profile` could serve as:
- Company overview/dashboard
- Entry point to company features
- Read-only company information hub

### 2. **Future Company Features**
The page might need to show:
- Company-wide stats
- Company milestones summary
- Company workforce overview
- Company signals/events

### 3. **User Experience**
- Users might bookmark `/mycompany/profile`
- External links might point to it
- It provides a "view mode" vs "edit mode" separation

---

## 🔧 Recommendations

### Option 1: Keep Both (Recommended)
- **`/mywork/profile-build`** = Edit your personal affiliation
- **`/mycompany/profile`** = View company information (read-only)
- Add back to nav as "Company Overview" or "Company Info" (read-only)

### Option 2: Remove `/mycompany/profile`
- Delete the page entirely
- Redirect to `/mywork/profile-build` if accessed
- Risk: Lose separation of view vs edit

### Option 3: Rename and Repurpose
- Rename `/mycompany/profile` → `/mycompany/overview`
- Make it a true company dashboard
- Show company stats, milestones, workforce stuff previews
- Keep it read-only for company-level info

---

## 🚨 Current Issue

**The user is seeing `/mycompany/profile` in navigation somehow.**

### Possible Causes:
1. **Cached build** - Old version still running
2. **Browser cache** - Old sidebar HTML cached
3. **Different route** - Something else is routing there
4. **Build not updated** - Production build hasn't refreshed

### Verification Needed:
- Check if "Company Profile" is actually in SidebarNav.tsx (it's not)
- Check if there are any redirects to `/mycompany/profile`
- Check if PersonalUX component routes there
- Verify production build is using latest code

---

## 📝 Action Items

1. ✅ **DONE:** Removed "Company Profile" from sidebar nav
2. ✅ **DONE:** Created `/mywork/profile-build` for editing
3. ✅ **DONE:** Made `/mycompany/profile` read-only
4. ⚠️ **INVESTIGATE:** Why user still sees link to `/mycompany/profile`
5. 🤔 **DECIDE:** Keep `/mycompany/profile` as company overview or remove it?

---

## 🎯 Conclusion

**Current Architecture:**
- `/mywork/profile-build` = **EDIT** your company/division affiliation (Profile Build)
- `/mycompany/profile` = **VIEW** company information (read-only, company-level)

**The page should NOT be in the sidebar nav** (and it's not in the code). If the user is seeing it, it's likely:
- Cached build/browser
- Need to hard refresh
- Production hasn't updated yet

**Recommendation:** Keep `/mycompany/profile` as a read-only company overview page, but don't put it in the nav. Users can access it via direct URL or from other company features if needed.

