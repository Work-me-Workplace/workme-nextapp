# Appraisal System Architecture & UX

**Purpose:** Top-level cycle (appraisalid in schema) with per-cycle objectives (objectiveid). Assessment (ContributionSummary) is part of the cycle.

**Terminology:** Product uses **assessment** + **review cycle** only; we do not use “appraisal” in UX. See **ASSESSMENT_BOLT_ON_ANALYSIS.md** for the single source of truth. Schema/API still use “Appraisal” as internal naming.

---

## 1. Architecture

### 1.1 Entity Model

```
WorkMe
  └── Appraisal[]                    (top-level: one per cycle)
        ├── periodStart, periodEnd
        ├── title (e.g. "2025 Annual Review")
        ├── AppraisalObjective[]      (individual objectives)
        │     ├── name
        │     ├── howMeasured
        │     └── skillTopicIds[]     (optional link to SkillTopic set)
        └── ContributionSummary?     (assessment = post-work; optional link)
              └── appraisalId (FK on ContributionSummary)
```

- **Appraisal (appraisalid)**  
  One per review cycle. Owns period (e.g. FY25), optional title. Has many objectives; can link one assessment (ContributionSummary) for that period.

- **AppraisalObjective (objectiveid)**  
  Per-appraisal objective: `name`, `howMeasured`, optional `skillTopicIds` to tie to existing SkillTopics.

- **ContributionSummary (assessment)**  
  Existing post-work assessment model. Optional `appraisalId` so “assessment time” is explicitly part of an appraisal.

### 1.2 Schema Additions (Prisma)

- **Appraisal**  
  `id`, `workMeId`, `periodStart`, `periodEnd`, `title?`, `createdAt`, `updatedAt`.

- **AppraisalObjective**  
  `id`, `appraisalId`, `name`, `howMeasured`, `skillTopicIds String[] @default([])`, `sortOrder Int?`.

- **ContributionSummary**  
  Add optional `appraisalId` (FK to Appraisal).

- **WorkMe**  
  Add `appraisals Appraisal[]`.

### 1.3 APIs

| Method | Path | Purpose |
|--------|------|--------|
| GET    | `/api/appraisals` | List appraisals for current user |
| POST   | `/api/appraisals` | Create appraisal |
| GET    | `/api/appraisals/[id]` | Get one appraisal with objectives; optional contributionSummary where appraisalId = id |
| PUT    | `/api/appraisals/[id]` | Update appraisal |
| DELETE | `/api/appraisals/[id]` | Delete appraisal (cascade objectives) |
| GET    | `/api/appraisals/[id]/objectives` | List objectives for appraisal |
| POST   | `/api/appraisals/[id]/objectives` | Create objective |
| PUT    | `/api/appraisal-objectives/[id]` | Update objective |
| DELETE | `/api/appraisal-objectives/[id]` | Delete objective |
| POST   | `/api/appraisals/objectives/parse` | **OpenAI blob parse**: body `{ rawText: string }` → structured `{ objectives: { name, howMeasured }[] }` (no save) |

Parse endpoint: same pattern as `/api/workstuff/events/ai` — return JSON only; client or another API persists.

### 1.4 OpenAI Parse (blob → objectives)

- **Input:** `POST /api/appraisals/objectives/parse` with `{ rawText: string }`.
- **Behavior:** Send `rawText` to OpenAI with a system prompt that asks for a list of objectives, each with `name` and `howMeasured`. Response must be valid JSON only (e.g. `{ "objectives": [ { "name": "...", "howMeasured": "..." } ] }`). Parse and return; do not write to DB.
- **Use case:** Paste job description, role expectations, or notes → get suggested objectives to add to an appraisal.

---

## 2. UX

### 2.0 UX principles

- **Objectives** are the primary concept in the nav and pages; the “appraisal” is the review cycle that holds objectives and an assessment. We don’t surface “appraisal” as a separate thing from “assessment” — they’re the same flow (objectives + assessment = review).
- **Goals vs outcomes** (formerly “Appraisal Helper”) is the compare view: goals (North Star) vs what you did (assessments). Same flow as review/appraisal; just different label.
- **Assessment (ContributionSummary)** is meant to **bolt on to workforcestuff**: after you do a product (training, event, campaign, etc.) in Workforce Stuff, you document your contribution there. The career Assessments list is “contributions you’ve documented”; it can also be linked to an objectives cycle.

### 2.1 Left Nav (Career / Sidebar)

- **Objectives** — single entry to `/career/appraisals` (list of review cycles; each cycle has objectives + optional linked assessment).
- **Assessments** — list/create contribution summaries (often created from workforcestuff flow).
- **Goals vs outcomes** — compare goals with assessments (review prep).

Nav items:

- Career Dashboard  
- Goals (North Star)  
- **Objectives** (`/career/appraisals`)  
- Assessments  
- Goals vs outcomes (`/career/appraisal-helper`)  
- (rest unchanged)

### 2.2 Routes & Pages

- **`/career/appraisals`**  
  List review cycles (objectives by cycle). “New cycle” → period + title → create; then open `/career/appraisals/[id]`.

- **`/career/appraisals/[id]`**  
  Single appraisal: header (title, period), list of objectives (name, howMeasured, optional skill tags).  
  - “Add objective” (inline or modal): name, howMeasured, optional skill topic picker.  
  - Optional “Parse from text” → open textarea → call parse API → show suggested objectives; user selects to add.  
  - **Assessment section:** link or embed ContributionSummary for this period. If `ContributionSummary.appraisalId === id`, show that assessment; else “Link assessment” (e.g. pick existing or create) so assessment is part of this appraisal.

- **Objective detail/edit**  
  Either inline on `/career/appraisals/[id]` (expand row / modal) or a dedicated route like `/career/appraisals/[id]/objectives/[objectiveId]` for name, howMeasured, skillTopicIds.

### 2.3 Assessment as Part of Appraisal

- When viewing an appraisal, show an “Assessment” block:
  - If an assessment is linked (`appraisalId` set), show it (read or link to existing assessments UX).
  - If not, “Link existing assessment” or “Create assessment” (create ContributionSummary with this period and set `appraisalId`).
- **Goals vs outcomes** (`/career/appraisal-helper`) is the “compare goals vs assessments” view; `/career/appraisals/[id]` is “this cycle’s objectives + linked assessment”.

### 2.4 Skill Set Tie-In (Objectives)

- On create/edit objective, optional multi-select of user’s SkillTopics (same as ContributionSummary’s skillTopicIds).
- Display: show objective name, howMeasured, and badges for linked skill topics.

---

## 3. Implementation Order

1. **Schema** — Appraisal, AppraisalObjective, WorkMe.appraisals, ContributionSummary.appraisalId.  
2. **APIs** — CRUD appraisals, CRUD objectives, `POST /api/appraisals/objectives/parse` (OpenAI).  
3. **Nav** — Add Appraisals + Objectives to sidebar.  
4. **Pages** — `/career/appraisals`, `/career/appraisals/[id]` with objectives list, add/edit objective, parse-from-text, and assessment section.

---

## 4. File Summary

| Area | Files |
|------|--------|
| Schema | `prisma/schema.prisma` (Appraisal, AppraisalObjective, WorkMe, ContributionSummary) |
| API | `app/api/appraisals/route.ts`, `app/api/appraisals/[id]/route.ts`, `app/api/appraisals/[id]/objectives/route.ts`, `app/api/appraisal-objectives/[id]/route.ts`, `app/api/appraisals/objectives/parse/route.ts` |
| Nav | `components/mywork/SidebarNav.tsx` (career section) |
| UX | `app/career/appraisals/page.tsx`, `app/career/appraisals/[id]/page.tsx` |

## 5. Migrate database

After pulling schema changes, run:

```bash
npx prisma migrate dev --name add_appraisal_and_objectives
```
