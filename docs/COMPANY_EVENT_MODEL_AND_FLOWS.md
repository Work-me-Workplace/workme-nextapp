# CompanyEvent: The Superbowls of the Stack

**CompanyEvents are the big, workforce-wide moments—the superbowls.** They deserve the most attention in the stack: the richest model, the best hydration (so “we’re having coffee and pastries” actually fills food), and explicit focus on **what we want the workforce to walk away with** (intended effect). This doc is the single place for the model, flows, and UI gaps.

---

## 1. Why CompanyEvent deserves the most attention

- **Workforce-wide.** Events are the main lever for reaching the whole workforce at once—ceremonies, appreciation, heritage, recognition, all-hands.
- **Outcome-focused.** Because they’re broad, we should think in terms of **intended effect**: what do we want people to walk away with? (e.g. “Feel recognized,” “Understand Q4 priorities,” “Celebrate heritage and belonging.”)
- **Rich content.** Events have speakers, food/refreshments, agenda (eventItems), vibe, category, audience—so parsing and UI should hydrate and expose these first-class (e.g. “coffee and pastries” → `foodProvided: yes`, `foodTypes: "coffee, pastries"`, plus eventItems so it shows as a highlight).
- **Participation vs eventItems.** `participation` is **deprecated** in favor of `eventItems`. Put agenda items, activities, and offerings (including “Coffee and pastries”) in `eventItems`; the parser and UI prefer eventItems.

---

## 2. Schema: What’s in CompanyEvent

**Model:** `CompanyEvent` (Prisma)  
**Table:** All fields below; relations to Company, WorkMe, and downstream products.

### Core content

| Field         | Type     | Required | Notes |
|---------------|----------|----------|--------|
| `title`       | String   | Yes      | Event name. |
| `theme`       | String?  | No       | e.g. "Appreciation", "Heritage". |
| `description` | String?  | No       | Full or short description. |

### When / where

| Field      | Type     | Notes |
|------------|----------|--------|
| `eventDate`| DateTime?| Date of the event. |
| `startTime`| String?  | e.g. `"09:00"`. |
| `endTime`  | String?  | e.g. `"10:30"`. |
| `location` | String?  | Venue or place. |

### Event-specific

| Field                  | Type             | Notes |
|------------------------|------------------|--------|
| `eventCategory`        | EventCategory?   | CELEBRATION, HERITAGE, COMMUNITY, RECOGNITION, APPRECIATION, FAMILY. |
| `registrationRequired` | String?          | e.g. "yes", "no", "optional". |
| `registrationLink`     | String?          | URL. |
| `audience`             | EventAudience?   | ALL_WORKFORCE, LEADERS, WORKFORCE_AND_FAMILIES, COMMUNITY. |
| `vibe`                 | String?          | Tone / vibe. |
| `eventItems`           | String[]         | **Primary:** highlights, agenda, key moments, offerings (e.g. "Coffee and pastries"). |
| `participation`        | String[]         | **Deprecated.** Use eventItems for agenda/activities. Kept for backward compatibility. |
| `foodProvided`         | String?          | e.g. "yes", "no". Must hydrate when text mentions refreshments (e.g. coffee and pastries). |
| `foodTypes`            | String?          | e.g. "coffee, pastries". |
| **`speakers`**         | **String[]**     | Who’s speaking. |
| **`intendedEffect`**   | **String?**      | **What should the workforce walk away with?** One sentence (e.g. "Feel recognized and connected."). |
| `pocEmail`             | String?          | Point of contact email. |
| `pocPhone`             | String?          | Point of contact phone. |

### Ingestion / metadata

| Field          | Type   | Notes |
|----------------|--------|--------|
| `ingestRawText`| String?| Original pasted text. |
| `summary`      | String?| Derived summary (e.g. from description). |

### Relations

- **Company:** `companyId` → `Company` (optional).
- **Owner:** `workMeId` → `WorkMe`.
- **Downstream products:**  
  `emailDigestItems`, `productSeniorLeaderEmails`, `companyWork`, `myContributions`, `digitalSigns` (ProductDigitalSignWorkforceStuff), `ProductDigitalSignCompanyEvent` (legacy).

---

## 3. Enums

**EventCategory:** `CELEBRATION` | `HERITAGE` | `COMMUNITY` | `RECOGNITION` | `APPRECIATION` | `FAMILY`  

**EventAudience:** `ALL_WORKFORCE` | `LEADERS` | `WORKFORCE_AND_FAMILIES` | `COMMUNITY`

---

## 4. Hydration: Coffee and pastries (and food in general)

**Problem:** Pasting “we’re having coffee and pastries” did not hydrate food fields.

**Fix:**

- **Parser prompt:** Explicit rules that any mention of refreshments, food, or drinks (coffee, pastries, donuts, breakfast, lunch, refreshments, catered, etc.) must set `foodProvided: "yes"` and `foodTypes` to what’s mentioned. Those offerings should also appear in `eventItems` so they show as highlights.
- **Fallback in code:** In `event-mapper-service.ts`, after the AI response, if the raw text matches food-related keywords and the model left `foodProvided` empty, we set `foodProvided: "yes"` and derive `foodTypes` from the text; if `eventItems` is still empty, we add the food types as a single eventItem (e.g. “Coffee, pastries”).

So “hey we’re having coffee and pastries” should now hydrate to: `foodProvided: "yes"`, `foodTypes: "coffee, pastries"`, and an eventItem like “Coffee, pastries”, plus a sensible description/title when possible.

---

## 5. Intended effect

CompanyEvents are workforce-wide, so we should think in terms of **outcome**: what do we want the workforce to walk away with?

- **Schema:** `CompanyEvent.intendedEffect` (String?, optional).
- **Parser:** Prompt asks for one short sentence (e.g. “Feel recognized and connected.”, “Understand Q4 priorities.”). Infer from event type and tone if not stated.
- **Save:** `saveEvent()` in `companyx-save-handlers.ts` persists `intendedEffect`.
- **UI:** Not yet on Add review or detail edit; add when event form is expanded (see Recommendations).

---

## 6. Pipeline: How CompanyEvent items get in

### 6.1 Add flow (paste → review → save)

1. User picks type **Event** and pastes text on **Add Workforce Item** (`/mycompany/workforcestuff/add`).
2. **Parse:** `POST /api/workstuff/ingest/event/parse` → `parseEvent(rawText)` in `lib/services/event-mapper-service.ts`.  
   Returns **EventModel** (title, theme, description, eventDate, start/end time, location, eventCategory, registration, audience, vibe, **eventItems**, participation, **foodProvided**, **foodTypes**, **speakers**, **intendedEffect**, POC).
3. **Review form** shows a subset of fields; user can edit.
4. **Save:** `POST /api/workstuff/ingest/event/create` then `POST /api/workstuff/ingest/event-save` → **saveEvent()** maps EventModel → CompanyEvent (all fields including intendedEffect).

### 6.2 What the Add review form shows today (events)

| In schema / parser   | In Add review form |
|----------------------|--------------------|
| title, theme, description | ✅ |
| eventDate, location, start/end time | ✅ |
| eventCategory, audience | ✅ (as text) |
| registrationLink, pocEmail, pocPhone | ✅ |
| **speakers**         | ❌ |
| **eventItems**       | ❌ |
| **foodProvided / foodTypes** | ❌ (now hydrated by parser + fallback) |
| **intendedEffect**   | ❌ |
| vibe, participation  | ❌ |

So food and intendedEffect are **stored** after parse/save, but not yet **editable** in the Add or detail forms.

### 6.3 Detail page (unified workforcestuff/[id])

- **GET** returns the event with all DB fields (speakers, eventItems, food, intendedEffect, etc.).
- **PUT / buildUpdateData** for event currently sends only a subset (title, description, dates, location, registrationLink, POC). It does **not** send theme, eventCategory, audience, speakers, eventItems, food, intendedEffect, vibe.

---

## 7. Where speakers, food, eventItems show up

- **Parser + save:** All are extracted and persisted.
- **Public event view:** `app/workforce/events/[eventId]/view/page.tsx` displays speakers, eventItems, participation, vibe, foodProvided when present.
- **Digital signage:** Uses eventItems (and related) from the linked CompanyEvent.
- **Add / detail forms:** Speakers, eventItems, food, intendedEffect are not yet in the form UI (data is there; forms need to be extended).

---

## 8. Recommendations

1. **Event Add form:** Add fields for **Speakers**, **Food** (foodProvided / foodTypes or a single “Refreshments” line), **Event items / highlights**, and **Intended effect** so users can see and edit what the parser filled.
2. **Detail page event edit:** Extend **buildUpdateData** and the form to include theme, eventCategory, audience, speakers, eventItems, foodProvided, foodTypes, intendedEffect, vibe.
3. **Treat eventItems as primary;** keep participation in schema but don’t add new UI for it; document as deprecated in favor of eventItems.
4. **Category / audience:** Use `<select>` with EventCategory and EventAudience enums in forms.
5. **Intended effect** in product copy: Use it in digests, signage, or comms so “what we want them to walk away with” is visible downstream.

---

## 9. File reference

| Concern            | File(s) |
|--------------------|--------|
| CompanyEvent schema| `prisma/schema.prisma` (model CompanyEvent, enums, **intendedEffect**) |
| Event parse (AI + food fallback) | `lib/services/event-mapper-service.ts` |
| Event save         | `lib/services/companyx-save-handlers.ts` → `saveEvent()` |
| Add flow event review form | `app/mycompany/workforcestuff/add/page.tsx` |
| Unified detail GET/PUT, buildUpdateData (event) | `app/api/workforcestuff/[id]/route.ts`, `app/mycompany/workforcestuff/[id]/page.tsx` |
| Public event view  | `app/workforce/events/[eventId]/view/page.tsx` |

---

## 10. Migration for intendedEffect

After pulling the schema change, run:

```bash
npx prisma migrate dev --name add_company_event_intended_effect
```

This adds the `intendedEffect` column to `CompanyEvent`. `prisma generate` has already been run so the client types are up to date.

---

**Summary:** CompanyEvents are the superbowls of the stack—workforce-wide, outcome-focused, and rich in content. The model now has **intendedEffect**; the parser hydrates **food** (e.g. “coffee and pastries”) via prompt and fallback; **participation** is deprecated in favor of **eventItems**. Next step is exposing speakers, eventItems, food, and intendedEffect in the Add and detail event forms so they get the attention they deserve.
