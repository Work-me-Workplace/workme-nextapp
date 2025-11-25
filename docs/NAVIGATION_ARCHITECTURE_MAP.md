# Navigation Architecture Map

**Generated:** After UI/Navigation Refactor  
**Date:** Current  
**Purpose:** Document current route mappings vs proposed future architecture

---

## Overview

This document maps the new navigation structure to existing routes. All navigation items currently link to existing pages. Future migration will consolidate routes into the proposed canonical structure.

---

## Navigation Structure

### Dashboard

| Navigation Label | Current Route Target | Proposed Future Route | Status | Notes |
|-----------------|---------------------|---------------------|--------|-------|
| Dashboard | `/dashboard` | `/dashboard` | ✅ Stable | Main dashboard with 3-card scaffold |

---

## MyCompany

| Navigation Label | Current Route Target | Proposed Future Route | Status | Notes |
|-----------------|---------------------|---------------------|--------|-------|
| Company Profile | `/profile` | `/mycompany/profile` | 🔄 Needs Migration | Currently at `/profile` - contains company info |
| Workforce Stuff | `/workforce-comms` | `/mycompany/workforce` | 🔄 Needs Migration | Workforce communications hub |
| Company Milestones | `/milestones` | `/mycompany/milestones` | 🔄 Needs Migration | Company-level milestones |
| WorkSignal | `/events` | `/mycompany/worksignal` | 🔄 Needs Migration | Company events/signals (currently generic events page) |

**Current Route Details:**
- `/profile` - User profile page with company information
- `/workforce-comms` - Workforce communications product management
- `/milestones` - Milestones listing (currently generic, may need company filtering)
- `/events` - Generic events page (may need to filter by company context)

---

## MyWork

| Navigation Label | Current Route Target | Proposed Future Route | Status | Notes |
|-----------------|---------------------|---------------------|--------|-------|
| Create Output | `/mywork/outputs` | `/mywork/outputs` | ✅ Stable | Output creation hub - already in correct location |
| Work From Company Stuff | `/mywork` | `/mywork` | ✅ Stable | WorkplaceSandbox - already in correct location |
| Stuff I'm Working On | `/tasks` | `/mywork/tasks` | 🔄 Needs Migration | Tasks page - should move under `/mywork` |

**Current Route Details:**
- `/mywork/outputs` - Output type selection and creation
- `/mywork` - WorkplaceSandbox hub for company-level happenings
- `/tasks` - Tasks listing (currently at root, should be under `/mywork`)

---

## MyCareer

| Navigation Label | Current Route Target | Proposed Future Route | Status | Notes |
|-----------------|---------------------|---------------------|--------|-------|
| Career Track | `/career` | `/mycareer/track` | 🔄 Needs Migration | Career dashboard |
| Achievements | `/career` | `/mycareer/achievements` | 🔄 Needs Migration | Currently links to career page (deprecated features) |
| Reflections | `/career` | `/mycareer/reflections` | 🔄 Needs Migration | Currently links to career page (feature not yet implemented) |

**Current Route Details:**
- `/career` - Career dashboard (contains deprecated achievements/objectives references)
- Note: Achievements and Objectives are deprecated but still referenced in UI

---

## MyNetwork

| Navigation Label | Current Route Target | Proposed Future Route | Status | Notes |
|-----------------|---------------------|---------------------|--------|-------|
| Connections | `/connections` | `/mynetwork/connections` | 🔄 Needs Migration | Connections listing |
| Suggested Interactions | `/connections` | `/mynetwork/suggestions` | 🔄 Needs Migration | Currently links to connections (feature not yet implemented) |

**Current Route Details:**
- `/connections` - Connections listing page
- Note: "Suggested Interactions" currently links to same page - needs separate implementation

---

## Settings

| Navigation Label | Current Route Target | Proposed Future Route | Status | Notes |
|-----------------|---------------------|---------------------|--------|-------|
| Settings | `/setup` | `/settings` | 🔄 Needs Migration | Setup page (should rename to `/settings`) |

**Current Route Details:**
- `/setup` - Setup dashboard for objectives and comms outputs (deprecated features)

---

## Route Migration Summary

### ✅ Stable Routes (No Migration Needed)
- `/dashboard` - Main dashboard
- `/mywork` - WorkplaceSandbox hub
- `/mywork/outputs` - Output creation

### 🔄 Routes Needing Migration

**High Priority:**
1. `/tasks` → `/mywork/tasks` (Move under MyWork)
2. `/profile` → `/mycompany/profile` (Move under MyCompany)
3. `/workforce-comms` → `/mycompany/workforce` (Move under MyCompany)
4. `/milestones` → `/mycompany/milestones` (Move under MyCompany)
5. `/events` → `/mycompany/worksignal` (Move under MyCompany)
6. `/career` → `/mycareer/track` (Move under MyCareer)
7. `/connections` → `/mynetwork/connections` (Move under MyNetwork)
8. `/setup` → `/settings` (Rename)

**Medium Priority (Feature Implementation):**
- `/mycareer/achievements` - Needs separate page (currently deprecated)
- `/mycareer/reflections` - Needs new page implementation
- `/mynetwork/suggestions` - Needs new page implementation

---

## Legacy Routes (Still Active)

These routes exist but are not in the new navigation structure:

- `/worksupport` - WorkSupport feature (still accessible via direct URL)
- `/ntk` - NTK Generator (still accessible via direct URL)
- `/goals` - Goals page (placeholder, not in nav)
- `/attention/events/[eventId]/view` - Event detail view (accessed from MyWork)

---

## Implementation Notes

1. **No Backend Changes:** All current mappings are UI-only. No API routes, models, or server logic changed.

2. **No File Moves:** All pages remain in their current locations. Only navigation links updated.

3. **Future Migration:** When ready to migrate routes:
   - Create new route structure under `/mycompany`, `/mycareer`, `/mynetwork`
   - Move page components to new locations
   - Update all internal links
   - Add redirects from old routes to new routes
   - Update API route handlers if needed

4. **Context Pages:** Many pages under `/mywork/context/` are accessed via the WorkplaceSandbox hub. These remain stable.

---

## Navigation Component Location

- **File:** `components/mywork/SidebarNav.tsx`
- **Usage:** Used in pages that need sidebar navigation (dashboard, mywork, etc.)
- **Structure:** Grouped navigation with icons from `lucide-react`

---

## Dashboard Component Location

- **File:** `app/dashboard/page.tsx`
- **Structure:** 3-card scaffold (My Progress, Top Signals, Stuff I'm Working On)
- **Dependencies:** Uses SidebarNav component

---

## Next Steps

1. ✅ **Completed:** Navigation structure updated
2. ✅ **Completed:** Dashboard scaffold created
3. ⏳ **Future:** Migrate routes to proposed structure
4. ⏳ **Future:** Implement missing features (Reflections, Suggested Interactions)
5. ⏳ **Future:** Separate Achievements page (if re-enabled)

