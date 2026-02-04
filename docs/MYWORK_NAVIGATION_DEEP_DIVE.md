# Mywork navigation deep dive

## Principle

**If it’s in the navigation, it’s in the sidebar.** Section headers (e.g. Mywork) are the container; each item under that section should be a real destination that appears in the sidebar. No redundant “My Work” link when the section is already “Mywork”.

---

## Routes under `/mywork` (what actually exists)

| Path | Purpose | In sidebar? |
|------|---------|-------------|
| `/mywork` | Hub/landing – 4 cards (Products, Plans, Active, Events) | No (redundant with section; hub is reachable via breadcrumb/top nav) |
| `/mywork/products` | Work Products list + product types (digital signage, flyer, senior leader email, comms plan) | ✅ Work Products |
| `/mywork/products/digital_signage/[id]/review` | Digital signage review | Under Work Products (isActive via `/mywork/products`) |
| `/mywork/digital-signage/*` | Digital signage builder, new, [id] | Under Work Products (isActive via `/mywork/products`) |
| `/mywork/seniorleader/build` | Senior leader email builder | Entry from product-gen; back links to `/mywork/products` |
| `/mywork/active` | Stuff I’m Working On | ✅ Stuff I'm Working On |
| `/mywork/plans` | Plans hub (Event Planner, Concept Drafter) | ✅ Plans (added) |
| `/mywork/plans/concept-drafter` | Concept Drafter | Under Plans |
| `/mywork/events` | Events landing | ✅ Events (added) |
| `/mywork/team` | Team Members | In **MyOrganization** (sidebar: Team Members) |
| `/mywork/memos` | Personal Branding / memos | Removed from Mywork sidebar (still at `/mywork/memos`) |
| `/mywork/create` | Generic create (e.g. from milestones) | Not a nav destination; flow entry |
| `/mywork/fromcompanystuff` | From company stuff | Not in current nav |
| `/mywork/highlights/[id]` | Highlight detail | Not in Mywork nav |
| `/mywork/linkedin/[id]` | LinkedIn/memo related | Under memos (Personal Branding) |

---

## Hub page (`/mywork`) – 4 cards

The hub explicitly navigates to:

1. **Products** → `/mywork/products` ✅ sidebar “Work Products”
2. **Plans** → `/mywork/plans` ✅ sidebar “Plans”
3. **Active Work** → `/mywork/active` ✅ sidebar “Stuff I'm Working On”
4. **Events** → `/mywork/events` ✅ sidebar “Events”

So the sidebar Mywork section should list exactly these four destinations (no separate “My Work” item).

---

## Work Products – accounted for

Work Products is the main surface for “things I made”:

- **Sidebar:** “Work Products” → `/mywork/products`
- **Products page** lists types and links to:
  - Digital Signage → `/mywork/digital-signage/*` (create, view, edit)
  - Flyer/Poster → builder flow
  - Senior Leader Email → `/mywork/seniorleader/build`
  - Comms Plan → products comms-plan flow
- **isActive:** `/mywork/products` and `/mywork/digital-signage` both highlight “Work Products”

No change needed for Work Products coverage; only alignment so the sidebar matches the hub and drops the redundant “My Work” link.

---

## Sidebar vs TopNav alignment

| TopNav “My Work” dropdown | Sidebar “Mywork” section (after change) |
|---------------------------|----------------------------------------|
| My Work (dashboard)       | *(removed – redundant)* |
| Products                  | Work Products |
| Active                    | Stuff I'm Working On |
| *(none)*                  | Plans |
| *(none)*                  | Events |

TopNav can be updated later to add Plans and Events if we want full parity; the sidebar is the source of truth for “everything under Mywork that’s a nav destination”.

---

## Summary of sidebar changes

1. **Remove** “My Work” from Mywork items (section name is enough; hub still at `/mywork`).
2. **Add** “Plans” → `/mywork/plans` (icon: ClipboardList).
3. **Add** “Events” → `/mywork/events` (icon: Calendar).
4. **isActive:** add handling for `/mywork/plans` and `/mywork/events` (and sub-routes where appropriate).

Result: Mywork section has four items – Work Products, Plans, Stuff I'm Working On, Events – matching the hub and the rule “if it’s in the navigation, it’s in the sidebar.”
