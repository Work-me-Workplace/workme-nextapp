# Email Digest UX Flows - Design Proposal

**Date:** 2025-12-17  
**Status:** 🟡 PENDING APPROVAL - Do not code until decided

---

## 🎯 YOUR QUESTIONS

1. **Do we view goes to manage when we finish?**
2. **Do we give option for one-off?**
3. **Once we create the series does it then drive me to set up the 1st of the series?**

---

## 📍 CURRENT FLOW (AS BUILT)

### Landing Page: `/workforce/enduring/email-digest`
- Shows list of all series (cards)
- Has "+ Create New Series" card
- **Issues:** 
  - ❌ No explanation of what this is
  - ❌ No option for one-off emails
  - ❌ Just dumps you into a list

### Create Series: `/workforce/enduring/email-digest/new`
- Form with: Series Title, Series Description
- Blue info box: "This creates a RECURRING email digest series..."
- **Issues:**
  - ❌ No choice between one-off vs recurring
  - ❌ Goes straight to form (abrupt)

### After Creating Series: Redirects to `/workforce/enduring/email-digest/${seriesId}`
- Shows series detail page
- Has button: "+ Generate New Edition"
- Shows list of existing editions (empty for new series)
- **Issues:**
  - ❌ User created series but now what?
  - ❌ No prompt to create first edition
  - ❌ Feels incomplete

### After Clicking "Generate New Edition": Redirects to `/workforce/enduring/email-digest/${seriesId}/editions/${editionId}`
- Edition detail page (no curation UI built yet)
- **Issues:**
  - ❌ Curation page doesn't exist yet
  - ❌ No clear next step

---

## 🎨 PROPOSED IMPROVED FLOWS

### OPTION A: Landing Page + Choice Pattern

```
┌────────────────────────────────────────────────────────────┐
│ /workforce/enduring/email-digest (NEW LANDING PAGE)        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  📧 Email Digest Builder                                   │
│  Create recurring email series or one-off digests          │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │  📅 RECURRING       │  │  📬 ONE-OFF          │        │
│  │  SERIES             │  │  EMAIL               │        │
│  │                     │  │                      │        │
│  │  Create a series    │  │  Create a single     │        │
│  │  (e.g. weekly)      │  │  digest email        │        │
│  │                     │  │                      │        │
│  │  [Create Series →]  │  │  [Create Email →]    │        │
│  └─────────────────────┘  └─────────────────────┘        │
│                                                             │
│  ────────────────────────────────────────────────         │
│                                                             │
│  Your Series (3)                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ Weekly       │ │ Monthly      │ │ Quarterly    │     │
│  │ Update       │ │ Benefits     │ │ Review       │     │
│  │ 12 editions  │ │ 8 editions   │ │ 2 editions   │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Flow after clicking "Create Series":**
```
1. /workforce/enduring/email-digest
   ↓ Click "Create Series"
2. /workforce/enduring/email-digest/new (series setup form)
   ↓ Fill form, click "Create Email Digest Series"
3. /workforce/enduring/email-digest/${seriesId}/first-edition (NEW)
   ↓ Prompt: "Great! Now create your first edition"
   ↓ Shows curation UI to select CompanyX items
   ↓ Click "Generate First Edition"
4. /workforce/enduring/email-digest/${seriesId} (series detail)
   ↓ Shows series with first edition created
```

**Flow after clicking "Create Email" (one-off):**
```
1. /workforce/enduring/email-digest
   ↓ Click "Create Email"
2. /workforce/enduring/email-digest/one-off/new (NEW)
   ↓ Shows: Title field + item selection in ONE page
   ↓ Click "Generate Email"
3. /workforce/enduring/email-digest/one-off/${emailId} (preview)
   ↓ Shows generated content
   ↓ Can send or edit
```

---

### OPTION B: Wizard Pattern (Multi-Step)

```
┌────────────────────────────────────────────────────────────┐
│ Step 1: Choose Type                                         │
├────────────────────────────────────────────────────────────┤
│  What do you want to create?                               │
│  ○ Recurring Series (Weekly, Monthly, etc.)                │
│  ○ One-Off Email (Single digest)                           │
│                                                             │
│                                 [Next →]                    │
└────────────────────────────────────────────────────────────┘

↓ If Recurring ↓

┌────────────────────────────────────────────────────────────┐
│ Step 2: Series Details                                      │
├────────────────────────────────────────────────────────────┤
│  Series Title: [________________________]                   │
│  Description:  [________________________]                   │
│  Frequency:    [Weekly ▼]                                  │
│                                                             │
│                        [← Back]  [Next →]                   │
└────────────────────────────────────────────────────────────┘

↓

┌────────────────────────────────────────────────────────────┐
│ Step 3: First Edition (optional)                           │
├────────────────────────────────────────────────────────────┤
│  Do you want to create the first edition now?             │
│  ○ Yes, create first edition now                           │
│  ○ No, I'll create it later                               │
│                                                             │
│                        [← Back]  [Finish]                   │
└────────────────────────────────────────────────────────────┘
```

---

### OPTION C: Minimal Change (Keep Current, Add Prompt)

Keep current flow but add a "success modal" after creating series:

```
After creating series, show modal:

┌─────────────────────────────────────────────────┐
│  ✓ Series Created Successfully!                 │
├─────────────────────────────────────────────────┤
│  "Weekly Workforce Update" has been created.    │
│                                                  │
│  What would you like to do next?               │
│                                                  │
│  [Create First Edition Now →]                   │
│  [Go to Series Page]                            │
└─────────────────────────────────────────────────┘
```

---

## 🤔 DECISION POINTS

### 1. Landing Page Experience

**Current:** Just a list with "+ Create New Series" card

**Options:**
- **A1:** Landing page with clear choice: Recurring vs One-Off (Option A above)
- **A2:** Keep simple list, add description text at top
- **A3:** Full wizard experience (Option B above)

**Recommendation:** **A1** - Clear choice is best UX

---

### 2. One-Off Email Support

**Current:** NO one-off support - only recurring series

**Options:**
- **B1:** Add one-off support now (separate model/flow)
- **B2:** Add one-off support later (not MVP)
- **B3:** Force everything to be a "series" (even if only 1 edition)

**Your earlier preference:** "yes option 2" (separate models)

**Recommendation:** **B1** - You already said you want this, let's do it right

**If B1, we need to decide:**
- Separate model `WorkForceOneOffEmailDigest` OR
- Same model with `type` field (recurring/oneoff)?

---

### 3. First Edition Setup Flow

**Current:** After creating series, user lands on series detail page with "+ Generate New Edition" button (not obvious)

**Options:**
- **C1:** Auto-redirect to first edition creation (Option A flow above)
- **C2:** Show modal asking if they want to create first edition (Option C above)
- **C3:** Leave as-is, assume power users will figure it out
- **C4:** Wizard that includes first edition as Step 3 (Option B above)

**Recommendation:** **C1** or **C2** - Don't leave user hanging

---

### 4. After Series Creation Destination

**Current:** `/workforce/enduring/email-digest/${seriesId}` (series detail page)

**Options:**
- **D1:** Go to first edition creation immediately
- **D2:** Show success modal → let user choose
- **D3:** Go to series detail page (current)
- **D4:** Go back to list with success message

**Recommendation:** **D1** if we want smooth onboarding, **D2** if we want flexibility

---

## 💡 MY RECOMMENDED FLOW (For Discussion)

### For Recurring Series:

```
1. Landing: /workforce/enduring/email-digest
   - Header: "Email Digest Builder"
   - Two clear cards: "Recurring Series" and "One-Off Email"
   - Below: List of existing series
   
2. Click "Create Recurring Series"
   → /workforce/enduring/email-digest/series/new
   
3. Fill form (Title, Description, Frequency dropdown?)
   Click "Create Series & Set Up First Edition"
   
4. Auto-redirect to first edition setup
   → /workforce/enduring/email-digest/${seriesId}/editions/new?isFirst=true
   - Show: "Let's create your first edition of [Series Name]"
   - Curation UI: Select CompanyX items
   - Click "Generate First Edition"
   
5. Redirect to series detail page
   → /workforce/enduring/email-digest/${seriesId}
   - Shows series with 1 edition
   - Can generate more editions
```

### For One-Off Email:

```
1. Landing: /workforce/enduring/email-digest
   
2. Click "Create One-Off Email"
   → /workforce/enduring/email-digest/one-off/new
   
3. Single page with:
   - Email Title field
   - Curation UI (select CompanyX items) - all on one page
   - Click "Generate Email"
   
4. Redirect to preview
   → /workforce/enduring/email-digest/one-off/${emailId}
   - Shows generated content
   - Can edit/regenerate/send
```

---

## 📋 WHAT NEEDS TO BE BUILT (If Recommended Flow Approved)

### Phase 1: Landing Page Improvements
- [ ] Update `/workforce/enduring/email-digest` to show choice cards
- [ ] Add descriptive header and explanation
- [ ] Keep existing series list below

### Phase 2: One-Off Email Support
- [ ] Decide: Separate model or type field?
- [ ] Add schema for one-off emails
- [ ] Create `/workforce/enduring/email-digest/one-off/new` page
- [ ] Server actions for one-off creation

### Phase 3: First Edition Flow
- [ ] Add success handling after series creation
- [ ] Create `/workforce/enduring/email-digest/${seriesId}/editions/new` curation page
- [ ] Implement auto-redirect or modal choice

### Phase 4: Curation UI (Already Needed)
- [ ] Build item selection interface
- [ ] Checkboxes for CompanyX items
- [ ] Reorder functionality
- [ ] Save to EmailDigestItem table

---

## ❓ QUESTIONS FOR YOU

### Question 1: Landing Page
Which pattern do you prefer?
- **A:** Clear choice cards (Recurring vs One-Off) on landing page ✨ RECOMMENDED
- **B:** Wizard with steps
- **C:** Keep simple list, add success modal

### Question 2: One-Off Emails
Should we add one-off support?
- **A:** Yes, add now (you said "option 2" earlier) ✨ RECOMMENDED
- **B:** No, later
- **C:** Force everything to be a series

If Yes:
- **Separate model** `WorkForceOneOffEmailDigest` ✨ RECOMMENDED (cleaner)
- **Type field** on existing model (simpler migration)

### Question 3: First Edition
After creating series, what happens?
- **A:** Auto-redirect to create first edition ✨ RECOMMENDED
- **B:** Show modal asking if they want to create first edition
- **C:** Leave on series detail page (current)

### Question 4: One-Off UX
How should one-off creation work?
- **A:** Single page: Title + item selection + generate all in one ✨ RECOMMENDED
- **B:** Multi-step like recurring
- **C:** Reuse recurring flow, just mark as "1 edition max"

---

## 🎯 DECISION REQUIRED BEFORE CODING

Please answer the 4 questions above, then I'll implement the chosen flow!

**Recommendation Summary:**
- Landing with clear choice cards (Q1: A)
- Add one-off support with separate model (Q2: A + separate model)
- Auto-redirect to first edition after series creation (Q3: A)
- One-off as single-page experience (Q4: A)

This gives you:
✅ Clear landing page (not abrupt)
✅ One-off email support
✅ Smooth series → first edition flow
✅ Proper separation of concerns

---

**End of Proposal - Awaiting Your Decisions!**
