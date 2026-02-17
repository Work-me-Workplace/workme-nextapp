# Workforcestuff routes audit – avoid 404 on post-create redirect

**Purpose:** Every type the add flow can redirect to must have a page at that URL. This doc defines the rule and the current matrix so we don’t introduce 404s when adding types or changing redirects.

---

## Rule: no redirect without a route

**For every type that can be created from the add flow:**

1. **There must be a page** at the redirect URL.
   - Either a real detail page: `app/mycompany/workforcestuff/{type}/[id]/page.tsx` (or `[careerId]` / `[trainingId]` for career/training).
   - Or a redirect-only page that sends the user to the unified detail page: `/mycompany/workforcestuff/[id]`.

2. **Hydration** (loading the item by id) can come from:
   - **Unified API:** `GET /api/workforcestuff/[id]` – looks up the id across all company models and returns one item. Use this for the generic detail page and for any type that doesn’t need a custom API.
   - **Type-specific API:** `GET /api/workforcestuff/{type}/[id]` – use when the type has a dedicated API and/or response shape (e.g. campaign, impact-event, leader-engagement).

**When adding a new type to the add flow:** add the redirect target to `redirectPathMap` (or the special-case blocks for training/impact_event) **only after** the corresponding page (or redirect page) exists. See “Checklist for new types” below.

---

## Redirect targets vs routes and APIs

| Add-flow type       | Redirect URL                                      | Page exists? | Hydration source                    |
|---------------------|---------------------------------------------------|--------------|-------------------------------------|
| `event`             | `/mycompany/workforcestuff/event/{id}`            | ✅ Redirect   | Unified `GET /api/workforcestuff/[id]` |
| `campaign`          | `/mycompany/workforcestuff/campaign/{id}`         | ✅ Page       | Type-specific `GET .../campaign/[id]`  |
| `community`          | `/mycompany/workforcestuff/community/{id}`        | ✅ Page       | Type-specific `GET .../community/[id]` |
| `benefits`          | `/mycompany/workforcestuff/benefits/{id}`         | ✅ Page       | Type-specific `GET .../benefits/[id]`  |
| `employee_cause`    | `/mycompany/workforcestuff/employee-cause/{id}`   | ✅ Page       | Type-specific `GET .../employee-cause/[id]` |
| `leader_engagement`  | `/mycompany/workforcestuff/leader-engagement/{id}` | ✅ Page     | Type-specific `GET .../leader-engagement/[id]` |
| `impact_event`      | `/mycompany/workforcestuff/impact-event/{id}`     | ✅ Page       | Type-specific `GET .../impact-event/[id]` (special-case in add) |
| `training`          | `/mycompany/workforcestuff/training/{id}`         | ✅ Page       | Type-specific `GET .../training/[trainingId]` (special-case in add) |
| `career`            | (ingest → `/mycompany/workforcestuff/career/{id}`)| ✅ Page       | Type-specific `GET .../career/[careerId]` |

So: **every current redirect target has a page.** The only one that was missing was `event`; that’s fixed with a redirect page to the unified `[id]` route.

---

## Unified API coverage

`GET /api/workforcestuff/[id]` is used by:

- The **generic detail page** `/mycompany/workforcestuff/[id]` (list “View” and “View source” links).
- The **event** flow: `/mycompany/workforcestuff/event/[id]` redirects to `[id]`, which uses this API.

The unified API must resolve **every** type that can be opened via `/mycompany/workforcestuff/{id}` (so list links and event redirect don’t 404).

| Model / type            | In unified GET `[id]`? |
|-------------------------|-------------------------|
| CompanyTraining         | ✅ training             |
| CompanyEvent            | ✅ event                |
| CompanyCampaign         | ✅ campaign             |
| CompanyImpactEvent      | ✅ impact               |
| CompanyCommunity        | ✅ community            |
| CompanyBenefits         | ✅ benefit              |
| CompanyCareer           | ✅ career               |
| CompanyEmployeeCause    | ✅ cause                |
| CompanyLeaderEngagement  | ✅ leader_engagement    |

If the list (or any other flow) ever links to `/workforcestuff/{id}` for a leader engagement, the unified API must include it; the audit implementation adds it so the pattern is consistent.

---

## Checklist for new types

Before adding a new workforcestuff type to the add flow:

1. [ ] **Page:** Add `app/mycompany/workforcestuff/{type}/[id]/page.tsx` (or the right param name), **or** a redirect page to `/mycompany/workforcestuff/[id]`.
2. [ ] **Unified API (if using generic detail):** If the type can ever be opened via `/mycompany/workforcestuff/{id}`, add it to `app/api/workforcestuff/[id]/route.ts` GET (find by id, return normalized item with `type`).
3. [ ] **Redirect:** Only then add the type to `redirectPathMap` (or the training/impact_event special-case) in `app/mycompany/workforcestuff/add/page.tsx`.
4. [ ] **Optional:** Add a type-specific API `GET /api/workforcestuff/{type}/[id]` if the type needs a custom response or UI.

---

## Files reference

- Add flow redirects: `app/mycompany/workforcestuff/add/page.tsx` (`redirectPathMap` + training/impact_event blocks).
- Unified hydration: `app/api/workforcestuff/[id]/route.ts` (GET).
- Generic detail page: `app/mycompany/workforcestuff/[id]/page.tsx`.
- Event redirect page: `app/mycompany/workforcestuff/event/[id]/page.tsx`.
