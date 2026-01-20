## MyCompany Param Hydration Plan

### Why params matter
- Easier save paths (company context is explicit).
- Easier model hydration (API calls can key off URL).
- Hooks were going nuts; params reduce dependency loops.

### Current reality
- Work.me is 1 person → 1 company (no memberships).
- IgniteBD/Gofast use memberships; they must select tenant before routing.
- Work.me can safely set `companyId` + `workMeId` in localStorage.

### Container split (two containers)
- `mycompany`: company-scoped experience (always expects `companyId`).
- `mystuff` (aka mywork/career/crm): personal/CRM experience (companyId optional).

### Contract (mirror IgniteBD)
- On **Welcome → Continue**, set `companyId` in localStorage and route with `?companyId=...`.
- For any **mycompany** navigation, always preserve/append `companyId` in URL.
- For non-company pages, allow `companyId` to exist but do not require it.

### URL rules
- **Required** for `/mycompany/**`: `?companyId=...`
- **Optional** for `/mywork/**`, `/mycareer/**`, `/mynetwork/**`, etc.

### LocalStorage rules
- Always write:
  - `companyId`
  - `companyUnit` (legacy mirror of companyId)
  - `workMeId`

### No-hook nav policy (per request)
- Left nav should not depend on React hooks.
- Read `companyId` via `window.location` + localStorage and append for `/mycompany/**`.

### Remaining gaps to close
1. Add a **mycompany guard**: if missing `companyId` in URL, redirect using localStorage.
2. Ensure **welcome** always routes to `?companyId=...` when available.
3. Audit **mycompany pages** to consume `companyId` from URL when present.
4. Verify **hydration endpoints** accept `companyId` as a query param everywhere.

### Suggested next steps
- Implement a small client layout under `app/mycompany` to enforce the guard.
- Normalize company param usage in `mycompany` pages (prefer URL, fallback to localStorage).
- Keep `mystuff` pages independent of company param unless needed for a specific feature.

