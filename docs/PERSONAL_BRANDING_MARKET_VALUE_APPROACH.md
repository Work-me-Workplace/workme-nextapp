# Personal Branding: Market Value → Blog Generation Approach

**Date:** 2025-01-XX  
**Status:** 🔍 **INVESTIGATION & DESIGN**  
**Approach:** Work backwards from market value to blog generation

---

## 🎯 Core Concept

**"Work Backwards" Approach:**
1. **Start with Market Value** - What skills have high market value?
2. **Identify Market Needs** - Where do these skills matter?
3. **Generate Blog Topics** - Write blogs that demonstrate these valuable skills in market-relevant contexts

This flips the traditional approach from "I have this skill, let me write about it" to "The market values this skill, let me demonstrate it through content."

---

## 📊 Current State Analysis

### ✅ What Exists

1. **Database Models (Complete)**
   - `SkillTopic` - Durable capabilities
   - `SkillItem` - Evidence of capabilities
   - `MarketNeed` - Market contexts where skills matter
   - `SkillTopicMarketValue` - Join model (skill → market relevance)
   - `BrandNarrative` - SkillTopic → brand narrative translation
   - `BrandPositioning` - Overall brand positioning

2. **Architecture Documentation**
   - `WORK_VALUE_MODEL_ARCHITECTURE.md` - Full system design
   - `WORK_VALUE_MODEL_AI_GUARDRAILS.md` - AI usage guidelines
   - `SKILL_MODEL_STATUS.md` - Implementation status

3. **Service Code (Commented Out)**
   - `lib/services/blogTopicGenerator.ts` - Blog topic generation service
   - Currently throws error - not integrated

4. **Existing Blog System (Different Purpose)**
   - `POST /api/workme/blog/ai` - Generates blogs for BusinessPoint Law
   - Uses persona/idea mode
   - Not connected to skills/market value

### ❌ What's Missing

1. **API Routes**
   - No endpoints to query skills by market value
   - No endpoints to get market needs
   - No endpoints to generate blog topics from market value
   - No endpoints for BrandNarrative/BrandPositioning

2. **Service Implementation**
   - Blog topic generator is commented out
   - No service to query "skills with high market value"
   - No service to generate blogs starting from market value

3. **UI Components**
   - No interface to view skills by market value
   - No interface to see market needs
   - No interface to generate blog topics from market value
   - No personal branding dashboard

---

## 🔄 Proposed Data Flow

### Traditional Flow (Current Design)
```
SkillTopic → Market Value → Blog Topics
```

### "Work Backwards" Flow (Proposed)
```
Market Need → High-Value Skills → Evidence (SkillItems) → Blog Topics
```

**Key Difference:** Start with market needs, identify which skills are valuable in those markets, then generate blog topics that demonstrate those skills.

---

## 🏗️ Implementation Plan

### Phase 1: Market Value Intelligence Queries

**Goal:** Enable querying skills by market value

**New API Routes:**
1. `GET /api/myskills/market-value` - Get skills sorted by market value
   - Query params: `marketNeedId?`, `relevanceLevel?`, `limit?`
   - Returns: Skills with market value context

2. `GET /api/market-needs` - List all market needs
   - Returns: Available market contexts

3. `GET /api/myskills/:skillTopicId/market-value` - Get market value for a specific skill
   - Returns: All market needs where this skill is relevant

**Service Functions:**
```typescript
// lib/services/marketValueService.ts
export async function getSkillsByMarketValue(
  workMeId: string,
  options?: {
    marketNeedId?: string;
    relevanceLevel?: 'high' | 'medium' | 'emerging';
    limit?: number;
  }
): Promise<SkillTopicWithMarketValue[]>

export async function getMarketNeeds(): Promise<MarketNeed[]>

export async function getSkillMarketValue(
  skillTopicId: string
): Promise<SkillTopicMarketValue[]>
```

### Phase 2: Market-Value-First Blog Generation

**Goal:** Generate blog topics starting from market value

**New API Route:**
1. `POST /api/myskills/generate-blog-topics` - Generate blog topics from market value
   - Body: `{ marketNeedId?, relevanceLevel?, skillTopicIds? }`
   - Returns: Array of blog topic suggestions

**Service Function:**
```typescript
// lib/services/marketValueBlogGenerator.ts
export async function generateBlogTopicsFromMarketValue(
  workMeId: string,
  options: {
    marketNeedId?: string;
    relevanceLevel?: 'high' | 'medium' | 'emerging';
    skillTopicIds?: string[];
  }
): Promise<BlogTopic[]>
```

**Generation Logic:**
1. Query skills with high market value (filtered by market need if provided)
2. For each high-value skill:
   - Get recent SkillItems (evidence)
   - Get market context (why it matters)
   - Generate blog topic that demonstrates the skill in market context
3. Return top 5-10 blog topic suggestions

### Phase 3: Blog Content Generation

**Goal:** Generate full blog content from market-value-based topics

**Integration:**
- Extend existing `POST /api/workme/blog/ai` OR
- Create new `POST /api/myskills/generate-blog-content`

**New Mode:**
- Add `mode: 'market-value'` to blog generation
- Input: `{ blogTopicId, skillTopicIds[], marketNeedId }`
- Generate blog that demonstrates skills in market context

### Phase 4: Personal Branding Dashboard

**Goal:** UI to view and manage market-value-based personal branding

**New Pages:**
1. `/mycareer/market-value` - View skills by market value
   - Shows market needs
   - Shows skills with relevance levels
   - Filter by market need or relevance level

2. `/mycareer/blog-topics` - Generate blog topics from market value
   - Select market need
   - See suggested blog topics
   - Generate full blog content

3. `/mycareer/branding` - Personal branding management
   - View BrandNarratives
   - View BrandPositioning
   - Generate from market value

---

## 🔧 Technical Implementation Details

### Service: Market Value Blog Generator

```typescript
// lib/services/marketValueBlogGenerator.ts

interface MarketValueBlogInput {
  workMeId: string;
  marketNeedId?: string;
  relevanceLevel?: 'high' | 'medium' | 'emerging';
  skillTopicIds?: string[];
  limit?: number;
}

interface MarketValueBlogTopic {
  title: string;
  description: string;
  rationale: string;
  skillTopicIds: string[];
  marketNeedId: string;
  marketContext: string;
  evidenceCount: number;
  suggestedAngle: string; // How to frame the blog
}

export async function generateBlogTopicsFromMarketValue(
  input: MarketValueBlogInput
): Promise<MarketValueBlogTopic[]> {
  // 1. Query skills with market value
  const skills = await getSkillsByMarketValue(input.workMeId, {
    marketNeedId: input.marketNeedId,
    relevanceLevel: input.relevanceLevel,
    limit: input.limit || 10,
  });

  // 2. For each skill, build blog topic context
  const topics: MarketValueBlogTopic[] = [];
  
  for (const skill of skills) {
    // Get recent evidence
    const recentItems = await prisma.skillItem.findMany({
      where: { skillTopicId: skill.id },
      orderBy: { occurredAt: 'desc' },
      take: 5,
    });

    // Get market context
    const marketValue = skill.marketValues.find(
      mv => !input.marketNeedId || mv.marketNeedId === input.marketNeedId
    );

    if (!marketValue) continue;

    // Generate blog topic using AI
    const topic = await generateTopicWithAI({
      skillTopic: skill,
      marketValue,
      recentItems,
    });

    topics.push(topic);
  }

  // 3. Sort by market value and evidence strength
  return topics
    .sort((a, b) => {
      // Prioritize high relevance
      if (a.marketContext !== b.marketContext) {
        return a.marketContext.localeCompare(b.marketContext);
      }
      // Then by evidence count
      return b.evidenceCount - a.evidenceCount;
    })
    .slice(0, 10);
}
```

### AI Prompt for Market-Value Blog Topics

```typescript
const prompt = `
You are a personal branding strategist helping professionals create content that demonstrates their market-valuable skills.

CONTEXT:
- Skill: ${skillTopic.title}
- Description: ${skillTopic.description}
- Market Need: ${marketNeed.name}
- Market Relevance: ${marketValue.relevanceLevel}
- Why It Matters: ${marketValue.rationale}
- Use Cases: ${marketValue.useCases.join(', ')}

RECENT EVIDENCE:
${recentItems.map(item => `- ${item.title}: ${item.description}`).join('\n')}

TASK:
Generate a reflection-based blog topic that:
1. Demonstrates this skill in the context of the market need
2. Uses recent evidence as the foundation
3. Is experiential (not tips/listicles)
4. Shows how the skill creates value in the market context

Return a blog topic with:
- Compelling title (max 100 chars)
- Description of what the blog would cover
- Rationale for why this topic is valuable
- Suggested angle/framing
`;
```

---

## 📋 API Route Specifications

### GET /api/myskills/market-value

**Query Params:**
- `marketNeedId?` - Filter by specific market need
- `relevanceLevel?` - Filter by relevance ('high', 'medium', 'emerging')
- `limit?` - Max results (default: 20)

**Response:**
```json
{
  "success": true,
  "skills": [
    {
      "skillTopic": {
        "id": "...",
        "title": "Narrative Development",
        "description": "...",
        "category": "Communication"
      },
      "marketValues": [
        {
          "marketNeed": {
            "id": "...",
            "name": "Change Enablement",
            "description": "..."
          },
          "relevanceLevel": "high",
          "useCases": ["...", "..."],
          "rationale": "..."
        }
      ],
      "evidenceCount": 15,
      "lastDemonstratedAt": "2025-01-15"
    }
  ]
}
```

### POST /api/myskills/generate-blog-topics

**Request Body:**
```json
{
  "marketNeedId": "optional-market-need-id",
  "relevanceLevel": "high",
  "skillTopicIds": ["optional-skill-id-1", "optional-skill-id-2"],
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "topics": [
    {
      "title": "How Narrative Development Enables Organizational Change",
      "description": "A reflection on using narrative development to support change initiatives...",
      "rationale": "High market value in Change Enablement with strong evidence",
      "skillTopicIds": ["skill-id-1"],
      "marketNeedId": "market-need-id",
      "marketContext": "Change Enablement",
      "evidenceCount": 15,
      "suggestedAngle": "Reflection on recent change initiative where narrative development was critical"
    }
  ]
}
```

### POST /api/myskills/generate-blog-content

**Request Body:**
```json
{
  "blogTopicId": "topic-id-from-previous-endpoint",
  "skillTopicIds": ["skill-id-1"],
  "marketNeedId": "market-need-id",
  "targetLength": 600
}
```

**Response:**
```json
{
  "success": true,
  "blogDraft": {
    "title": "...",
    "subtitle": "...",
    "outline": { ... },
    "body": { ... },
    "summary": "...",
    "cta": "..."
  }
}
```

---

## 🎨 UI/UX Flow

### Market Value Dashboard

1. **View Market Needs**
   - List of all market needs
   - Shows which skills are relevant to each

2. **Filter Skills by Market Value**
   - Select market need → See relevant skills
   - Filter by relevance level (high/medium/emerging)
   - See evidence count for each skill

3. **Generate Blog Topics**
   - Select market need (or "all")
   - Select relevance level filter
   - Click "Generate Blog Topics"
   - See 5-10 suggested topics

4. **Create Blog from Topic**
   - Click on a blog topic
   - See rationale and suggested angle
   - Click "Generate Blog Content"
   - Opens blog editor with generated content

---

## 🔗 Integration Points

### With Existing Systems

1. **Skill Tracking**
   - Skills must be tracked first (SkillTopics + SkillItems)
   - Market value must be assigned (SkillTopicMarketValue)

2. **Blog System**
   - Can integrate with existing `/api/workme/blog/ai`
   - Or create new endpoint specifically for market-value blogs

3. **Personal Branding**
   - BrandNarratives can be generated from market-value skills
   - BrandPositioning can prioritize high-market-value skills

---

## ✅ Success Criteria

1. **Query Skills by Market Value**
   - Can filter skills by market need
   - Can see relevance levels
   - Can see evidence supporting market value

2. **Generate Blog Topics from Market Value**
   - Topics prioritize high-market-value skills
   - Topics connect skills to market needs
   - Topics use recent evidence

3. **Generate Blog Content**
   - Content demonstrates skills in market context
   - Content is experiential (not tips/listicles)
   - Content uses actual evidence

4. **Personal Branding**
   - Can view skills by market value
   - Can generate brand narratives from market-value skills
   - Can create positioning statements prioritizing high-value skills

---

## 🚀 Next Steps

1. **Investigate Current Skill Data**
   - Check if users have SkillTopics
   - Check if MarketNeeds are seeded
   - Check if SkillTopicMarketValue exists

2. **Build Phase 1: Market Value Queries**
   - Create service functions
   - Create API routes
   - Test with existing data

3. **Build Phase 2: Blog Topic Generation**
   - Uncomment and enhance blogTopicGenerator
   - Add market-value-first logic
   - Create API route

4. **Build Phase 3: Blog Content Generation**
   - Integrate with blog generation
   - Add market-value mode
   - Test end-to-end

5. **Build Phase 4: UI**
   - Create market value dashboard
   - Create blog topic generator UI
   - Create blog content editor integration

---

## 📝 Notes

- **Market Value is Qualitative**: No numeric scores, only relevance levels
- **Evidence-Based**: Blog topics must be grounded in actual SkillItems
- **User Confirmation**: AI suggests, user confirms (especially for market value assignments)
- **Read-Only Branding**: BrandNarratives translate skills, don't create them
- **Work Backwards**: Start with market needs, not skills

---

**Status:** Ready for implementation planning and development

