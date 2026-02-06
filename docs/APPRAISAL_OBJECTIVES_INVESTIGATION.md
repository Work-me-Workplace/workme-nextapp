# Individual Appraisal Objectives Investigation

**Date:** February 6, 2026  
**Purpose:** Investigate individual appraisal objectives and assessment model connections

## Summary

**KEY INSIGHT:** The assessment model is **ContributionSummary** in the **Work Value Model** - NOT in IgniteBd!

Found **two separate systems** for objectives/goals:
1. **Objective model** (deprecated) - Legacy WorkWorld architecture
2. **WorkGoal model** (current) - WorkMe architecture

**Assessment model:** **ContributionSummary** (in Work Value Model architecture)
- ✅ **POST-WORK assessment** - "What did I actually do?"
- ✅ Designed for **annual reviews**
- ✅ Part of Work Value Model (SkillTopics → ContributionSummary flow)

**The Missing Link:**
- ❌ **No PRE-WORK objectives model** connected to ContributionSummary
- ❌ WorkGoal exists but **not connected** to Work Value Model
- ❌ No way to compare "what I planned" vs "what I did"

**Note:** IgniteBd has a separate assessment model for **business growth assessment** (not individual performance appraisals).

## Current State

### 1. Objective Model (Deprecated)

**Location:** `prisma/schema.prisma:426-444`

```prisma
model Objective {
  id String @id @default(cuid())
  companyUnit  String?
  originatorId String  @db.Uuid
  originator   WorkMe  @relation("ObjectiveOriginator", fields: [originatorId], references: [id], onDelete: Cascade)
  title       String
  description String?
  howMeasured String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  achievements Achievement[]
  @@index([companyUnit])
  @@index([originatorId])
}
```

**Status:** 
- ⚠️ **Deprecated** - Referenced in UI but not actively used
- Still exists in schema
- API endpoint exists: `/api/objectives/list/route.ts`
- Used as fallback in onboarding checks

**References:**
- `app/career/page.tsx` - Shows objectives count (deprecated)
- `app/setup/page.tsx` - References objectives (deprecated)
- `components/personal/PersonalUX.tsx` - Checks for objectives during onboarding
- `components/onboarding/OnboardingPrompt.tsx` - Checks for objectives

### 2. WorkGoal Model (Current)

**Location:** `prisma/schema.prisma:1472-1485`

```prisma
model WorkGoal {
  id         String    @id @default(uuid())
  workMeId   String    @db.Uuid
  goal       String
  targetDate DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  workMe WorkMe @relation(fields: [workMeId], references: [id], onDelete: Cascade)
  @@index([workMeId])
  @@index([targetDate])
}
```

**Status:**
- ✅ **Active** - Current model for personal goals
- Simpler structure than Objective model
- Used in `/api/objectives/list` as fallback when Objective table doesn't exist

**API Support:**
- `/api/objectives/list/route.ts` - Maps WorkGoal to Objective format for compatibility
- `/api/workme/me/route.ts` - Includes workGoals in user data
- `/api/workme/hydrate/route.ts` - Includes workGoals in hydration

### 3. ContributionSummary Model (Post-Work Assessment) ⭐ **THIS IS THE ASSESSMENT MODEL!**

**Location:** `prisma/schema.prisma:3081-3112`  
**Architecture:** Work Value Model (NOT IgniteBd!)

```prisma
model ContributionSummary {
  id       String @id @default(uuid())
  workMeId String @db.Uuid
  periodStart DateTime
  periodEnd   DateTime
  periodType  String? // "annual", "project", "quarterly"
  title   String? // e.g. "2025 Annual Contribution Summary"
  summary String? // AI-generated or user-written summary
  skillTopicIds String[] @default([]) // Links to SkillTopics
  companyWorkId String?
  companyWork   CompanyWork?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Status:**
- ✅ **Active** - Post-work assessment model
- ✅ **Part of Work Value Model** - Connected to SkillTopics
- ⚠️ **POST-WORK ONLY** - Explicitly designed as "not pre-work"
- Used for **annual assessments**, project summaries, quarterly reviews
- Summarizes what you **actually did**, not what you **planned to do**

**Work Value Model Flow:**
```
CompanyWork → MyContribution → SkillItems → SkillTopics → ContributionSummary
```

**Key Constraint:**
- ❌ **No pre-work objectives** - Cannot capture initial intentions
- ✅ **Post-work only** - Created AFTER work is done
- ❌ **Not connected to WorkGoal** - Missing the pre-work link!

**Documentation:**
- `docs/WORK_VALUE_MODEL_ARCHITECTURE.md` - Section 5: "NATURAL ASSESSMENTS (POST-WORK, NOT PRE-WORK)"
- `docs/WORK_VALUE_MODEL_AI_GUARDRAILS.md` - Guardrails around post-work assessments
- `docs/WORK_VALUE_MODEL_SUMMARY.md` - Quick reference

### 4. Assessment Models (Different Workspace - Business Growth)

**Location:** `IgniteBd-Next-combine` workspace

**Assessment Model:**
- `prisma/schema.prisma:52` - `assessments` table
- Used for **business growth assessment** (not individual performance)
- Captures: workload, growth goals, revenue targets
- Generates scores and insights via `AssessmentCalculationService`

**Key Files:**
- `app/(authenticated)/assessment/page.jsx` - Assessment form
- `app/api/assessment/route.js` - Assessment API
- `lib/services/AssessmentCalculationService.js` - Score calculation

**Assessment Fields:**
- `workTooMuch` - Workload assessment
- `assignTasks` - Delegation assessment  
- `wantMoreClients` - Growth goals
- `revenueGrowthPercent` - Revenue targets
- `totalVolume`, `bdSpend` - Business metrics

## The "What Did I Think I Was Going To Do" Connection ⭐ **THE KEY INSIGHT!**

**Key Finding:** 
- ✅ **ContributionSummary IS the assessment model** (Work Value Model, not IgniteBd!)
- ✅ **WorkGoal exists** for pre-work intentions
- ❌ **BUT THEY'RE NOT CONNECTED!**

**Current State:**
- ✅ **WorkGoal** = "What did I think I was going to do?" (pre-work intention)
- ✅ **ContributionSummary** = "What did I actually do?" (post-work assessment)
- ❌ **No connection** between them
- ❌ **No comparison** mechanism (planned vs actual)

**The Gap:**
The **ContributionSummary** model is explicitly designed as **"POST-WORK, NOT PRE-WORK"** (see `WORK_VALUE_MODEL_ARCHITECTURE.md`). This means:
- ✅ You can assess what you **actually did** (ContributionSummary)
- ✅ You CAN capture what you **planned/intended to do** (WorkGoal)
- ❌ But they're **not connected** - missing the appraisal cycle link!

**The Missing Link:**
1. **WorkGoal** should connect to **ContributionSummary** via period matching
2. **Comparison view** - Show planned goals vs actual contributions
3. **Appraisal cycle** - Complete feedback loop: Plan (WorkGoal) → Execute → Assess (ContributionSummary) → Reflect

**What Needs to Happen:**
- Link WorkGoal to ContributionSummary by period (periodStart/periodEnd)
- Create comparison UI showing "What I planned" vs "What I did"
- Connect WorkGoal to Work Value Model flow (maybe via CompanyWork?)

## API Endpoints

### Objectives/Goals
- `GET /api/objectives/list` - Lists objectives (tries Objective, falls back to WorkGoal)
- Returns format:
  ```typescript
  {
    success: true,
    objectives: [{
      id: string,
      title: string,
      description: string | null,
      howMeasured: string | null,
      createdAt: Date
    }]
  }
  ```

### ContributionSummary (Post-Work Assessment)
- ❌ **No API endpoints found** - Model exists but no CRUD API implemented
- Model is in schema but appears to be planned, not fully implemented

### Assessment (IgniteBd workspace - Business Growth)
- `GET /api/assessment?companyHQId={id}` - Get assessments
- `POST /api/assessment` - Create assessment

## UI Components

### Onboarding Checks
1. **PersonalUX** (`components/personal/PersonalUX.tsx`)
   - Checks for objectives via `/api/objectives/list`
   - Shows "Goals" card if incomplete
   - Links to `/career` page

2. **OnboardingPrompt** (`components/onboarding/OnboardingPrompt.tsx`)
   - Checks for objectives during onboarding
   - Links to `/career` for goal setup

### Career Page
- `app/career/page.tsx` - Shows objectives count (deprecated)
- References achievements and objectives (both deprecated)

### Goals Pages (Placeholders)
- `app/goals/page.tsx` - Placeholder, not implemented
- `app/goals/new/page.tsx` - Placeholder form, not connected to API

## Recommendations

### 1. Clarify the Pre-Work Objectives Model
**Question:** Was there supposed to be a **pre-work objectives model** that captures:
- Initial intentions ("what did I think I was going to do")
- Planned objectives for the period
- Goals set at the start of appraisal cycle

**Current State:**
- ✅ Post-work assessment exists (ContributionSummary)
- ❌ Pre-work objectives model is missing
- ⚠️ WorkGoal exists but is not period-specific or appraisal-linked

**Action:** 
- Review original requirements/design docs for pre-work → post-work assessment flow
- Determine if WorkGoal should be extended or new model needed
- Consider if Objective model was intended for this purpose

### 2. Consolidate Objectives/Goals
**Current State:** Two models (Objective deprecated, WorkGoal active)

**Options:**
- **A)** Remove Objective model entirely, use WorkGoal only
- **B)** Migrate Objective data to WorkGoal
- **C)** Keep both but clarify use cases

### 3. Implement Goals CRUD
**Current State:** Goals pages are placeholders

**Needed:**
- Create goal API endpoint
- Update goal API endpoint  
- Delete goal API endpoint
- Full CRUD UI in `/goals` pages

### 4. Assessment → Objectives Link
**If intended:** Create connection between:
- Initial assessment responses
- Generated objectives/goals
- Performance tracking

## Files to Review

### Schema
- `prisma/schema.prisma` - Lines 426-444 (Objective), 1472-1485 (WorkGoal)

### API
- `app/api/objectives/list/route.ts` - Current objectives endpoint
- `app/api/workme/me/route.ts` - Includes workGoals
- `app/api/workme/hydrate/route.ts` - Includes workGoals

### UI
- `components/personal/PersonalUX.tsx` - Onboarding check
- `components/onboarding/OnboardingPrompt.tsx` - Onboarding check
- `app/career/page.tsx` - Career dashboard (deprecated references)
- `app/goals/page.tsx` - Goals list (placeholder)
- `app/goals/new/page.tsx` - New goal (placeholder)

### ContributionSummary (Post-Work Assessment)
- `prisma/schema.prisma:3081-3112` - Model definition
- `docs/WORK_VALUE_MODEL_ARCHITECTURE.md` - Architecture documentation
- ❌ **No UI or API implementation found** - Model exists but not implemented

### Assessment (IgniteBd workspace - Business Growth)
- `app/(authenticated)/assessment/page.jsx` - Assessment form
- `app/api/assessment/route.js` - Assessment API
- `lib/services/AssessmentCalculationService.js` - Assessment logic

## Next Steps ⭐ **THE PATH FORWARD**

1. **Connect WorkGoal to ContributionSummary:**
   - Add `periodStart` and `periodEnd` to WorkGoal (or create period-specific goals)
   - Link WorkGoal to ContributionSummary by matching periods
   - Create comparison view: "What I planned" (WorkGoal) vs "What I did" (ContributionSummary)

2. **Integrate WorkGoal into Work Value Model:**
   - Connect WorkGoal → CompanyWork → MyContribution flow
   - Allow goals to reference SkillTopics (what skills do I want to develop?)
   - Show goal progress via SkillTopics demonstrated

3. **Build ContributionSummary API:**
   - Create CRUD API for ContributionSummary
   - Build UI for creating/viewing annual assessments
   - Generate summaries from SkillTopics and CompanyWork

4. **Create Appraisal Cycle UI:**
   - **Pre-work:** Set goals (WorkGoal) with period and target SkillTopics
   - **During work:** Track progress via SkillItems and SkillTopics
   - **Post-work:** Generate ContributionSummary from actual work
   - **Comparison:** Show planned vs actual side-by-side

5. **Document the complete flow:**
   - WorkGoal (pre-work) → Work Value Model → ContributionSummary (post-work)
   - How goals connect to SkillTopics
   - Complete appraisal cycle: Plan → Execute → Assess → Reflect

**The Key Realization:**
- ✅ ContributionSummary IS the assessment (Work Value Model)
- ✅ WorkGoal IS the pre-work intention
- 🔗 **They just need to be connected!**
