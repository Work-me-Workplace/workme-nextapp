# Workforce Stuff: Tracking Layer vs Doing Layer

## Problem

- **Doing layer**: A consulting firm (or internal team) creates and maintains the actual products (digital signs, flyers, digest items, etc.) from workforce items. They do the work.
- **Tracking layer**: The client (e.g. you) needs to answer “**Is it done?**” without doing the work—just review/approve or mark complete.

Right now the app supports the doing side (create workforce item → generate products). It does not yet expose a clear **client tracking** view: “Which items have products? Which are signed off / done?”

## Current State

- **Product existence**: `GET /api/workforcestuff/[id]/product-status` returns which product types exist for a given workforce item (email_digest, digital_signage, senior_leader_email, etc.). That answers “has the doing side created this product?” but not “has the client marked it done?”
- **Workforce list**: `app/mycompany/workforcestuff/page.tsx` lists items with time horizon; no “done” or “client approved” state is shown.

## Proposed: Tracking Layer

1. **Status or “done” on the item (or per product)**  
   - Option A: Single “client done” (or “approved”) flag on the workforce item (e.g. on a unified blob or on `CompanyEvent` / other CompanyX models if we add a nullable `clientApprovedAt` or `trackingStatus`).  
   - Option B: Per-product tracking (e.g. “Digital sign: done ✓, Email digest: pending”).  
   - Recommendation: Start with Option A (one “is it done?” per workforce item) so the client can say “this event is done” without caring which specific products exist.

2. **UI**  
   - On the workforce list: column or badge “Done” / “Pending” (and optionally “Has products” from existing product-status).  
   - On the item detail or product-gen page: “Mark as done” (tracking) vs “Generate / edit products” (doing).

3. **APIs**  
   - `PATCH /api/workforcestuff/[id]` (or a dedicated `PATCH .../tracking`) to set `clientDoneAt` / `trackingStatus`.  
   - List/detail responses include this so the tracking view can show status.

## Summary

| Layer    | Who       | Question           | Current support                          |
|----------|-----------|--------------------|------------------------------------------|
| Doing    | Consultant| Create/edit products | Add item, product-gen, product-status (exists) |
| Tracking | Client    | Is it done?        | Not yet; product-status only shows “exists”   |

Adding a tracking layer (e.g. “Mark as done” + optional `clientDoneAt` or `trackingStatus`) would let the client answer “is it done?” without touching the doing workflow.
