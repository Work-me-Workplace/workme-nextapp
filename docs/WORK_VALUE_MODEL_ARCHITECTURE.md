# Work Value Model Architecture

**Last Updated:** 2025-01-XX  
**Status:** ✅ **COMPLETE** - Core models implemented

---

## 🎯 EXECUTIVE SUMMARY

The Work Value Model is a system for modeling durable professional value centered around **SkillTopics** as the North Star. This system supports:

- ✅ Growth tracking
- ✅ Portability outside the organization
- ✅ Annual assessments
- ✅ Personal branding
- ✅ AI-generated reflections and blogs

**Core Principle:** SkillTopics are the North Star. Everything else is a consumer.

---

## 🔒 SYSTEM RULE (PIN THIS)

**SkillTopics are the North Star. Everything else is a consumer.**

This means:
- SkillTopics define what you can do (durable capabilities)
- SkillItems provide evidence (concrete executions)
- Market Value Intelligence describes where skills matter (contextual)
- Branding translates skills (read-only consumer)
- Assessments summarize skills (post-work reflection)

---

## 1️⃣ CORE DOMAIN MODELS (FOUNDATION)

### SkillTopic Model

**Purpose:** PRIMARY semantic unit (10,000 ft altitude)

**Represents:** A durable capability (e.g. "Narrative Development", "Trust Preservation")

**Characteristics:**
- Stable across roles, orgs, and time
- Used for growth reflection and portability assessment
- Never changes based on market conditions

**Key Fields:**
- `title`: The capability name
- `description`: Human-readable explanation
- `category`: Optional categorization
- `firstDemonstratedAt`: When first evidence appeared
- `lastDemonstratedAt`: Most recent evidence

**Invariants:**
- ✅ Must have at least one SkillItem (no naked skills)
- ✅ Cannot be deleted if SkillItems exist
- ✅ Stable identity (doesn't change with market trends)

### SkillItem Model

**Purpose:** Evidence-level (1,000 ft altitude)

**Represents:** Concrete executions (emails, events, artifacts)

**Characteristics:**
- Always attached to exactly one SkillTopic
- Provides proof of capability
- Can reference CompanyWork (doesn't claim ownership)

**Key Fields:**
- `title`: Brief description of evidence
- `description`: Detailed description
- `evidenceType`: "email", "event", "artifact", etc.
- `occurredAt`: When this evidence happened
- `companyWorkId`: Optional reference to company work

**Invariants:**
- ✅ Must belong to exactly one SkillTopic
- ✅ Cannot exist without a SkillTopic
- ✅ References CompanyWork but doesn't own it

---

## 2️⃣ MARKET VALUE INTELLIGENCE LAYER (BELAYER)

### MarketNeed Model

**Purpose:** Market contexts where skills matter

**Examples:** "Change Enablement", "Tech Adoption", "Crisis Communication"

**Characteristics:**
- Contextual and volatile
- Does NOT redefine user identity
- Answers: "Where does this SkillTopic currently matter?"

### SkillTopicMarketValue Model

**Purpose:** Join model connecting SkillTopics to MarketNeeds

**Key Fields:**
- `relevanceLevel`: Qualitative only ("high", "medium", "emerging", "declining")
- `useCases`: Array of specific use cases
- `rationale`: WHY the skill matters in that market

**Explicitly Prohibited:**
- ❌ Rankings of people
- ❌ Absolute worth scores
- ❌ Performance ratings

**Invariants:**
- ✅ Qualitative only (no numeric scores)
- ✅ Market value does NOT change SkillTopic identity
- ✅ Can be updated as market conditions change

---

## 3️⃣ ADJACENT PIVOTS (MOBILITY WITHOUT REINVENTION)

### SkillTopicPivot Model

**Purpose:** Connect SkillTopics to show mobility paths

**Characteristics:**
- Explains mobility, not reinvention
- Suggestible by AI, confirmed by user
- Shows adjacent capabilities

**Key Fields:**
- `pivotType`: "adjacent", "cross-domain", "up-level"
- `rationale`: Why this pivot makes sense
- `confidence`: "high", "medium", "low"
- `confirmedByUser`: User must confirm AI suggestions
- `suggestedByAI`: Whether AI suggested this pivot

**Examples:**
- Digital Content Creation → Narrative Development
- Event Coordination → Trust Preservation

**Invariants:**
- ✅ User must confirm AI suggestions
- ✅ Pivots are bidirectional (can go both ways)
- ✅ No circular pivots (enforced by unique constraint)

---

## 4️⃣ COMPANY WORK ↔ PERSONAL WORK BRIDGE

### CompanyWork Model

**Purpose:** Generic container for company-owned work

**Characteristics:**
- Company work exists independently
- Polymorphic reference to specific CompanyX models
- Individuals contribute to CompanyWork
- SkillItems can reference CompanyWork as evidence

**Key Fields:**
- `title`: Work title
- `description`: Work description
- `workType`: "event", "campaign", "training", etc.
- Polymorphic FKs to CompanyX models

**How It Works:**
- CompanyWork references CompanyEvent, CompanyCampaign, etc.
- SkillItems reference CompanyWork (doesn't claim ownership)
- MyContribution extracts personal value

**Invariants:**
- ✅ CompanyWork is owned by Company
- ✅ SkillItems reference but don't own CompanyWork
- ✅ Personal value extracted without claiming ownership

### MyContribution Model

**Purpose:** User-specific view of contribution to CompanyWork

**Characteristics:**
- Extracts personal value without claiming ownership
- Describes what the user specifically contributed
- Time-bounded (startedAt, completedAt)

**Key Fields:**
- `role`: "Planning", "Messaging", "Execution"
- `description`: What user specifically contributed
- `contributionType`: "lead", "support", "collaboration"

**Invariants:**
- ✅ One contribution per user per CompanyWork (unique constraint)
- ✅ Does NOT claim ownership of CompanyWork
- ✅ Personal value extraction only

---

## 5️⃣ NATURAL ASSESSMENTS (POST-WORK, NOT PRE-WORK)

### ContributionSummary Model

**Purpose:** Lightweight assessment that emerges AFTER work is done

**Characteristics:**
- No pre-scoring
- No performance ratings
- No manager-required inputs
- Summarizes contributions
- Attaches to SkillTopics
- Reusable for annual reviews

**Key Fields:**
- `periodStart`: Start of assessment period
- `periodEnd`: End of assessment period
- `periodType`: "annual", "project", "quarterly"
- `summary`: AI-generated or user-written summary
- `skillTopicIds`: Array of SkillTopic IDs demonstrated

**Time-Bounded Rehydration:**
- Annual: Full year summary
- Project: Project-specific summary
- Quarterly: Quarterly summary

**Invariants:**
- ✅ Created AFTER work is done (not pre-work)
- ✅ No scoring or ratings
- ✅ Summarizes, doesn't evaluate

---

## 6️⃣ PERSONAL BRANDING MODULE (READ-ONLY CONSUMER)

### BrandNarrative Model

**Purpose:** Translate SkillTopics to brand narratives

**Characteristics:**
- Does NOT invent new skills
- Only translates existing SkillTopics
- Supports different surfaces (LinkedIn, bio, about section)

**Key Fields:**
- `narrative`: How SkillTopic translates to brand narrative
- `surface`: "linkedin", "bio", "about", "portfolio"
- `skillTopicId`: The SkillTopic being translated

**Invariants:**
- ✅ SkillTopics remain source of truth
- ✅ Branding is optional and non-destructive
- ✅ Cannot create skills, only translate them

### BrandPositioning Model

**Purpose:** Overall brand positioning statement

**Characteristics:**
- Derived from SkillTopics (read-only consumer)
- Supports different surfaces
- Overall positioning, not per-skill

**Key Fields:**
- `positioning`: Overall brand positioning statement
- `surface`: "linkedin", "bio", "about"
- `primarySkillTopicIds`: Array of SkillTopic IDs that inform positioning

**Invariants:**
- ✅ Derived from SkillTopics
- ✅ Read-only consumer (doesn't modify SkillTopics)
- ✅ Optional and non-destructive

---

## 7️⃣ BLOG / CONTENT GENERATION (VALUE → REFLECTION)

### Blog Topic Generator Service

**Purpose:** Generate reflection-based blog topics from SkillTopics

**Inputs:**
- SkillTopics
- Market Value Intelligence
- Recent SkillItems
- CompanyWork references

**Outputs:**
- 5 reflection-based blog topic options

**Constraints:**
- ❌ No "tips" or listicles
- ✅ Content must be experiential
- ✅ Blogs explain value, they do not create it

**Example:**
- **Input:**
  - SkillTopic: "Event Coordination & Execution"
  - CompanyWork: "Holiday Open House"
  
- **Output Topic:**
  "Reflections on Using Moments That Matter to Maintain Trust During Organizational Change"

**Implementation Note:**
This is a service (not a model). See `lib/services/blogTopicGenerator.ts` for implementation.

---

## 8️⃣ AI INFERENCE BOUNDARIES (IMPORTANT)

### AI is ALLOWED to:

✅ **Infer SkillTopics from evidence**
- Analyze SkillItems and suggest SkillTopics
- User must confirm suggestions

✅ **Suggest market relevance**
- Connect SkillTopics to MarketNeeds
- Suggest relevance levels and use cases

✅ **Propose blog topics**
- Generate reflection-based blog topics
- Based on SkillTopics and Market Value Intelligence

✅ **Suggest adjacent pivots**
- Identify related SkillTopics
- User must confirm suggestions

### AI is NOT ALLOWED to:

❌ **Invent skills without evidence**
- Cannot create SkillTopics without SkillItems
- Cannot create SkillItems without evidence

❌ **Score people**
- No numeric scores
- No rankings
- No performance ratings

❌ **Determine readiness or worth**
- Cannot say "you're ready for X"
- Cannot say "you're worth Y"
- Cannot evaluate performance

### System-Level Invariants:

1. **SkillTopics require evidence**
   - Cannot create SkillTopic without at least one SkillItem
   - SkillItems must have concrete evidence

2. **No scoring or ranking**
   - Market value is qualitative only
   - No numeric scores anywhere
   - No people rankings

3. **User confirmation required**
   - AI suggestions must be confirmed by user
   - User owns their SkillTopics

4. **Evidence-based only**
   - Everything must trace back to evidence
   - No hypothetical skills

---

## 9️⃣ END-TO-END FLOW (CONCRETE EXAMPLE)

### Scenario: Holiday Open House

**CompanyWork:** Holiday Open House (CompanyEvent)

**User Contribution:**
- Planning
- Messaging
- Execution

### Step 1: Create CompanyWork

```typescript
const companyWork = await prisma.companyWork.create({
  data: {
    companyId: "company-123",
    companyEventId: "event-456",
    title: "Holiday Open House",
    workType: "event"
  }
});
```

### Step 2: Create MyContribution

```typescript
const contribution = await prisma.myContribution.create({
  data: {
    workMeId: "workme-789",
    companyWorkId: companyWork.id,
    role: "Lead Planner",
    description: "Planned event logistics, messaging, and execution",
    contributionType: "lead",
    startedAt: new Date("2025-11-01"),
    completedAt: new Date("2025-12-15")
  }
});
```

### Step 3: Create SkillItems

```typescript
// SkillItem 1: Event Planning
const skillItem1 = await prisma.skillItem.create({
  data: {
    skillTopicId: "topic-event-coordination",
    title: "Holiday Open House Planning",
    description: "Coordinated logistics, vendor management, and timeline",
    evidenceType: "event",
    occurredAt: new Date("2025-12-15"),
    companyWorkId: companyWork.id
  }
});

// SkillItem 2: Messaging
const skillItem2 = await prisma.skillItem.create({
  data: {
    skillTopicId: "topic-narrative-development",
    title: "Holiday Open House Messaging",
    description: "Developed messaging strategy and communications",
    evidenceType: "email",
    occurredAt: new Date("2025-12-10"),
    companyWorkId: companyWork.id
  }
});
```

### Step 4: SkillTopics Strengthened

```typescript
// SkillTopic: Event Coordination & Execution
// - firstDemonstratedAt: (first SkillItem date)
// - lastDemonstratedAt: (most recent SkillItem date)
// - Automatically updated when SkillItems are added
```

### Step 5: Market Relevance Surfaced

```typescript
const marketValue = await prisma.skillTopicMarketValue.create({
  data: {
    skillTopicId: "topic-event-coordination",
    marketNeedId: "need-change-enablement",
    relevanceLevel: "high",
    useCases: [
      "Organizational change events",
      "Trust-building moments",
      "Workforce engagement"
    ],
    rationale: "Event coordination is critical for maintaining trust during organizational change"
  }
});
```

### Step 6: Blog Topics Suggested

```typescript
// Service call (not a model)
const blogTopics = await generateBlogTopics({
  skillTopicId: "topic-event-coordination",
  companyWorkId: companyWork.id,
  recentSkillItems: [skillItem1, skillItem2]
});

// Output:
// [
//   "Reflections on Using Moments That Matter to Maintain Trust During Organizational Change",
//   "How Event Coordination Builds Organizational Resilience",
//   "The Art of Creating Meaningful Workforce Experiences",
//   ...
// ]
```

### Step 7: Annual Assessment Rehydrated

```typescript
const assessment = await prisma.contributionSummary.create({
  data: {
    workMeId: "workme-789",
    periodStart: new Date("2025-01-01"),
    periodEnd: new Date("2025-12-31"),
    periodType: "annual",
    title: "2025 Annual Contribution Summary",
    summary: "Led multiple high-impact events including Holiday Open House...",
    skillTopicIds: [
      "topic-event-coordination",
      "topic-narrative-development",
      "topic-trust-preservation"
    ],
    companyWorkId: companyWork.id
  }
});
```

### Data Flow Summary:

```
CompanyWork (Holiday Open House)
  ↓
MyContribution (user's role: Planning, Messaging, Execution)
  ↓
SkillItems (evidence: event planning, messaging)
  ↓
SkillTopics (Event Coordination, Narrative Development)
  ↓
Market Value Intelligence (Change Enablement, Trust Building)
  ↓
Blog Topics (reflection-based topics)
  ↓
ContributionSummary (annual assessment)
```

---

## 📊 MODEL RELATIONSHIPS DIAGRAM

```
WorkMe
├── SkillTopic[]
│   ├── SkillItem[]
│   │   └── CompanyWork (reference, not ownership)
│   ├── SkillTopicMarketValue[]
│   │   └── MarketNeed
│   ├── SkillTopicPivot[] (from/to)
│   ├── ContributionSummary[]
│   └── BrandNarrative[]
├── MyContribution[]
│   └── CompanyWork
├── ContributionSummary[]
│   └── CompanyWork
└── BrandPositioning[]

CompanyWork
├── CompanyEvent (polymorphic)
├── CompanyCampaign (polymorphic)
├── CompanyTraining (polymorphic)
├── MyContribution[]
└── SkillItem[] (references)
```

---

## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: Core Models ✅
- [x] SkillTopic model
- [x] SkillItem model
- [x] Database schema updated

### Phase 2: Market Intelligence
- [ ] MarketNeed model (seeded with common needs)
- [ ] SkillTopicMarketValue model
- [ ] UI for managing market relevance

### Phase 3: Pivots
- [ ] SkillTopicPivot model
- [ ] AI service for suggesting pivots
- [ ] UI for confirming pivots

### Phase 4: Company Work Bridge
- [ ] CompanyWork model
- [ ] MyContribution model
- [ ] Service to link CompanyX to CompanyWork

### Phase 5: Assessments
- [ ] ContributionSummary model
- [ ] Service to generate summaries
- [ ] UI for viewing assessments

### Phase 6: Branding
- [ ] BrandNarrative model
- [ ] BrandPositioning model
- [ ] Service to generate narratives

### Phase 7: Blog Generation
- [ ] Blog topic generator service
- [ ] Integration with SkillTopics and Market Value

### Phase 8: AI Services
- [ ] SkillTopic inference from evidence
- [ ] Market relevance suggestions
- [ ] Blog topic generation
- [ ] Pivot suggestions

---

## 📝 NOTES ON INVARIANTS

### What Must Always Be True:

1. **No Naked Skills**
   - Every SkillTopic must have at least one SkillItem
   - Cannot create SkillTopic without evidence

2. **Evidence-Based Only**
   - SkillItems must have concrete evidence
   - Cannot create hypothetical skills

3. **No Scoring**
   - Market value is qualitative only
   - No numeric scores anywhere
   - No people rankings

4. **User Ownership**
   - User owns their SkillTopics
   - AI suggests, user confirms
   - User can edit/delete their skills

5. **Company Work Independence**
   - CompanyWork exists independently
   - SkillItems reference but don't own
   - Personal value extracted without claiming ownership

6. **Post-Work Assessments**
   - Assessments created AFTER work
   - No pre-scoring
   - No performance ratings

7. **Branding is Read-Only**
   - Branding translates, doesn't create
   - SkillTopics remain source of truth
   - Branding is optional and non-destructive

---

**End of Document**

This architecture ensures SkillTopics remain the North Star while supporting all downstream consumers. 🚀

