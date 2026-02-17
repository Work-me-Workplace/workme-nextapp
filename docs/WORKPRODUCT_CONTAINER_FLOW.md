# WorkProductContainer: Where It Starts and Ends

**Purpose:** One view that shows the **work (source of truth)** and **work product options** together, so you don’t bounce between “workforcestuff” and “work products” and lose context.

---

## Where the container lives

The **WorkProductContainer** (work stuff + “Create from this” grid + “View related outputs”) appears on **two** routes only:

| Route | When you get here | Has container? |
|-------|--------------------|----------------|
| `/mycompany/workforcestuff/[id]` | Direct link with a single `id` (e.g. from Work Products “View source”, or `/mycompany/workforcestuff/abc-123`) | ✅ Yes |
| `/mycompany/workforcestuff/detail?companyId=...` | Click an item on the **Workforce Stuff list** (sessionStorage holds `id` + `type`) | ✅ Yes |

**File:** `components/workproduct/WorkProductContainer.tsx`  
**Used in:** `app/mycompany/workforcestuff/[id]/page.tsx`, `app/mycompany/workforcestuff/detail/page.tsx`, and all type-specific detail pages (training, impact-event, campaign, community, benefits, employee-cause, leader-engagement, career). List page has "Create products from this" in the card action menu.

---

## Where it does **not** live (type-specific detail pages)

After you **create** a workforcestuff item from Add, you are redirected to a **type-specific** URL. Those pages do **not** use WorkProductContainer and have **no** “Create products from this” (or similar) button:

| Created type   | Redirect after save | Has container? | Has “create product” CTA? |
|----------------|---------------------|----------------|----------------------------|
| Training       | `/mycompany/workforcestuff/training/{id}`       | ❌ No | ❌ No |
| Impact event   | `/mycompany/workforcestuff/impact-event/{id}`  | ❌ No | ❌ No |
| Event          | `/mycompany/workforcestuff/event/{id}`          | ❌ No | ❌ No |
| Campaign       | `/mycompany/workforcestuff/campaign/{id}`      | ❌ No | ❌ No |
| Community      | `/mycompany/workforcestuff/community/{id}`     | ❌ No | ❌ No |
| Benefits       | `/mycompany/workforcestuff/benefits/{id}`      | ❌ No | ❌ No |
| Employee cause | `/mycompany/workforcestuff/employee-cause/{id}`| ❌ No | ❌ No |
| Leader engagement | `/mycompany/workforcestuff/leader-engagement/{id}` | ❌ No | ❌ No |

So: **there is no button when a workforcestuff is created** — the post-create page is a type-specific detail with no container and no product-creation entry.

---

## Flow summary

### Start (creation)

1. **Add flow:** `/mycompany/workforcestuff/add` → pick type, fill form / ingest → save.
2. **After save:** Redirect to the **type-specific** detail URL (see table above).
3. **Result:** User is on a detail page **without** WorkProductContainer and **without** a “create product” button.

### Getting to the container

- **From the list:**  
  `/mycompany/workforcestuff` → click an item → `openDetail(item)` → `/mycompany/workforcestuff/detail?companyId=...` → **container is on this page.**  
  Or use the **⋮** action menu on any card → **"Create products from this"** → `/mycompany/workforcestuff/{id}` (generic container).

- **From any type-specific detail:**  
  Training, impact-event, campaign, community, benefits, employee-cause, leader-engagement, career pages **all render WorkProductContainer** inline.

- **From Work Products (with a source):**  
  `/mywork/products?sourceId=...` → “View source (work item)” → `/mycompany/workforcestuff/{sourceId}` → **container is on this page.**

- **Direct:**  
  Navigating to `/mycompany/workforcestuff/{id}` (if your app links there) also shows the container.

### End (what the container leads to)

- **“Create from this”** → one of: Email Digest, Digital Signage, Flyer/Poster, Senior Leader Email, Comms Plan (builders with `sourceId` / `sourceType`).
- **“View related outputs”** → `/mywork/products?sourceId=...` (list of work products for this source).

---

## Answer: Is there a button when a workforcestuff is created?

**No.** The post-create redirect goes to a type-specific detail page that does not include WorkProductContainer and has no “Create products from this” (or equivalent) button.

To see the container and product options after creating an item, the user would need to:

1. Go back to the Workforce Stuff list, and  
2. Open that item again (→ detail page with container), **or**  
3. Have a direct link to `/mycompany/workforcestuff/{id}` (generic route with container).

---

## Possible follow-up: add a CTA on post-create

To add a button when a workforcestuff is created, you could:

- On each **type-specific** detail page (training, impact-event, event, campaign, etc.), add a primary CTA that links to the **container** view, e.g.  
  **“Create products from this”** → `/mycompany/workforcestuff/{id}` (generic route that uses the same `id` and shows WorkProductContainer),  
  **or**  
  **“Create products from this”** → `/mycompany/workforcestuff/{id}/product-gen` (current product-gen page; back link already goes to “work item (source + product options)”).

- Alternatively, change the **post-create redirect** so that after creating any type you land on the container route:  
  `/mycompany/workforcestuff/{id}` (or detail with that item), so the first thing the user sees is work + product options.
