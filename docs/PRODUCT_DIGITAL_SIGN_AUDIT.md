# ProductDigitalSign* Model Audit — Use Cases & Overbuild Analysis

**Date:** Feb 17, 2026  
**Purpose:** Map each ProductDigitalSign variant to real use cases and assess whether the stack is overbuilt.

**Naming:**
- **“Workforce stuff”** is just the left-side nav label (and route name) for the area where you manage **CompanyX** items — events, trainings, campaigns, benefits, careers, community, impact events, employee cause, leader engagement. The underlying domain is **CompanyX**; the model `ProductDigitalSignWorkforceStuff` is the unified digital-sign variant for *any* CompanyX type (not a separate “workforce” concept).
- **“Promo”** — **Removed.** Was event promotional materials (print/CVI collateral per event). Replaced by **ProductX**. Promo routes, API, and UI have been deleted (see “Done” section below).

---

## 1. Current Model Hierarchy

```
ProductDigitalSign (base)
├── signType: DigitalSignType
│   ├── WORKFORCE
│   ├── COMPANY_NEWS
│   ├── WORKFORCE_ACHIEVEMENT
│   └── COMPANY_EVENT
│
└── Variant models (1:1 with ProductDigitalSign, keyed by digitalSignId):
    ├── ProductDigitalSignWorkforce           → signType WORKFORCE
    ├── ProductDigitalSignCompanyNews         → signType COMPANY_NEWS
    ├── ProductDigitalSignWorkforceAchievement → signType WORKFORCE_ACHIEVEMENT
    ├── ProductDigitalSignCompanyEvent       → signType COMPANY_EVENT (legacy)
    └── ProductDigitalSignWorkforceStuff     → unified CompanyX (event, training, campaign, benefits, etc.)
```

**Important:** `ProductDigitalSign` has **both** `companyEvent` (legacy) and `workforceStuff` (unified CompanyX). Only one is populated per product. The **CompanyX** flow (nav: “workforcestuff”) creates **ProductDigitalSignWorkforceStuff** with the appropriate CompanyX FK (e.g. `companyEventId`, `companyTrainingId`). The My Work digital signage builder creates the **ProductDigitalSignCompanyEvent** variant for COMPANY_EVENT.

---

## 2. Use Case → Variant Mapping

| Use case | Entry point | signType | Variant used | Notes |
|----------|-------------|----------|--------------|--------|
| **My Work → Create digital sign (event)** | `/mywork/digital-signage/builder/new?type=COMPANY_EVENT` | COMPANY_EVENT | ProductDigitalSignCompanyEvent | Form posts to `/api/mywork/digital-signage/save` or create; creates legacy CompanyEvent variant. |
| **My Work → Create digital sign (news)** | Same builder, type=COMPANY_NEWS | COMPANY_NEWS | ProductDigitalSignCompanyNews | |
| **My Work → Create digital sign (workforce)** | Same builder, type=WORKFORCE | WORKFORCE | ProductDigitalSignWorkforce | |
| **My Work → Create digital sign (achievement)** | Same builder, type=WORKFORCE_ACHIEVEMENT | WORKFORCE_ACHIEVEMENT | ProductDigitalSignWorkforceAchievement | Often from highlight; GPT + asset. |
| **CompanyX → Generate digital signage** | CompanyX item detail (nav: workforcestuff) → “Generate digital signage” | COMPANY_EVENT (reused) | **ProductDigitalSignWorkforceStuff** | `POST /api/workforcestuff/[id]/generate-digital-signage`. Creates unified CompanyX variant (companyEventId, companyTrainingId, etc.). Does **not** create ProductDigitalSignCompanyEvent. |
| **Platform unit update → digital sign** | Automation / service | COMPANY_NEWS | ProductDigitalSignCompanyNews | digital-product-from-platform-unit-update-service. |
| **Milestone → digital sign** | Automation / service | COMPANY_NEWS | ProductDigitalSignCompanyNews | digital-product-from-milestone-service, digital-product-from-company-milestone-delivery-service. |
| **Dashboard / list / review** | My Work lists, review page, deck generation | (any) | All variants | Reads whichever variant is present (workforceAchievement, workforce, companyNews, companyEvent). **Does not read workforceStuff** in the main My Work UI. |

---

## 3. Overbuild Assessment

### 3.1 Two paths for “event” signage

- **Path A (legacy):** My Work builder → COMPANY_EVENT → **ProductDigitalSignCompanyEvent** (duplicated event fields + optional companyEventId).
- **Path B (unified):** CompanyX item → “Generate digital signage” (workforcestuff nav) → **ProductDigitalSignWorkforceStuff** with the relevant CompanyX FK (e.g. companyEventId, companyTrainingId).

So “event” digital signs can live in **two different variant tables** depending on how they were created. The schema and docs already call out ProductDigitalSignCompanyEvent as legacy and ProductDigitalSignWorkforceStuff as the preferred unified model.

### 3.2 Is the number of variants overkill?

- **WORKFORCE / COMPANY_NEWS / WORKFORCE_ACHIEVEMENT / COMPANY_EVENT** each have distinct shapes and clear UI (builder, view, review, deck). So **four sign types** are justified by product behavior.
- **Overbuild** is mainly **two event representations**: ProductDigitalSignCompanyEvent vs ProductDigitalSignWorkforceStuff (event case). That’s the main redundancy.

### 3.3 Where the unified CompanyX variant (WorkforceStuff) is used

- **Created by:** `POST /api/workforcestuff/[id]/generate-digital-signage` only — i.e. when generating a sign from a CompanyX item (event, training, campaign, etc.; nav label “workforcestuff”).
- **Read by:** Dashboard hydrate and product-status checks (workforceStuff included); **not** by the main My Work digital signage view/review/deck flows, which only look at workforce / companyNews / workforceAchievement / **companyEvent**.

So today:

- Signs created from **My Work builder** (including events) → **companyEvent** (or other legacy variants).
- Signs created from a **CompanyX item** (nav: workforcestuff) → **ProductDigitalSignWorkforceStuff** (with the appropriate CompanyX FK).

My Work list/detail/review/deck do **not** surface the CompanyX variant (workforceStuff); they only show the legacy variants. So signs created from CompanyX items may not appear in the same “digital signage” UX as builder-created ones unless the list/detail logic is extended to include workforceStuff.

---

## 4. Recommendations

1. **Consolidate event signage on one model (long term)**  
   - Prefer **ProductDigitalSignWorkforceStuff** for all new “event” (and other CompanyX) signage.  
   - Migrate or dual-write from the My Work COMPANY_EVENT flow into workforceStuff (e.g. companyEventId + normalized fields) so there’s a single representation for “event sign.”  
   - Deprecate creating new ProductDigitalSignCompanyEvent; keep it only for backward compatibility and read path until data is migrated.

2. **Unify read paths**  
   - Extend My Work digital signage list/detail/review and deck generation to **include** ProductDigitalSignWorkforceStuff (e.g. when companyEvent is null but workforceStuff is present), so signs created from CompanyX items show up in the same UX.

3. **Keep four sign types, reduce variant tables**  
   - Keep WORKFORCE, COMPANY_NEWS, WORKFORCE_ACHIEVEMENT, COMPANY_EVENT as **sign types** and UX concepts.  
   - Over time, represent all of them via a **single** variant model (the unified CompanyX variant — WorkforceStuff — with polymorphic CompanyX FKs + normalized fields) so you don’t maintain five separate variant tables.  
   - This is a larger refactor; short term, the main fix is to stop creating new ProductDigitalSignCompanyEvent and route new event signage through the unified CompanyX variant + unify read paths.

4. **Perks removed**  
   - All event/digital-signage use of “perks” has been removed in code; only **eventItems** is used. Promo brief “perks” renamed to **highlights** in API and UI. Schema still has deprecated `perks` columns for DB compatibility; can drop in a later migration.

---

## 5. Summary Table

| Variant | Created by | Read by (main) | Overbuild? |
|--------|------------|----------------|------------|
| ProductDigitalSignWorkforce | My Work builder (WORKFORCE) | View, review, deck | No |
| ProductDigitalSignCompanyNews | My Work builder, platform/milestone services | View, review, deck | No |
| ProductDigitalSignWorkforceAchievement | My Work builder (WORKFORCE_ACHIEVEMENT) | View, review, deck | No |
| ProductDigitalSignCompanyEvent | My Work builder (COMPANY_EVENT) | View, review, deck | **Yes** — duplicate of “event” in WorkforceStuff |
| ProductDigitalSignWorkforceStuff | CompanyX item → “Generate digital signage” (nav: workforcestuff) | Dashboard/product-status; **not** main My Work view/review/deck | **Gap** — unified CompanyX variant; same concept as CompanyEvent for events but different table and not fully integrated in main UX |

**Bottom line:** “Workforce stuff” is just the nav name; the model is **CompanyX** (events, trainings, campaigns, etc.). The only clear overbuild is having **two** ways to represent event-based digital signs (legacy ProductDigitalSignCompanyEvent vs unified ProductDigitalSignWorkforceStuff). Unifying on the CompanyX variant for new event signage and merging read paths will simplify the model and UX without removing the four sign types that users and automation rely on.

---

## Done (don’t lose the thought)

- **Perks columns dropped:** Migration `20260217190000_drop_perks_and_remove_promo_cleanup` drops `perks` from `ProductDigitalSignWorkforceStuff` and `ProductDigitalSignCompanyEvent`. Schema updated (no more `perks` on those models). `CompanyEvent.perks` was already dropped earlier.
- **Promo removed:** All promo routes deleted (`app/workforce/events/[eventId]/promo/` — new, new/scratch, new/ai, new/previous, [promoId], [promoId]/success). `POST /api/ingest/promotional/ai` deleted. Event view page no longer has “Add Promotional Product” or “Promotional Products” section. Promo was deprecated; ProductX is used instead.

---

## Planned UX (don’t lose the thought)

**Not “promote” — use “Build Supporting Products”.**  
From a CompanyX item (event, training, campaign, etc.), the action is **“Build Supporting Products”**. That goes to the workforce container (CompanyX / workforcestuff context). Each product type has its own flow; the product UX is universal — one consistent pattern for creating and managing supporting products (digital signage, print, etc.) for any CompanyX item.
