# Next Job Platform: Full Circle Design

**Status:** Design — MVP1 (grounded) + future state  
**Scope:** Next job = network your way in; reqs frame what they want; career CRM backs it up. Later: CareerProgression, market value, AI, open reqs.

---

## MVP1 (back to earth): “Do I know anyone?”

**The moment:** There’s a req out there. Salary looks good, it’s in comms (or whatever). I want to apply.

**The question:** **Do I know anyone?**  
That’s what backs it up. You network your way in — “I want to work at [industry / company type]” — and you use **people**, not just “a req popped.” Reqs still matter: they **frame** everything. “This is what they’re looking for — got it.” So your life (goals, performance, how you present) becomes a **reflection of the market value needed**. Beyond performance plan: *how do I make my life a reflection of the market value needed?*

**MVP1 in practice:**
- Save or paste a **req** (target job): title, company, salary band, role/industry, JD text.
- **Do I know anyone?** — Career CRM: contacts at that company, recruiters, referrals, hiring managers. List by job or by person. “I know someone” → that’s your in.
- Req = **frame**. Job-fit (existing) shows “this is what they want” ↔ your skills/evidence. You align your story (and later resume) to that frame.

No AI synthesis yet. No LinkedIn open-req pull. Just: req exists → do I know anyone? → network in; use the req to frame what you offer.

---

## Future state (super future): AI + CareerProgression + full context

Somewhere between **goals (North Star)** and “your next job” we may have:

- **CareerProgression** (new model) — e.g. “your next job could be …” Possibly reads **PerformanceReview** (what you did, how you’re positioned).
- **Work goals / North Star** — already in platform; feeds “what I’m aiming for.”
- **Market value** — MarketNeed, SkillTopicMarketValue: where your skills matter.
- **FamilySituation** — not modeled yet; life context that affects when/where/how you move.
- **MonetaryAim** — salary/comp target (WorkProfile.salaryRange is adjacent).
- **Open reqs** — pull from LinkedIn (or other sources); external openings as signals.

**AI gets it for you:** Synthesize North Star + CareerProgression + performance review + market value + family + money + open reqs → “here are roles / companies / people that fit; here’s who you know there.”

MVP1 doesn’t depend on any of this. It only needs: **req + “do I know anyone?”** (career CRM).

---

## 1. The full circle (when we build out)

Use the platform end-to-end for **next job**:

1. **Think big** — What position / industry / company type? (North Star, maybe CareerProgression, market value)
2. **Resume builder** — One canonical “me” resume from building blocks
3. **Resume converter** — Tailor that resume to the req (req = frame for what they want)
4. **Career CRM** — Do I know anyone? Track people and companies; network your way in

Everything reuses the same evidence: skills, contributions, assessments, performance reviews. Reqs help you **frame** so your life is a reflection of the market value needed.

---

## 2. Resume builder (building blocks)

**Idea:** The resume is assembled from **blocks** the platform already has or can derive.

### Building blocks (sources)

| Block type | Source in platform | Notes |
|------------|--------------------|--------|
| **Headline / summary** | WorkProfile (responsibilitySummary), BrandPositioning, or freeform | “What I do” in one line |
| **Experience entries** | MyContribution, ContributionSummary, PerformancePlan/Review | What I did, with results |
| **Skills** | SkillTopic + SkillItem (evidence) | Durable capabilities, not buzzwords |
| **Education / certs** | Not yet modeled | Could be WorkProfile extension or separate model |
| **Market angle** | SkillTopicMarketValue, MarketNeed | Why my skills matter in a given context |

**Canonical resume** = one “master” view: all blocks, one ordering, one narrative. Stored as structured data (e.g. sections + block refs), not a single blob. Export to PDF/MD/DOCX later.

### Schema direction (no change required immediately)

- Option A: **Resume** (id, workMeId, title, sections JSON) where each section references block types and IDs (e.g. contributionSummaryIds[], skillTopicIds[], customBlurb).
- Option B: **ResumeSection** (id, resumeId, kind, order, payload JSON) with kind = `experience` | `skills` | `summary` | `education` | `custom`.

Building blocks stay as-is (ContributionSummary, SkillTopic, WorkProfile, etc.); the resume is a **view over** them plus optional custom text.

---

## 3. Resume converter (per job position)

**Idea:** For a **specific job** (target role/company or pasted JD), produce a **tailored** version of the resume.

- **Input:**  
  - Canonical resume (building blocks).  
  - Job context: job title, company, pasted JD text (and optionally parsed requirements).
- **Process:**  
  - Reorder/select blocks that best match the JD.  
  - Emphasize skills and contributions that map to requirements (reuse job-fit logic).  
  - Optional: one-line “positioning” or summary that speaks to this role.
- **Output:**  
  - Tailored resume (same block model, different selection/order + optional custom summary).  
  - Export to PDF/MD/DOCX for this application.

**Existing piece:** Job-fit flow (`/career/job-fit`, `POST /api/myskills/match-job-post`) already matches **requirements ↔ skills/evidence**. Resume converter is the same matching engine + **selection and ordering of blocks** + export.

### Model for “target job”

- **TargetJob** or **JobApplication** (id, workMeId, jobTitle?, companyName?, rawDescription?, parsedRequirements JSON?, status?, createdAt).  
- Optional: link to **Resume** (the tailored version) so we have “this resume was generated for this job.”

---

## 4. “What position do I want?” (think big / MD)

**Idea:** A place to **reflect in markdown** and tie that to **market value** so the platform can suggest directions and feed the resume.

### Market value (you already have a model)

- **MarketNeed** — contexts where skills matter (e.g. “Change Enablement”, “Tech Adoption”).  
- **SkillTopicMarketValue** — links SkillTopics to MarketNeeds (relevanceLevel, useCases, rationale).  
- **WorkProfile** — jobRole, industry, **salaryRange**, seniority, responsibilitySummary.  
- **EcosystemPerson** — marketTier (and other attributes) for external context.

So: “What position do I want?” can be supported by:

1. **Reflection in MD** — Freeform note or structured “position preferences” (title, industry, level, salary band, location, non-negotiables). Stored as Memo or a small **PositionPreference** / “next role” doc.
2. **Market value layer** — Show which **MarketNeeds** and **SkillTopicMarketValues** align with that direction; suggest roles/industries where the user’s skills are relevant.  
3. **Salary / level** — WorkProfile.salaryRange and seniority; optional “target” range on the preference doc.  
4. **Personal branding doc** — PERSONAL_BRANDING_MARKET_VALUE_APPROACH.md: start from market needs → high-value skills → evidence (SkillItems) → content. Same idea for “what position do I want”: market needs + high-value skills → suggested roles and resume angles.

### Concrete pieces

- **Page:** e.g. `/career/next-role` or `/career/what-i-want`:  
  - MD editor (and/or structured fields) for “what position do I want.”  
  - Section “Where your skills have market value” fed by MarketNeed + SkillTopicMarketValue (and WorkProfile if present).  
- **Data:**  
  - Persist the “what I want” text (Memo or a dedicated model).  
  - No new market-value models needed; add APIs/UI to query and display as in PERSONAL_BRANDING_MARKET_VALUE_APPROACH.md (e.g. GET market-needs, GET skills by market value).

---

## 5. Career CRM — we need CareerContact (careerContactId) and its own UX pipeline

**We need a dedicated CareerContact model and “next job” UX pipeline — not just inside-company MyEcosystemContact.**

### Why not just EcosystemContact?

| | **MyEcosystemContact** (ecosystemContactId) | **CareerContact** (careerContactId) |
|--|---------------------------------------------|-------------------------------------|
| **Context** | Inside-company ecosystem: people in relation to *my org* (stance, relationshipType, X feed, etc.). | **Next job:** recruiters, hiring managers, referrals, “someone at Company X” — job-search / target-company context. |
| **Tied to** | EcosystemPerson; company/org view. | **Target job** (saved req), application, company I want to work at. |
| **Pipeline** | Ecosystem / comms / signals. | **Next job:** “Do I know anyone?” → list by job, add contact, track touchpoints. |

Ecosystem contact answers “who’s in my org’s orbit.” Career contact answers **“do I know anyone at this company / for this req?”** — different intent, different data, different UX. So: **CareerContact** (careerContactId) + **TargetJob** + a dedicated next-job pipeline (saved req → career contacts for that job → touchpoints).

### Overlap and trust

The **same person** can show up in both contexts: you work with them (ecosystem), and they might be at a company you’re targeting later (career). But if you work adjacent to someone and then lead with “you guys hiring?” it feels transactional — you lose trust. The relationship is different when it’s “person I collaborate with” vs “person I might ask for a referral.” Keeping **CareerContact** and its pipeline separate lets you be intentional: career contacts are for when you’re actually in job-search mode and the relationship can bear that ask. You can still link the same human to both (e.g. CareerContact.personId → EcosystemPerson) where it’s the same person; the *use* of the relationship — and how you nurture it — stays distinct so you don’t turn every colleague into a lead.

### What exists today

| Area | Model | Purpose |
|------|--------|---------|
| **workme-nextapp** | **MyEcosystemContact** | workMeId + personId (EcosystemPerson). Inside-company ecosystem; not job-search specific. |
| **workme-nextapp** | **CompanyCareer** | Internal career opportunity (job posting); no contact FK. |
| **IgniteBd-Next-combine** | **Contact** | Full CRM Contact (contactId). Business/CRM; optional future link for career contact if we unify. |

There is no **careerContactId** or CareerContact model today.

### What we need: CareerContact model + next-job UX

- **CareerContact** (id = careerContactId, workMeId, targetJobId?, companyName?, roleInProcess?: recruiter | hiring_manager | referral | other, name?, email?, notes?, lastContactAt?, nextAction?, …). Optional: personId (EcosystemPerson) or contactId (IgniteBd Contact) if we want to link to existing person/contact.
- **TargetJob** (saved req) — so “this career contact is for this job.”
- **UX pipeline for next job:** Save req → “Do I know anyone?” → add/list CareerContacts for this job → track touchpoints. Separate from ecosystem contact flows.

**Conclusion:** Ship **CareerContact** (careerContactId) and a **next-job UX pipeline**; do not try to reuse MyEcosystemContact as the career CRM. Optionally link CareerContact to EcosystemPerson or IgniteBd Contact later for “same person, different contexts.”

---

## 6. Summary table

| Piece | Exists? | Notes |
|-------|--------|--------|
| **MVP1: Target job (saved req)** | No | Req = frame. Save job title, company, JD, salary band, industry. |
| **MVP1: “Do I know anyone?”** | No | Career CRM: career contact + link to target job. Backs up “I want to apply.” |
| **Resume builder** | No | “View over” building blocks (contributions, skills, profile). |
| **Resume converter** | Partial | Job-fit + block selection/order + export; req frames what they want. |
| **“What I want” (industry, company type)** | No | North Star–adjacent; optional MD; feed from market value. |
| **Market value** | Yes | MarketNeed, SkillTopicMarketValue, WorkProfile.salaryRange. Reqs frame your story against this. |
| **CareerProgression** | No | Future: “your next job could be”; maybe reads PerformanceReview. |
| **Career CRM** | No | Need **CareerContact** (careerContactId) + **next-job UX pipeline** — not ecosystem contact (MVP1). |

---

## 7. Suggested implementation order

**MVP1 first:**  
1. **Target job (saved req)** — Lightweight model: workMeId, jobTitle?, companyName?, rawDescription?, salaryBand?, industry/role, parsedRequirements? (for framing). “There’s a req, I want to apply.”  
2. **Career CRM / “Do I know anyone?”** — **CareerContact** (careerContactId) + **next-job UX pipeline**. Link to target job; list career contacts by job; add recruiter, referral, hiring manager. Separate from ecosystem contact. This backs up the apply.

**Then (full circle):**  
3. **“What I want”** — Industry, company type, North Star; optional MD. Wire to market value (read-only) so reqs can frame against it.  
4. **Resume building blocks** — Resume as view over contributions, skills, profile.  
5. **Resume converter** — Req = frame; job-fit + block selection/order + export for that job.

**Future state (later):** CareerProgression model (maybe reads PerformanceReview), FamilySituation, MonetaryAim, open reqs (e.g. LinkedIn), AI synthesis.

This gives you: **MVP1 = req + “do I know anyone?”** → then build out so your life (goals, performance, resume) is a reflection of the market value needed, with reqs as the frame.

---

## 8. MVP1 implementation spec (architecture → UX)

Enough to start: schema first, then APIs, then UX. Auth = existing pattern: `verifyAuth` → `loadWorkMe` → `workMeId`.

### 8.1 Schema (Prisma)

Add two models. Place near other WorkMe-scoped career models (e.g. after WorkGoal / ContributionSummary in schema).

```prisma
// ============================================
// NEXT JOB — Target job (saved req) + Career contacts
// ============================================

model TargetJob {
  id              String   @id @default(cuid())
  workMeId        String   @db.Uuid

  jobTitle        String?
  companyName     String?
  rawDescription  String?  // Pasted JD text
  salaryBand      String?
  industryOrRole  String?  // e.g. "comms", "engineering"
  sourceUrl       String?  // Link to posting if any

  // Optional: parsed requirements for framing (job-fit can populate later)
  parsedRequirements Json?

  status          String?  @default("interested") // interested | applied | interviewing | offer | closed
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  workMe         WorkMe          @relation(fields: [workMeId], references: [id], onDelete: Cascade)
  careerContacts CareerContact[]

  @@index([workMeId])
  @@index([status])
}

model CareerContact {
  id              String    @id @default(cuid())
  workMeId        String    @db.Uuid
  targetJobId     String?   // Optional: link to a specific saved req

  name            String?
  email           String?
  companyName     String?   // Redundant with job but useful when contact not tied to one job
  roleInProcess   String?   // recruiter | hiring_manager | referral | other
  notes           String?
  lastContactAt   DateTime?
  nextAction      String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  workMe    WorkMe     @relation(fields: [workMeId], references: [id], onDelete: Cascade)
  targetJob TargetJob? @relation(fields: [targetJobId], references: [id], onDelete: SetNull)

  @@index([workMeId])
  @@index([targetJobId])
}
```

On **WorkMe** add:

```prisma
targetJobs     TargetJob[]
careerContacts CareerContact[]
```

Then run: `npx prisma migrate dev --name add_target_job_and_career_contact`

---

### 8.2 API routes

| Method | Route | Purpose |
|--------|--------|--------|
| GET | `/api/next-job/target-jobs` | List target jobs for workMeId (orderBy createdAt desc). |
| POST | `/api/next-job/target-jobs` | Create target job (body: jobTitle?, companyName?, rawDescription?, salaryBand?, industryOrRole?, sourceUrl?). |
| GET | `/api/next-job/target-jobs/[id]` | Get one target job with careerContacts. |
| PATCH | `/api/next-job/target-jobs/[id]` | Update target job (status, fields). |
| DELETE | `/api/next-job/target-jobs/[id]` | Delete target job (cascade or set careerContacts.targetJobId null). |
| GET | `/api/next-job/career-contacts` | List career contacts for workMeId; optional query `?targetJobId=...` to filter by job. |
| POST | `/api/next-job/career-contacts` | Create career contact (body: targetJobId?, name?, email?, companyName?, roleInProcess?, notes?, lastContactAt?, nextAction?). |
| GET | `/api/next-job/career-contacts/[id]` | Get one career contact. |
| PATCH | `/api/next-job/career-contacts/[id]` | Update career contact. |
| DELETE | `/api/next-job/career-contacts/[id]` | Delete career contact. |

All routes: resolve workMeId via `verifyAuth` + `loadWorkMe`; scope reads/writes to that workMeId.

---

### 8.3 UX — Pages and flow

**Routes**

- `/career/next-job` — **List target jobs** (saved reqs). CTA: “Add a job” → open form or inline (job title, company, paste JD, salary band, industry/role). Each row links to `/career/next-job/[id]`.
- `/career/next-job/new` — Optional dedicated “save a req” page (or use modal from list).
- `/career/next-job/[id]` — **Target job detail.** Show job fields; “Do I know anyone?” section: list CareerContacts for this job, add contact (name, email, role: recruiter/hiring manager/referral/other, notes, last contact, next action). Optional: link to Job Fit for this job (prefill from rawDescription).

**Nav**

- In career sidebar (same pattern as `app/career/page.tsx` and performance-plans): add one link under Career: **“Next job”** → `/career/next-job`. Use same `isActive('/career/next-job')` pattern. Add to career dashboard page sidebar and to other career subpages (job-fit, performance-plans, assessments, etc.) so “Next job” is visible everywhere in career.

**User flow (MVP1)**

1. User goes to **Career → Next job**. Sees list of target jobs (empty state: “Save a req to get started”).
2. **Add a job**: enter/paste title, company, JD, salary band, industry → save. New row appears.
3. Click a job → **detail page**. See “Do I know anyone?” — list of career contacts for this job. Add contact (name, email, role, notes, last contact, next action). No ecosystem mixing; this is career-only.
4. Optional: from detail, “See how I fit” → Job Fit with this job’s rawDescription pre-filled (req as frame).

---

### 8.4 Implementation checklist

**Phase 1 — Architecture**

- [ ] Add `TargetJob` and `CareerContact` to Prisma schema; add relations on WorkMe.
- [ ] Run migration.
- [ ] Implement `GET/POST /api/next-job/target-jobs`, `GET/PATCH/DELETE /api/next-job/target-jobs/[id]`.
- [ ] Implement `GET/POST /api/next-job/career-contacts`, `GET/PATCH/DELETE /api/next-job/career-contacts/[id]` (support `?targetJobId=` on GET).

**Phase 2 — UX**

- [ ] Add **Next job** to career sidebar nav (career dashboard + job-fit, performance-plans, assessments, appraisal-helper so one shared nav pattern).
- [ ] Page: `/career/next-job` — list target jobs, “Add job” CTA, link each to `/career/next-job/[id]`.
- [ ] Page: `/career/next-job/[id]` — job detail + “Do I know anyone?” list and add career contact.
- [ ] Optional: “Add job” as modal on list page or separate `/career/next-job/new`; detail page form to add/edit career contacts (and optional edit job fields).

After this you have: **req saved → “Do I know anyone?”** with career contacts per job and a clear next-job pipeline separate from ecosystem contact.
