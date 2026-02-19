# CompanyX / Workforce stuff: date-only (no status enum)

We **removed** the `WorkforceStuffStatus` enum and the `status` field from all CompanyX models. Workforce items are not products — they don’t have a “draft → active” lifecycle. Current vs past is **date-dependent** only.

## Rule

- **No stored status.** No DRAFT, ACTIVE, ARCHIVED, or EXPIRED on any CompanyX model.
- **Dates are the source of truth.** Every CompanyX type has at least one date (or window) used for “current vs past.”
- **API and UI derive “current” vs “past”** with a date check: e.g. `endDate < now` → past; otherwise current. The workforcestuff API returns `status: 'active' | 'archived'` and `archived: boolean` **derived** from dates so existing UI (filters, badges) keeps working without code changes.

## Date fields (locked across models)

| Model | Start / primary date | End date |
|-------|----------------------|----------|
| CompanyCampaign | windowStart | windowEnd |
| CompanyImpactEvent | effectiveDate | — |
| CompanyTraining | trainingDate | completionDeadline (self-paced) or trainingDate |
| CompanyEvent | eventDate | eventDate |
| CompanyLeaderEngagement | engagementDate | — |
| CompanyCommunity | date | — |
| CompanyBenefits | windowStart | windowEnd |
| CompanyCareer | windowStart | windowEnd |
| CompanyEmployeeCause | windowStart | windowEnd |

**Derivation:** `isPast(start, end)` → if `end` set, use `end < now`; else if `start` set, use `start < now`; else current. API uses this to set `status` and `archived` on the normalized response; UI can do the same for any custom views.

## What was removed

- **Schema:** `WorkforceStuffStatus` enum and `status` (and `@@index([status])`) from CompanyCampaign, CompanyImpactEvent, CompanyTraining, CompanyEvent, CompanyLeaderEngagement, CompanyCommunity, CompanyBenefits, CompanyCareer, CompanyEmployeeCause.
- **CompanyCareer:** Added `windowStart` and `windowEnd` (optional) so it’s date-aligned with the rest; careers with no dates are treated as current.
- **PATCH /api/workforcestuff/[id]:** No longer accepts or persists `status` or `archived`; those are derived on read only.

## Migration

Run a migration to drop the `status` column from all CompanyX tables and add `windowStart`/`windowEnd` to CompanyCareer. Existing data: items without dates remain “current” until you set dates.
