# Digital Signage: Workforce Context, Auto-Fill & Gamma Payload

**Date:** Feb 24, 2026  
**Purpose:** Document how workforce context flows into digital signage, how the Gamma payload is built, and the gap for an AI “sign stuff” (Title / Subhead / Picture / Detail) service.

---

## 1. Current flow: Sign → Gamma

1. **Sign content** lives in one of: `workforce`, `companyEvent`, `workforceStuff`, `companyNews`, `workforceAchievement`.
2. **DeckSpec** is built deterministically in `lib/deck/digital-signage-to-deck.ts`: sign → `{ title, subtitle, slides: [{ title, bullets?, imageUrl? }] }`.
3. **Blob** is built in `lib/deck/blob-mapper.ts`: `buildGammaBlob(deckSpec)` turns the DeckSpec into a **single human-readable text narrative** (e.g. “Presentation Title: …”, “Slide 1: …”, “- bullet”, “Image: …”).
4. **Gamma** receives that blob as `inputText`. We do **not** send JSON or markdown; Gamma’s API expects a human-readable structured narrative.

So: **the payload we send to Gamma is exactly that blob** — the narrative built from the sign’s title, subtitle, and slide titles/bullets (and optional image URLs when we have them).

---

## 2. Auto-fill (workforce context “brought forward”)

- On the digital signage **view** page (`/mywork/digital-signage/[id]`), when the sign has content (including `workforceStuff` from CompanyX ingests), we **auto-fill** the “details for Gamma” text area with the same blob we would send if the user left it blank.
- So the user sees workforce context (title, description, date, highlights, etc.) already in the box instead of a blank “put stuff here” prompt. They can edit and then click “Send to Gamma,” or leave it as-is.
- “Use this sign’s content” still does the same thing: fetches the preview blob from the sign’s content and sets the text area. Auto-fill does that once on load when the sign has content.

---

## 3. Existing AI: Raw text → structured sign (builder only)

- **`lib/ai/digitalSignageParser.ts`** uses OpenAI to parse **raw text** into a structured sign by type:
  - `WORKFORCE_ACHIEVEMENT`, `COMPANY_NEWS`, `WORKFORCE`, `COMPANY_EVENT` → parsed fields (headline, subheadline, body, eventName, eventItems, etc.).
- This is used when creating a sign from **pasted/raw input** in the builder (e.g. “paste your event description” → AI extracts eventName, date, location, eventItems).
- It does **not** take **workforceStuff** (CompanyX) as input. Workforce stuff signs are created by copying normalized DB fields (title, description, date, eventItems, etc.) into `ProductDigitalSignWorkforceStuff` — no AI step.
- It also does **not** produce a Gamma-specific shape (Title / Subhead / Picture / Detail block). It produces the existing builder variants (e.g. COMPANY_EVENT with eventName, eventDate, eventItems).

---

## 4. Desired “sign stuff” shape (Gamma-ready)

A consistent, Gamma-friendly sign structure we could target:

| Field        | Purpose |
|-------------|---------|
| **Title**   | Main headline for the deck/sign. |
| **Subhead** | Secondary line (optional). |
| **Picture** | Image URL or “detect/infer” (e.g. from content or AI-suggested). |
| **Detail block** | Body: bullets, description, or structured highlights. |

Today:
- **DeckSpec** already has `title`, `subtitle`, and per-slide `title`, `bullets`, `imageUrl`. We don’t currently infer or attach images for workforceStuff.
- **Blob** is built from that DeckSpec; Gamma gets the narrative. So we *could* drive everything from a single “sign stuff” structure (Title, Subhead, Picture, Detail block) and map that into DeckSpec → blob.

---

## 5. Gap: AI service “workforce stuff → sign stuff” (Title / Subhead / Picture / Detail)

We do **not** currently have an AI service that:

- Takes **workforce stuff** (or other inputs) and converts them into a **Gamma-ready “sign stuff”** structure: **Title**, **Subhead**, **Picture (detect/infer)**, **Detail block**.

Proposed direction:

- Add an AI service (e.g. `workforceStuffToSignStuff` or a general “sign stuff” generator) that:
  - **Input:** Workforce stuff payload (e.g. CompanyX fields: title, description, date, eventItems, etc.) and/or raw text.
  - **Output:** Normalized “sign stuff”: `{ title, subhead?, picture?: string | 'infer', detailBlock: string | string[] }`.
- **Picture:** “Detect/infer” = AI suggests an image (e.g. from description or topic) or we attach a chosen asset; the service could return a URL or a hint for the UI to resolve.
- That structure then feeds into **DeckSpec** (and thus **blob**) so the same narrative we send to Gamma is driven by a clear, editable sign model. Optionally, the view page could show/edit Title / Subhead / Picture / Detail block and then regenerate the blob from that.

---

## 6. Summary

| Piece | Current state |
|-------|----------------|
| **Gamma payload** | Single human-readable blob built from DeckSpec (title, subtitle, slides with title/bullets/imageUrl). |
| **Auto-fill** | View page fills the “details for Gamma” text area from the sign’s content (including workforceStuff) so workforce context is shown by default. |
| **AI parser** | `digitalSignageParser`: raw text → structured sign for builder; not used for workforceStuff → Gamma. |
| **AI “sign stuff”** | **Not implemented.** Desired: workforce (or raw) input → **Title, Subhead, Picture (detect/infer), Detail block** → then used to build DeckSpec/blob for Gamma. |

Once we have that AI “sign stuff” service, we can make “make this a sign” mean: convert input → Title / Subhead / Picture / Detail block → DeckSpec → blob → Gamma, with the view and builder optionally editing that structure instead of raw blob text.
