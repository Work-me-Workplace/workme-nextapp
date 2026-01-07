# Blog Topic Generator Service

**Date:** 2025-01-XX  
**Status:** ✅ **IMPLEMENTED**  
**Purpose:** Generate reflection-based blog topics from SkillTopics, Market Value, and Evidence

---

## 🎯 Overview

The Blog Topic Generator service ties together the personal branding system by generating blog topics that demonstrate market-valuable skills through real evidence.

**Key Principle:** Blogs explain value, they do not create it.

---

## 🔄 Two Approaches

### 1. Market-Value-First (Work Backwards)

**Flow:** Market Need → High-Value Skills → Evidence → Blog Topics

**Use Case:** "What should I write about based on what the market values?"

**Input:**
```typescript
{
  workMeId: string;
  marketNeedId?: string;        // Filter by market need
  relevanceLevel?: 'high' | 'medium' | 'emerging';
  skillTopicIds?: string[];     // Optional: specific skills
  limit?: number;               // Max skills to consider (default: 10)
}
```

**Example:**
```typescript
const topics = await generateBlogTopics({
  workMeId: "workme-123",
  marketNeedId: "change-enablement",
  relevanceLevel: "high",
  limit: 5,
});
```

### 2. Skill-First (Traditional)

**Flow:** SkillTopic → Market Value → Evidence → Blog Topics

**Use Case:** "I have this skill, what should I write about it?"

**Input:**
```typescript
{
  workMeId: string;
  skillTopicId: string;
  companyWorkId?: string;       // Optional: specific company work
  recentSkillItemIds?: string[]; // Optional: specific evidence
  marketNeedIds?: string[];      // Optional: filter by market needs
}
```

**Example:**
```typescript
const topics = await generateBlogTopics({
  workMeId: "workme-123",
  skillTopicId: "event-coordination",
  companyWorkId: "holiday-open-house",
});
```

---

## 📊 Input Models

### SkillTopic
- **Purpose:** Durable capability (e.g. "Event Coordination", "Narrative Development")
- **Required:** Must have at least one SkillItem (no naked skills)
- **Used For:** Primary semantic unit for blog generation

### MarketValue (SkillTopicMarketValue)
- **Purpose:** Links SkillTopics to MarketNeeds with relevance
- **Fields:**
  - `relevanceLevel`: "high", "medium", "emerging", "declining"
  - `useCases`: Array of specific use cases
  - `rationale`: Why the skill matters in this market

### SkillItem
- **Purpose:** Evidence of capability (emails, events, artifacts)
- **Required:** Must have concrete evidence
- **Used For:** Provides real examples for blog topics

### CompanyWork
- **Purpose:** Company-owned work context
- **Optional:** SkillItems can reference CompanyWork
- **Used For:** Provides context for blog topics

---

## 📤 Output Format

### BlogTopic

```typescript
interface BlogTopic {
  title: string;                    // Compelling blog title (max 100 chars)
  description: string;              // What the blog would cover
  rationale: string;                // Why this topic is valuable
  suggestedSkillTopicIds: string[]; // Related SkillTopic IDs
  marketContext?: string;           // Market need name
  marketNeedId?: string;            // Market need ID
  evidenceCount?: number;           // Number of SkillItems
  suggestedAngle?: string;          // How to frame the blog
  companyWorkId?: string;           // Related CompanyWork (if any)
}
```

**Example Output:**
```json
{
  "title": "Reflections on Using Moments That Matter to Maintain Trust During Organizational Change",
  "description": "A personal reflection on how event coordination skills were applied during a major organizational change initiative, using the Holiday Open House as a case study.",
  "rationale": "Demonstrates high-value skill (Event Coordination) in a critical market context (Change Enablement) with concrete evidence",
  "suggestedSkillTopicIds": ["skill-topic-id-123"],
  "marketContext": "Change Enablement",
  "marketNeedId": "market-need-id-456",
  "evidenceCount": 5,
  "suggestedAngle": "Reflection on using event coordination to maintain trust during organizational change",
  "companyWorkId": "company-work-id-789"
}
```

---

## 🚫 Constraints

### ❌ What NOT to Generate

1. **No Tips/Listicles**
   - ❌ "5 Tips for Event Coordination"
   - ❌ "10 Ways to Improve Your Narrative Skills"
   - ✅ "Reflections on Coordinating a Major Company Event"

2. **No How-To Guides**
   - ❌ "How to Coordinate Events"
   - ❌ "How to Develop Narratives"
   - ✅ "Lessons Learned from Leading Organizational Change Events"

3. **No Generic Advice**
   - ❌ "Best Practices for Communication"
   - ❌ "Why Event Coordination Matters"
   - ✅ "How I Used Event Coordination to Maintain Trust During Our Company's Restructure"

4. **No Value Creation Claims**
   - ❌ "How to Create Value Through Events"
   - ❌ "Building Your Narrative Skills"
   - ✅ "Demonstrating Value: Reflections on a Year of Event Coordination"

### ✅ What TO Generate

1. **Experiential Content**
   - Personal reflections
   - Lessons learned
   - Insights gained
   - Real examples from work

2. **Evidence-Based**
   - Uses actual SkillItems
   - References real CompanyWork
   - Grounded in concrete evidence

3. **Market-Contextual**
   - Connects skills to market needs
   - Shows why skills matter
   - Demonstrates value in context

---

## 🔧 Service Functions

### `generateBlogTopics(input)`

Main entry point that supports both approaches.

**Auto-detects approach based on input:**
- If `skillTopicId` present → Skill-first
- Otherwise → Market-value-first

### `generateBlogTopicsFromMarketValue(input)`

Work backwards from market value.

**Process:**
1. Query skills with market value (filtered by market need/relevance)
2. For each skill, generate blog topics
3. Sort by market value and evidence strength
4. Return top 5 unique topics

### `generateBlogTopicsForSkill(input)`

Generate topics for a specific skill.

**Process:**
1. Fetch SkillTopic with all related data
2. Filter SkillItems and MarketValues (if specified)
3. Build context for AI generation
4. Generate topics using AI
5. Return 5 topics

### `generateTopicsWithAI(context)`

Uses OpenAI GPT-4o to generate blog topics.

**Prompt Strategy:**
- Emphasizes experiential content
- Requires evidence-based topics
- Connects skills to market contexts
- Explicitly prohibits tips/listicles

---

## 🛣️ API Route

### POST `/api/myskills/generate-blog-topics`

**Request Body (Skill-First):**
```json
{
  "skillTopicId": "skill-topic-id",
  "companyWorkId": "company-work-id",
  "recentSkillItemIds": ["item-1", "item-2"],
  "marketNeedIds": ["market-need-1"]
}
```

**Request Body (Market-Value-First):**
```json
{
  "marketNeedId": "market-need-id",
  "relevanceLevel": "high",
  "skillTopicIds": ["skill-1", "skill-2"],
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "topics": [
    {
      "title": "...",
      "description": "...",
      "rationale": "...",
      "suggestedSkillTopicIds": ["..."],
      "marketContext": "...",
      "marketNeedId": "...",
      "evidenceCount": 5,
      "suggestedAngle": "...",
      "companyWorkId": "..."
    }
  ],
  "count": 5
}
```

---

## 📝 Example Usage

### Example 1: Market-Value-First

```typescript
// "What should I write about based on what the market values?"

const topics = await generateBlogTopics({
  workMeId: "workme-123",
  marketNeedId: "change-enablement",
  relevanceLevel: "high",
  limit: 5,
});

// Returns 5 blog topics for high-value skills in Change Enablement
```

### Example 2: Skill-First with Company Work

```typescript
// "I coordinated the Holiday Open House, what should I write about it?"

const topics = await generateBlogTopics({
  workMeId: "workme-123",
  skillTopicId: "event-coordination",
  companyWorkId: "holiday-open-house",
});

// Returns 5 blog topics about Event Coordination using Holiday Open House as evidence
```

### Example 3: Skill-First with Specific Evidence

```typescript
// "I want to write about these specific moments"

const topics = await generateBlogTopics({
  workMeId: "workme-123",
  skillTopicId: "narrative-development",
  recentSkillItemIds: ["item-1", "item-2", "item-3"],
  marketNeedIds: ["change-enablement"],
});

// Returns 5 blog topics about Narrative Development using specific evidence
```

---

## 🎨 AI Prompt Design

The service uses a carefully crafted prompt that:

1. **Provides Full Context:**
   - Skill details (title, description, category, dates)
   - Recent evidence (SkillItems with descriptions)
   - Market contexts (needs, relevance, use cases, rationale)
   - Adjacent skills (pivots)
   - Company work (if applicable)

2. **Enforces Constraints:**
   - Explicitly prohibits tips/listicles
   - Requires experiential content
   - Demands evidence-based topics
   - Emphasizes value demonstration (not creation)

3. **Structures Output:**
   - JSON format with exact schema
   - 5 topics maximum
   - All required fields specified

---

## 🔍 Data Flow

### Market-Value-First Flow

```
Market Need (Change Enablement)
  ↓
Query Skills with High Market Value
  ↓
For each Skill:
  - Get Recent SkillItems (evidence)
  - Get Market Values (context)
  - Get CompanyWork references
  ↓
Build Context
  ↓
Generate Blog Topics (AI)
  ↓
Sort by Market Value + Evidence
  ↓
Return Top 5 Topics
```

### Skill-First Flow

```
SkillTopic (Event Coordination)
  ↓
Fetch Related Data:
  - SkillItems (evidence)
  - Market Values (context)
  - CompanyWork (if specified)
  - Adjacent Skills (pivots)
  ↓
Build Context
  ↓
Generate Blog Topics (AI)
  ↓
Return 5 Topics
```

---

## ✅ Success Criteria

1. **Generates 5 Topics:** Always returns exactly 5 topics (or fewer if insufficient data)

2. **Evidence-Based:** All topics reference actual SkillItems

3. **Market-Contextual:** Topics connect skills to market needs

4. **Experiential:** Topics are reflections, not tips/listicles

5. **Value-Demonstrating:** Topics explain existing value, don't claim to create it

---

## 🧪 Testing

### Test Cases

1. **Market-Value-First:**
   - [ ] Generate topics with market need filter
   - [ ] Generate topics with relevance level filter
   - [ ] Generate topics with specific skill filter
   - [ ] Handle no skills found

2. **Skill-First:**
   - [ ] Generate topics for skill with evidence
   - [ ] Generate topics with company work
   - [ ] Generate topics with specific SkillItems
   - [ ] Handle skill with no market value

3. **AI Generation:**
   - [ ] Topics are experiential (not tips)
   - [ ] Topics reference evidence
   - [ ] Topics connect to market contexts
   - [ ] Topics are unique (no duplicates)

---

## 📚 Related Documentation

- [Work Value Model Architecture](./WORK_VALUE_MODEL_ARCHITECTURE.md)
- [Personal Branding Market Value Approach](./PERSONAL_BRANDING_MARKET_VALUE_APPROACH.md)
- [Skill Model Status](./SKILL_MODEL_STATUS.md)

---

**Status:** ✅ Service implemented and ready for integration

