/**
 * Blog Topic Generator Service
 * 
 * Generates reflection-based blog topics from:
 * - SkillTopics (durable capabilities)
 * - Market Value Intelligence (where skills matter)
 * - Recent SkillItems (evidence)
 * - CompanyWork references (context)
 * 
 * Constraints:
 * - No "tips" or listicles
 * - Content must be experiential
 * - Blogs explain value, they do not create it
 * 
 * Supports two approaches:
 * 1. Market-Value-First: Start with market needs, find high-value skills
 * 2. Skill-First: Start with a specific SkillTopic
 */

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// TYPES
// ============================================

/**
 * Input for generating blog topics from a specific SkillTopic
 */
export interface SkillTopicBlogInput {
  workMeId: string;
  skillTopicId: string;
  companyWorkId?: string;
  recentSkillItemIds?: string[];
  marketNeedIds?: string[];
}

/**
 * Input for generating blog topics from market value (work backwards)
 */
export interface MarketValueBlogInput {
  workMeId: string;
  marketNeedId?: string;
  relevanceLevel?: 'high' | 'medium' | 'emerging';
  skillTopicIds?: string[];
  limit?: number;
}

/**
 * Blog topic output
 */
export interface BlogTopic {
  title: string; // Compelling blog title (max 100 chars)
  description: string; // What the blog would cover
  rationale: string; // Why this topic is valuable
  suggestedSkillTopicIds: string[]; // Related SkillTopic IDs
  marketContext?: string; // Market need context
  marketNeedId?: string; // Market need ID
  evidenceCount?: number; // Number of SkillItems supporting this
  suggestedAngle?: string; // How to frame the blog
  companyWorkId?: string; // Related CompanyWork (if any)
}

// ============================================
// MARKET-VALUE-FIRST APPROACH (Work Backwards)
// ============================================

/**
 * Generate blog topics starting from market value
 * 
 * Flow: Market Need → High-Value Skills → Evidence → Blog Topics
 */
export async function generateBlogTopicsFromMarketValue(
  input: MarketValueBlogInput
): Promise<BlogTopic[]> {
  // 1. Query skills with market value
  const skills = await getSkillsByMarketValue(input.workMeId, {
    marketNeedId: input.marketNeedId,
    relevanceLevel: input.relevanceLevel,
    skillTopicIds: input.skillTopicIds,
    limit: input.limit || 10,
  });

  if (skills.length === 0) {
    return [];
  }

  // 2. For each skill, generate blog topics
  const allTopics: BlogTopic[] = [];

  for (const skill of skills) {
    const topics = await generateBlogTopicsForSkill({
      workMeId: input.workMeId,
      skillTopicId: skill.id,
      marketNeedIds: skill.marketValues.map(mv => mv.marketNeedId),
    });

    allTopics.push(...topics);
  }

  // 3. Sort by market value and evidence strength
  const sortedTopics = allTopics.sort((a, b) => {
    // Prioritize high relevance
    if (a.marketContext !== b.marketContext) {
      return (a.marketContext || '').localeCompare(b.marketContext || '');
    }
    // Then by evidence count
    return (b.evidenceCount || 0) - (a.evidenceCount || 0);
  });

  // 4. Return top 5 unique topics
  return deduplicateTopics(sortedTopics).slice(0, 5);
}

// ============================================
// SKILL-FIRST APPROACH (Traditional)
// ============================================

/**
 * Generate blog topics for a specific SkillTopic
 * 
 * Flow: SkillTopic → Market Value → Evidence → Blog Topics
 */
export async function generateBlogTopicsForSkill(
  input: SkillTopicBlogInput
): Promise<BlogTopic[]> {
  // 1. Fetch SkillTopic with all related data
  const skillTopic = await prisma.skillTopic.findUnique({
    where: { id: input.skillTopicId },
    include: {
      skillItems: {
        take: 10,
        orderBy: { occurredAt: 'desc' },
        include: {
          companyWork: true,
        },
      },
      marketValues: {
        include: {
          marketNeed: true,
        },
      },
      pivotFrom: {
        include: {
          toTopic: true,
        },
      },
      pivotTo: {
        include: {
          fromTopic: true,
        },
      },
    },
  });

  if (!skillTopic) {
    throw new Error(`SkillTopic not found: ${input.skillTopicId}`);
  }

  // 2. Filter SkillItems if specific ones requested
  let recentItems = skillTopic.skillItems;
  if (input.recentSkillItemIds && input.recentSkillItemIds.length > 0) {
    recentItems = recentItems.filter(item =>
      input.recentSkillItemIds!.includes(item.id)
    );
  }

  // 3. Filter MarketValues if specific ones requested
  let marketValues = skillTopic.marketValues;
  if (input.marketNeedIds && input.marketNeedIds.length > 0) {
    marketValues = marketValues.filter(mv =>
      input.marketNeedIds!.includes(mv.marketNeedId)
    );
  }

  // 4. Fetch CompanyWork if provided
  let companyWork = null;
  if (input.companyWorkId) {
    companyWork = await prisma.companyWork.findUnique({
      where: { id: input.companyWorkId },
    });
  }

  // 5. Build context for AI generation
  const context = buildContext(skillTopic, recentItems, marketValues, companyWork);

  // 6. Generate blog topics using AI
  const topics = await generateTopicsWithAI(context);

  return topics;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Query skills by market value
 */
async function getSkillsByMarketValue(
  workMeId: string,
  options: {
    marketNeedId?: string;
    relevanceLevel?: 'high' | 'medium' | 'emerging';
    skillTopicIds?: string[];
    limit?: number;
  }
) {
  const where: any = {
    workMeId,
    skillItems: {
      some: {}, // Must have at least one SkillItem (no naked skills)
    },
  };

  if (options.skillTopicIds && options.skillTopicIds.length > 0) {
    where.id = { in: options.skillTopicIds };
  }

  const skills = await prisma.skillTopic.findMany({
    where,
    include: {
      skillItems: {
        take: 5,
        orderBy: { occurredAt: 'desc' },
        include: {
          companyWork: true,
        },
      },
      marketValues: {
        where: {
          ...(options.marketNeedId && { marketNeedId: options.marketNeedId }),
          ...(options.relevanceLevel && { relevanceLevel: options.relevanceLevel }),
        },
        include: {
          marketNeed: true,
        },
      },
    },
    take: options.limit || 20,
  });

  // Filter to only skills with market values
  return skills.filter(skill => skill.marketValues.length > 0);
}

/**
 * Build context for blog topic generation
 */
function buildContext(
  skillTopic: any,
  recentItems: any[],
  marketValues: any[],
  companyWork: any | null
) {
  const adjacentTopics = [
    ...skillTopic.pivotFrom.map((p: any) => p.toTopic.title),
    ...skillTopic.pivotTo.map((p: any) => p.fromTopic.title),
  ];

  return {
    skillTopic: {
      id: skillTopic.id,
      title: skillTopic.title,
      description: skillTopic.description,
      category: skillTopic.category,
      firstDemonstratedAt: skillTopic.firstDemonstratedAt,
      lastDemonstratedAt: skillTopic.lastDemonstratedAt,
    },
    recentWork: recentItems.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      evidenceType: item.evidenceType,
      occurredAt: item.occurredAt,
      companyWork: item.companyWork
        ? {
            id: item.companyWork.id,
            title: item.companyWork.title,
            description: item.companyWork.description,
            workType: item.companyWork.workType,
          }
        : null,
    })),
    marketContexts: marketValues.map((mv: any) => ({
      marketNeedId: mv.marketNeedId,
      need: mv.marketNeed.name,
      description: mv.marketNeed.description,
      relevance: mv.relevanceLevel,
      useCases: mv.useCases,
      rationale: mv.rationale,
    })),
    adjacentTopics,
    companyWork: companyWork
      ? {
          id: companyWork.id,
          title: companyWork.title,
          description: companyWork.description,
          workType: companyWork.workType,
        }
      : null,
  };
}

/**
 * Generate blog topics using AI
 */
async function generateTopicsWithAI(context: any): Promise<BlogTopic[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for blog topic generation');
  }

  // Build prompt
  const prompt = buildPrompt(context);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a personal branding strategist helping professionals create reflection-based blog content that demonstrates their market-valuable skills.

Your task is to generate blog topics that:
1. Are EXPERIENTIAL (not tips, not listicles, not how-to guides)
2. Demonstrate VALUE that already exists (blogs explain value, they don't create it)
3. Use REAL EVIDENCE from recent work
4. Connect skills to MARKET CONTEXTS where they matter
5. Are REFLECTIVE (personal journey, lessons learned, insights gained)

Do NOT generate:
- "5 Tips for..." or "How to..." articles
- Generic advice or best practices
- Content that doesn't reference specific evidence
- Topics that claim to create value rather than demonstrate it`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    const topics = response.topics || [];

    // Validate and format topics
    return topics
      .slice(0, 5)
      .map((topic: any) => ({
        title: topic.title || '',
        description: topic.description || '',
        rationale: topic.rationale || '',
        suggestedSkillTopicIds: topic.suggestedSkillTopicIds || [context.skillTopic.id],
        marketContext: topic.marketContext,
        marketNeedId: topic.marketNeedId,
        evidenceCount: context.recentWork.length,
        suggestedAngle: topic.suggestedAngle,
        companyWorkId: context.companyWork?.id,
      }))
      .filter((topic: BlogTopic) => topic.title.length > 0);
  } catch (error: any) {
    console.error('❌ AI blog topic generation error:', error);
    throw new Error(`Failed to generate blog topics: ${error.message}`);
  }
}

/**
 * Build AI prompt for blog topic generation
 */
function buildPrompt(context: any): string {
  const { skillTopic, recentWork, marketContexts, adjacentTopics, companyWork } = context;

  let prompt = `Generate 5 reflection-based blog topics for a professional with the following context:

SKILL:
- Title: ${skillTopic.title}
- Description: ${skillTopic.description || 'No description provided'}
- Category: ${skillTopic.category || 'Not categorized'}
- First Demonstrated: ${skillTopic.firstDemonstratedAt ? new Date(skillTopic.firstDemonstratedAt).toLocaleDateString() : 'Unknown'}
- Last Demonstrated: ${skillTopic.lastDemonstratedAt ? new Date(skillTopic.lastDemonstratedAt).toLocaleDateString() : 'Unknown'}

RECENT EVIDENCE (${recentWork.length} items):
${recentWork.length > 0
  ? recentWork
      .map(
        (item: any, i: number) =>
          `${i + 1}. ${item.title}${item.description ? `: ${item.description}` : ''} (${item.evidenceType || 'evidence'}, ${item.occurredAt ? new Date(item.occurredAt).toLocaleDateString() : 'recent'})${item.companyWork ? ` - Related to: ${item.companyWork.title}` : ''}`
      )
      .join('\n')
  : 'No recent evidence available'}

MARKET CONTEXTS (${marketContexts.length} contexts):
${marketContexts.length > 0
  ? marketContexts
      .map(
        (mv: any) =>
          `- ${mv.need} (${mv.relevance} relevance): ${mv.rationale || 'No rationale'}${mv.useCases.length > 0 ? `\n  Use cases: ${mv.useCases.join(', ')}` : ''}`
      )
      .join('\n')
  : 'No market contexts defined'}

${adjacentTopics.length > 0 ? `ADJACENT SKILLS: ${adjacentTopics.join(', ')}\n` : ''}
${companyWork ? `SPECIFIC COMPANY WORK: ${companyWork.title}${companyWork.description ? ` - ${companyWork.description}` : ''}\n` : ''}

Generate 5 blog topics that:
1. Are REFLECTION-BASED (personal experience, lessons learned, insights)
2. Use SPECIFIC EVIDENCE from the recent work listed above
3. Connect the skill to MARKET CONTEXTS where it matters
4. Are EXPERIENTIAL (not tips, not listicles, not how-to guides)
5. DEMONSTRATE VALUE that already exists (don't claim to create new value)

Each topic should have:
- title: Compelling, reflection-based title (max 100 characters)
- description: What the blog would cover (2-3 sentences)
- rationale: Why this topic is valuable for personal branding
- suggestedSkillTopicIds: Array with skill topic ID "${skillTopic.id}"
- marketContext: The market need this addresses (if applicable)
- marketNeedId: The market need ID (if applicable)
- suggestedAngle: How to frame the blog (e.g., "Reflection on recent project", "Lessons from organizational change")

Return JSON in this exact format:
{
  "topics": [
    {
      "title": "Reflections on Using Moments That Matter to Maintain Trust During Organizational Change",
      "description": "A personal reflection on how event coordination skills were applied during a major organizational change initiative, using the Holiday Open House as a case study.",
      "rationale": "Demonstrates high-value skill (Event Coordination) in a critical market context (Change Enablement) with concrete evidence",
      "suggestedSkillTopicIds": ["${skillTopic.id}"],
      "marketContext": "Change Enablement",
      "marketNeedId": "${marketContexts[0]?.marketNeedId || ''}",
      "suggestedAngle": "Reflection on using event coordination to maintain trust during organizational change"
    }
  ]
}`;

  return prompt;
}

/**
 * Deduplicate blog topics by title similarity
 */
function deduplicateTopics(topics: BlogTopic[]): BlogTopic[] {
  const seen = new Set<string>();
  const unique: BlogTopic[] = [];

  for (const topic of topics) {
    const key = topic.title.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(topic);
    }
  }

  return unique;
}

// ============================================
// EXPORTS
// ============================================

/**
 * Main entry point - supports both approaches
 */
export async function generateBlogTopics(
  input: SkillTopicBlogInput | MarketValueBlogInput
): Promise<BlogTopic[]> {
  // Determine which approach based on input
  if ('skillTopicId' in input) {
    // Skill-first approach
    return generateBlogTopicsForSkill(input);
  } else {
    // Market-value-first approach
    return generateBlogTopicsFromMarketValue(input);
  }
}
