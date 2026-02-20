# Performance Plan & Performance Review — Architecture (revamped)

**Source of truth for the Plan vs Review mental model.** We refactored away from a bad model (one “cycle” with plan + review on the same entity). This doc captures where we landed.

---

## 1. Mental model (no collision)

- **Plan** = **what I’m planning to do.** Period-based. **Objectives only.** No review data.
- **Review** = **what I did.** Period-based. **Accomplishments only.** Optional: pull in prior Contribution Summaries.

Plan and Review are **independent**. Different tables, different APIs, different UI routes. A “plan” is not a container for a “review,” and a “review” does not reference a plan. Same period can have both a plan and a review, but they are not linked in the schema.

**Why the split:** We had tried “one cycle with Plan section + Review section” (objectives + summary + accomplishments on one entity). That caused collision: one status, one timeline, and mixed concerns. Splitting into Plan (objectives only) and Review (accomplishments only) keeps the model simple and avoids one entity doing two jobs.

---

## 2. What we moved away from (bad model)

- **Single “performance plan” entity** with both objectives and “review” (summary string + accomplishments + contribution summaries). That made “review” a subsection of “plan” and blurred the line between “what I’ll do” and “what I did.”
- **Contribution summaries** linked to the plan. They belong to “what I did,” so they attach to **Review** only (performanceReviewId), not Plan.
- **One detail page** that showed Plan and Review sections together. That reinforced the idea of one container. We now have separate detail pages: **plans/[id]** and **reviews/[id]**.

---

## 3. Current schema

| Model | Purpose | Key fields / relations |
|-------|---------|------------------------|
| **PerformancePlan** | What I’m planning. Period + objectives only. | workMeId, periodStart, periodEnd, periodType?, title?. **objectives** (PerformancePlanObjective[]). No review summary, no accomplishments, no contribution summaries. |
| **PerformancePlanObjective** | One objective under a plan. | performancePlanId, name, howIllContribute?, howMeasured?, sortOrder?. |
| **PerformanceReview** | What I did. Period + accomplishments. | workMeId, periodStart, periodEnd, periodType?, title?. **accomplishments** (PerformanceReviewAccomplishment[]). **contributionSummaries** (ContributionSummary[]). |
| **PerformanceReviewAccomplishment** | One accomplishment under a review. | performanceReviewId, title, description?, sortOrder?. |
| **ContributionSummary** | Prior assessment / summary (from Workforce stuff or elsewhere). | workMeId, periodStart, periodEnd, title?, summary?, **performanceReviewId?** (optional link to a review). Not linked to Plan. |

Plan has no FK to Review. Review has no FK to Plan. ContributionSummary links only to Review (performanceReviewId) when “pulled into” a review.

---

## 4. APIs

**Plans (objectives only)**  
- `GET/POST /api/performance-plans`  
- `GET/PUT/DELETE /api/performance-plans/[id]`  
- `GET/POST /api/performance-plans/[id]/objectives`  
- `PUT/DELETE /api/performance-plan-objectives/[id]`  
- `POST /api/performance-plans/objectives/parse` (raw text → suggested objectives)  
- `POST /api/performance-plans/objectives/suggest-measures` (suggest howMeasured for an objective)

**Reviews (accomplishments + contribution summaries)**  
- `GET/POST /api/performance-reviews`  
- `GET/PUT/DELETE /api/performance-reviews/[id]`  
- `GET/POST /api/performance-reviews/[id]/accomplishments`  
- `PUT/DELETE /api/performance-review-accomplishments/[id]`  
- Link/unlink contribution summary to a review: `PUT /api/contribution-summaries/[id]` with `performanceReviewId` (or null to unlink).

---

## 5. UX

- **List:** `/career/performance-reviews` — Two entry points: **Start a plan** and **Start a review.** Two lists: **Plans** (link to `plans/[id]`) and **Reviews** (link to `reviews/[id]`).
- **Plan detail:** `/career/performance-reviews/plans/[id]` — Period, period type, **objectives** (add, parse from text, suggest how measured, delete). Nothing about review or accomplishments.
- **Review detail:** `/career/performance-reviews/reviews/[id]` — Period, period type, **accomplishments** (add, remove), **prior assessments** (pull in / unlink Contribution Summaries by setting performanceReviewId). Nothing about objectives.
- **Legacy:** `/career/performance-reviews/[id]` (plain id) — Resolves by id: if it’s a plan → redirect to `plans/[id]`; if it’s a review → redirect to `reviews/[id]`; else not found.

---

## 6. Nomenclature and legacy

- **No “appraisal.”** That was NavSea-specific; we use “performance plan” and “performance review” only.
- **Career nav:** One entry “Performance reviews” → list page; from there user chooses Start a plan or Start a review.
- **Redirects:** `/career/appraisals`, `/career/appraisal-helper`, `/career/performance-plans` → `/career/performance-reviews`. Assessments (contribution summaries) live in Workforce stuff; “pull into review” links them to a **Review** by performanceReviewId.

---

## 7. Summary

| Concept | Model | Content |
|--------|--------|--------|
| Plan | PerformancePlan | Objectives only (name, howIllContribute, howMeasured). |
| Review | PerformanceReview | Accomplishments (title, description) + optional link to Contribution Summaries. |

No shared container. No planId on Review, no reviewId on Plan. Plan = what I’ll do. Review = what I did.
