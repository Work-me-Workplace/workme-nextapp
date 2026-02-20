# Task UX and previous-day carry-over

## Add-task flow (simplified)

- **One entry point:** "Add task" (daily page and modal).
- **Two forks:** **Manual** or **AI**.
  - **Manual:** Title, details, **Where from?** (enum), optional urgency/due date. Creates with `source: manual` and `derivedFrom`.
  - **AI:** Same **Where from?** dropdown, then describe in your words; we structure and create with `source: ai` and `derivedFrom`.
- **Derived-from enum** (single dropdown, not multiple buttons): My own, Boss, Workforce / company stuff, External pressure, Personal. Stored in `WorkOpsItem.derivedFrom` (optional).

We do **not** use 6+ source-type buttons; we use two choices (Manual / AI) and one "Where from?" enum.

## Previous day

- **Not automatic.** Tasks from the previous day are **not** auto-copied to today.
- **How it works:** On Daily, use the date arrows to pick a day. Click **"From previous day"** to expand a section that lists tasks that were assigned to **yesterday** (relative to the currently selected day).
  - **Add to Day** on a row assigns that one task to the **currently selected day**.
  - **Bring all forward** assigns every task from the previous day to the currently selected day in one go (e.g. if you forgot to carry them over). Shows loading and reports any failures in the error banner.
- **Empty state:** When the selected day has no tasks, the empty state offers: **Add task**, **From backlog**, **From previous day**.

## Error handling

- **Inline error banner:** Failed actions (assign, unassign, edit, delete, quick add, bring all forward) and failed loads (daily assignments, unassigned list, previous day) set an error message that appears in a dismissible red banner at the top. No `alert()` dialogs; errors are cleared when the user dismisses or when a later action succeeds.
- **Bring all forward:** On partial failure (some items failed to assign), the banner shows which tasks failed (up to 3 names plus "and N more" if needed).

## Schema

- `WorkOpsItem.source`: how it was added — `manual` | `ai` (and legacy `boss` | `system`).
- `WorkOpsItem.derivedFrom`: where it’s from — `my_own` | `boss` | `workforce_comms` | `external_pressure` | `personal` (optional).

Migration: `20260219000000_add_workops_derived_from` adds enum and `derivedFrom` column.
