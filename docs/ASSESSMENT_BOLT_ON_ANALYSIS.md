# Performance plan & performance review (end-to-end)

**No “appraisal.”** That was NavSea-specific; not universal. In the old world, “appraisal” was end-of-year and “contribution plan” was beginning-of-year—we couldn’t get to a clear mental model with that split. So we collapsed to one:

- **Performance plan** = **what was planned.** (Objectives, how I’ll contribute, period.)
- **Performance review** = **what I did.** (Summary, accomplishments for that period.)

---

## 0. End-to-end: plan vs review

| Concept | Meaning | Period? |
|--------|---------|---------|
| **Performance plan** (performancePlanId) | **What was planned.** Period-based. Has **objectives** (objectiveId); each objective has **howIllContribute**. Period enum: quarterly \| mid-year \| annual. |
| **Objective** (objectiveId) | Under a performance plan. Field **howIllContribute** (how I will contribute). |
| **Performance review** | **What I did.** Same period as the plan. Has **performanceReviewSummary** (string). Lists **accomplishments** that fall in that period. |
| **Accomplishment** (accomplishmentId) | Per-thing (“how did the thing go?”). Optional bolt-on after **event**. Not period-based. |

So: **Performance plan = what was planned. Performance review = what I did.** That’s the full loop. No “contribution summary”; no “appraisal.”

---

## 1. How most companies term it

Cadences: **annual**, **mid-year**, **quarterly**. We use a **period enum** on the plan (and review ties to the same period). “Performance review” = the “what I did” side; “performance plan” = the “what was planned” side.

---

## 2. Model (no appraisal, no contribution summary)

- **Performance plan** (performancePlanId) — period-based. **What was planned.** Objectives (objectiveId) with **howIllContribute**. Period enum.
- **Performance review** — **what I did.** Same period. **performanceReviewSummary** (string). Lists accomplishments for that period.
- **Objective** (objectiveId) — under performance plan. **howIllContribute**.
- **Accomplishment** (accomplishmentId) — per-thing. Optional bolt-on after event (event only for MVP).

---

## 3. Bolt-on (event only)

Accomplishment = optional “how did this event go?” after a **CompanyEvent**. One accomplishment per event. Performance review (what I did) lists accomplishments for that period. CompanyCampaign exists; bolt-on = **event only** for MVP.

---

## 4. MVP1 (concise)

| What | Choice |
|------|--------|
| **Performance plan** (performancePlanId) | **What was planned.** Period enum `quarterly` \| `mid-year` \| `annual`. Objectives (objectiveId) with **howIllContribute**. |
| **Objective** (objectiveId) | Under plan. **howIllContribute**. |
| **Performance review** | **What I did.** performanceReviewSummary (string). List accomplishments for period. |
| **Accomplishment** (accomplishmentId) | Per-thing. Bolt-on **event only**. |

---

## 5. Schema alignment (no Appraisal)

Target schema uses **PerformancePlan** and **PerformanceReview** (or one period-entity with both plan + review summary). **No Appraisal / appraisal.**

| Concept | Target schema | Notes |
|--------|----------------|--------|
| Performance plan | **PerformancePlan** (id, workMeId, periodStart, periodEnd, periodType, title) | Rename from Appraisal. Add periodType enum. |
| Objective | **Objective** or **PerformancePlanObjective** (id, performancePlanId, name, **howIllContribute**, …) | Rename from AppraisalObjective; add howIllContribute. |
| Performance review | **performanceReviewSummary** (string) on same period-entity, or **PerformanceReview** (id, performancePlanId?, performanceReviewSummary) | “What I did” = this string + accomplishments. |
| Accomplishment | **Accomplishment** (id, workMeId, companyEventId?, …) | Per-thing. No period. |

Rename **Appraisal** → **PerformancePlan**, **AppraisalObjective** → objective under plan (e.g. **PerformancePlanObjective** or **Objective** with performancePlanId). Add **howIllContribute**. Add **performanceReviewSummary** for “what I did.” Introduce **Accomplishment** for per-event. Remove all “appraisal” from code and docs.

---

## 6. Status: in action

**Done (architecture + UX):**

1. **Schema:** PerformancePlan, PerformancePlanObjective, **howIllContribute**, **performanceReviewSummary**, **periodType** (quarterly \| mid-year \| annual). ContributionSummary uses performancePlanId.  
2. **APIs:** `/api/performance-plans`, `/api/performance-plans/[id]`, `/api/performance-plans/[id]/objectives`, `/api/performance-plans/objectives/parse`, `/api/performance-plan-objectives/[id]`. No “appraisal” in code.  
3. **Frontend (done):** `/career/performance-plans` (list, create with period type). Plan detail: objectives, **Performance review** = editable "What I did" summary + optional link to ContributionSummary. Period type on create and detail. `/career/appraisals` redirects.
**Later (optional):** **Accomplishment** — New model (accomplishmentId, workMeId, companyEventId?) + bolt-on from event for "how did this event go?" Per-thing; performance review can list accomplishments for the period.
