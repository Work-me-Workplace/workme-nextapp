# Task Concept & AI Analysis (Daily Outlook)

**Date:** February 17, 2026

## 1. Task concept: blob → day (or “assign to myself later”)

### How it works today

- **Task = WorkOpsItem.** It starts as a “blob”: title, body, type, urgency. It lives in your outlook and has an optional `dueDate` (deadline) on the item.
- **Scheduling to a day** is separate: done via **DailyAssignment** (itemId + day). So the same task can be assigned to one or more days; “Add to Day” creates an assignment for the **currently viewed day**.
- **Where do you assign the date?**
  - **On the Daily page:** Only by (1) picking the day with the date arrows, then (2) clicking **“Add to Day”** on an unassigned item. There is **no date picker on the task card**.
  - **When creating a task:** The create API accepts `dueDate` (and AI can extract it), but the **Add Work modal has no “schedule for this day” or “schedule for date X”** control. So “assign to today” or “in two weeks” is not visible in the add flow—you create the blob, then on Daily you assign it to a day.
- **“Assign to myself in two weeks”:** Today you’d navigate to that future day on Daily and click “Add to Day” for the item. There’s no inline “schedule for [date]” on the task row.

### Gaps / possible improvements

| Need | Current | Option |
|------|--------|--------|
| Assign date on the task | Only via Daily: change day, then “Add to Day”. No date on card. | Add “Schedule for” (date picker or “Today” / “Tomorrow”) on unassigned item row and/or in task detail. |
| Assign when creating | No “add to today” or “schedule for [date]” in Add Work modal. | In Add Work (or SmartWorkForm): “Also add to day: [Today / Pick date / Skip]”. |
| dueDate vs “day” | Item has `dueDate` (deadline). “Day” is DailyAssignment. | Keep both; consider showing “Due: X” and “On my plan for: [dates]” so it’s clear. |

---

## 2. AI issues

### 2.1 “User wants to do this” — wrong voice

- **Problem:** The model is prompted to “analyze what the user really wants to DO,” so it sometimes outputs **third‑person** text like “User wants to get a workshop series going” or “The user wants…” in **title** or **body**. The person using the app *is* the user; the text should read like their own note, not a report about them.
- **Fix (in prompt + validation):**
  - **Title:** First person (“I want to…”) or **imperative** (“Get workshop series going,” “Launch workshop series”). Never “The user wants…” or “User wants….”
  - **Body:** Same—first person or neutral detail (e.g. “SharePoint slating panel, update digital signage from NTK, RSVP form for Bring Your Child to Work Day”). `suggestedAction` can stay as internal “what they want to do” for the UI label only; it must not be copied into title/body as third person.

### 2.2 Bulk detect and parse

- **Problem:** Pasting a list (e.g. several bullets or lines) is treated as **one** blob. The AI returns a single title/body, so you get one messy item instead of one per line/item.
- **Fix:**  
  - **Detect bulk:** If input has multiple lines or bullet-like segments (e.g. newlines, “-”, “*”, numbered lines), treat as multiple items.  
  - **Parse:** Either (a) split on delimiters and call analyze (and optionally create) per segment, or (b) add a **bulk analyze** endpoint that returns an array of `WorkItemAnalysisOutput` and then create N items.  
  - **UX:** After bulk create, show “Created 5 items” and e.g. open backlog so user can assign to days.

---

## 3. Summary

- **Task concept:** Task = blob (WorkOpsItem); date = “which day I’m planning to do it” via DailyAssignment. Right now you assign the date only on the Daily page by choosing the day and clicking “Add to Day”; there’s no date on the task card and no “schedule for” in the add flow.
- **AI 1:** Change prompts (and any post-processing) so title/body are first‑person or imperative, never “the user wants…”
- **AI 2:** Add bulk detection and parsing so one paste can become multiple tasks, with clear UX for reviewing and assigning them.
