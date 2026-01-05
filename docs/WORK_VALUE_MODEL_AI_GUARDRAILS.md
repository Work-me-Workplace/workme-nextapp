# Work Value Model - AI Guardrails

**Last Updated:** 2025-01-XX  
**Status:** ✅ **COMPLETE** - AI boundaries defined

---

## 🎯 PURPOSE

This document defines explicit boundaries for AI usage in the Work Value Model system. These guardrails ensure that AI enhances rather than replaces human judgment, and that the system remains evidence-based and non-gamified.

---

## ✅ AI IS ALLOWED TO

### 1. Infer SkillTopics from Evidence

**What:** Analyze SkillItems and suggest SkillTopics that might apply.

**Example:**
- User creates SkillItem: "Planned Holiday Open House event"
- AI suggests: "Event Coordination & Execution" SkillTopic

**Constraints:**
- ✅ Must be based on concrete evidence (SkillItems)
- ✅ User must confirm before SkillTopic is created
- ✅ Cannot suggest without evidence

**Implementation:**
```typescript
async function suggestSkillTopics(skillItemId: string): Promise<SkillTopicSuggestion[]> {
  // Analyze SkillItem content
  // Suggest relevant SkillTopics
  // Return suggestions (user must confirm)
}
```

### 2. Suggest Market Relevance

**What:** Connect SkillTopics to MarketNeeds and suggest relevance levels.

**Example:**
- SkillTopic: "Event Coordination & Execution"
- AI suggests: MarketNeed "Change Enablement" with relevance "high"

**Constraints:**
- ✅ Qualitative only (no numeric scores)
- ✅ Must explain WHY (rationale field)
- ✅ User can edit or reject suggestions

**Implementation:**
```typescript
async function suggestMarketRelevance(
  skillTopicId: string
): Promise<MarketRelevanceSuggestion[]> {
  // Analyze SkillTopic
  // Suggest relevant MarketNeeds
  // Return suggestions with rationale
}
```

### 3. Propose Blog Topics

**What:** Generate reflection-based blog topic options.

**Example:**
- Input: SkillTopic "Event Coordination", CompanyWork "Holiday Open House"
- Output: "Reflections on Using Moments That Matter to Maintain Trust During Organizational Change"

**Constraints:**
- ✅ Must be experiential (not tips/listicles)
- ✅ Must explain value, not create it
- ✅ Based on actual SkillTopics and evidence

**Implementation:**
```typescript
async function generateBlogTopics(input: BlogTopicInput): Promise<BlogTopic[]> {
  // Use SkillTopics, Market Value, Recent SkillItems
  // Generate 5 reflection-based topics
  // Return topics (user selects which to use)
}
```

### 4. Suggest Adjacent Pivots

**What:** Identify related SkillTopics that show mobility paths.

**Example:**
- From: "Digital Content Creation"
- To: "Narrative Development"
- Rationale: "Both require narrative skills"

**Constraints:**
- ✅ User must confirm before pivot is created
- ✅ Must explain rationale
- ✅ Cannot create circular pivots

**Implementation:**
```typescript
async function suggestPivots(skillTopicId: string): Promise<PivotSuggestion[]> {
  // Analyze SkillTopic
  // Find related SkillTopics
  // Suggest pivots with rationale
  // Return suggestions (user must confirm)
}
```

### 5. Generate Contribution Summaries

**What:** Create summaries of contributions for assessments.

**Example:**
- Input: SkillTopics, SkillItems, time period
- Output: "Led multiple high-impact events including Holiday Open House..."

**Constraints:**
- ✅ Post-work only (after work is done)
- ✅ Summarizes, doesn't evaluate
- ✅ User can edit before saving

**Implementation:**
```typescript
async function generateContributionSummary(
  workMeId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ContributionSummary> {
  // Analyze SkillTopics and SkillItems in period
  // Generate summary
  // Return summary (user can edit)
}
```

---

## ❌ AI IS NOT ALLOWED TO

### 1. Invent Skills Without Evidence

**What:** Create SkillTopics or SkillItems without concrete evidence.

**Example (FORBIDDEN):**
- AI creates SkillTopic "Leadership" without any SkillItems
- AI creates SkillItem "I'm good at X" without evidence

**Why:**
- System is evidence-based
- Skills must be proven, not assumed
- Prevents gamification

**Enforcement:**
- ✅ Database constraint: SkillTopic must have SkillItems
- ✅ UI prevents creating SkillTopic without SkillItems
- ✅ API validates evidence before creation

### 2. Score People

**What:** Assign numeric scores, rankings, or ratings to people.

**Example (FORBIDDEN):**
- "You're a 8/10 at Event Coordination"
- "You rank #5 in your team"
- "Your worth is $X"

**Why:**
- System is non-gamified
- No performance ratings
- Focus on capabilities, not scores

**Enforcement:**
- ✅ No numeric score fields in models
- ✅ Market value is qualitative only
- ✅ No ranking or comparison features

### 3. Determine Readiness or Worth

**What:** Evaluate whether someone is "ready" for something or determine their "worth."

**Example (FORBIDDEN):**
- "You're ready for a promotion"
- "You're worth $X salary"
- "You're qualified for X role"

**Why:**
- System supports growth, doesn't evaluate
- Readiness is contextual and subjective
- Worth is market-dependent, not system-determined

**Enforcement:**
- ✅ No "readiness" or "worth" fields
- ✅ No evaluation or assessment features
- ✅ Focus on capabilities, not judgments

### 4. Create Performance Ratings

**What:** Generate performance ratings, reviews, or evaluations.

**Example (FORBIDDEN):**
- "Your performance is: Excellent"
- "You exceeded expectations"
- "You need improvement in X"

**Why:**
- System is post-work, not pre-work
- No manager-required inputs
- Focus on contributions, not performance

**Enforcement:**
- ✅ No performance rating fields
- ✅ Assessments are summaries, not evaluations
- ✅ No comparison to standards or expectations

### 5. Make Hiring or Promotion Recommendations

**What:** Suggest hiring decisions, promotions, or role changes.

**Example (FORBIDDEN):**
- "You should hire this person"
- "This person is ready for promotion"
- "This person should move to X role"

**Why:**
- System is personal, not organizational
- Decisions are contextual and human
- Focus on capabilities, not recommendations

**Enforcement:**
- ✅ No hiring/promotion recommendation features
- ✅ System provides data, not decisions
- ✅ User owns their data and decisions

---

## 🔒 SYSTEM-LEVEL INVARIANTS

These invariants must always be true, enforced at the database and application level:

### 1. Evidence-Based Skills

**Invariant:** Every SkillTopic must have at least one SkillItem.

**Enforcement:**
- Database constraint (if possible)
- Application-level validation
- UI prevents creating SkillTopic without SkillItems

**Code:**
```typescript
async function createSkillTopic(data: CreateSkillTopicInput) {
  // Validate: Must have at least one SkillItem
  if (!data.skillItemIds || data.skillItemIds.length === 0) {
    throw new Error("SkillTopic must have at least one SkillItem");
  }
  // Create SkillTopic with SkillItems
}
```

### 2. No Numeric Scores

**Invariant:** No numeric scores anywhere in the system.

**Enforcement:**
- No numeric score fields in models
- Market value is qualitative only
- No ranking or comparison features

**Code:**
```typescript
// ✅ ALLOWED
relevanceLevel: "high" | "medium" | "emerging" | "declining"

// ❌ FORBIDDEN
score: number
rating: number
rank: number
```

### 3. User Confirmation Required

**Invariant:** AI suggestions must be confirmed by user.

**Enforcement:**
- All AI suggestions are marked as `suggestedByAI: true`
- User must explicitly confirm before creation
- User can edit or reject suggestions

**Code:**
```typescript
async function confirmAISuggestion(suggestionId: string) {
  const suggestion = await getSuggestion(suggestionId);
  if (!suggestion.suggestedByAI) {
    throw new Error("Only AI suggestions can be confirmed");
  }
  // Create entity with confirmedByUser: true
}
```

### 4. Post-Work Assessments Only

**Invariant:** Assessments are created AFTER work is done.

**Enforcement:**
- ContributionSummary requires periodStart and periodEnd
- Cannot create assessment for future periods
- Assessments summarize, don't evaluate

**Code:**
```typescript
async function createContributionSummary(data: CreateSummaryInput) {
  // Validate: periodEnd must be in the past
  if (data.periodEnd > new Date()) {
    throw new Error("Cannot create assessment for future periods");
  }
  // Create summary
}
```

### 5. Branding is Read-Only Consumer

**Invariant:** Branding translates SkillTopics, doesn't create them.

**Enforcement:**
- BrandNarrative requires existing SkillTopic
- Cannot create SkillTopic from BrandNarrative
- SkillTopics remain source of truth

**Code:**
```typescript
async function createBrandNarrative(data: CreateBrandNarrativeInput) {
  // Validate: SkillTopic must exist
  const skillTopic = await getSkillTopic(data.skillTopicId);
  if (!skillTopic) {
    throw new Error("SkillTopic must exist before creating brand narrative");
  }
  // Create narrative (read-only consumer)
}
```

---

## 📋 AI PROMPT TEMPLATES

### SkillTopic Inference

```
You are analyzing work evidence to suggest relevant professional capabilities.

Evidence:
{skillItemDescription}

Based on this evidence, suggest 1-3 SkillTopics that might apply.

Constraints:
- Must be based on concrete evidence
- Must be durable capabilities (not role-specific)
- Must be stable across organizations

Return: Array of SkillTopic suggestions with rationale.
```

### Market Relevance Suggestion

```
You are connecting professional capabilities to market needs.

SkillTopic: {skillTopicTitle}
Description: {skillTopicDescription}

Market Needs Available:
{marketNeeds}

Suggest which market needs this capability is relevant to, and why.

Constraints:
- Qualitative only (no scores)
- Must explain rationale
- Focus on where the skill matters

Return: Array of market relevance suggestions with rationale.
```

### Blog Topic Generation

```
You are generating reflection-based blog topics from professional capabilities.

SkillTopic: {skillTopicTitle}
Recent Work: {recentSkillItems}
Market Context: {marketContexts}

Generate 5 reflection-based blog topic options.

Constraints:
- Must be experiential (not tips/listicles)
- Must explain value, not create it
- Must be based on actual evidence

Return: Array of 5 blog topic options with descriptions.
```

### Adjacent Pivot Suggestion

```
You are identifying related professional capabilities.

From SkillTopic: {fromTopicTitle}
Description: {fromTopicDescription}

Available SkillTopics:
{availableTopics}

Suggest which SkillTopics are adjacent or related.

Constraints:
- Must explain rationale
- Must show mobility, not reinvention
- Must be based on capability similarity

Return: Array of pivot suggestions with rationale.
```

---

## 🚨 VIOLATION HANDLING

If AI violates these guardrails:

1. **Log the violation** (for monitoring and improvement)
2. **Reject the suggestion** (don't create the entity)
3. **Inform the user** (explain why suggestion was rejected)
4. **Provide alternative** (suggest manual creation if appropriate)

**Example:**
```typescript
try {
  const suggestion = await aiService.suggestSkillTopic(evidence);
  if (violatesGuardrails(suggestion)) {
    logViolation(suggestion, "AI_GUARDRAIL_VIOLATION");
    throw new Error("AI suggestion violates system guardrails. Please create manually.");
  }
  return suggestion;
} catch (error) {
  // Handle violation
}
```

---

## 📊 MONITORING

Track AI behavior to ensure compliance:

- **Violation Rate:** How often AI violates guardrails
- **Confirmation Rate:** How often users confirm AI suggestions
- **Rejection Rate:** How often users reject AI suggestions
- **Edit Rate:** How often users edit AI suggestions

**Metrics:**
```typescript
interface AIMetrics {
  violations: number;
  confirmations: number;
  rejections: number;
  edits: number;
  totalSuggestions: number;
}
```

---

**End of Document**

These guardrails ensure AI enhances rather than replaces human judgment, and that the system remains evidence-based and non-gamified. 🚀

