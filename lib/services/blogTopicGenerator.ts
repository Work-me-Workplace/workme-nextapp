/**
 * Blog Topic Generator Service
 * 
 * Generates reflection-based blog topics from:
 * - SkillTopics (durable capabilities)
 * - Market Value Intelligence (where skills matter)
 * - Recent SkillItems (evidence)
 * - MyContribution references (context) - links to CompanyX work
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
  myContributionId?: string; // MyContribution ID (links to CompanyX work)
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
  myContributionId?: string; // Related MyContribution (if any)
  companyXContext?: {
    type: 'event' | 'campaign' | 'training' | 'impactEvent' | 'community' | 'employeeCause' | 'benefits' | 'career' | 'leaderEngagement';
    id: string;
    title: string;
    description?: string;
  };
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

  // 4. Fetch MyContribution if provided (links to CompanyX work + Skills)
  let myContribution = null;
  let companyXContext = null;
  
  if (input.myContributionId) {
    myContribution = await prisma.myContribution.findUnique({
      where: { id: input.myContributionId },
      include: {
        companyEvent: {
          select: { id: true, title: true, description: true }
        },
        companyCampaign: {
          select: { id: true, title: true, description: true }
        },
        companyTraining: {
          select: { id: true, title: true, description: true }
        },
        companyImpactEvent: {
          select: { id: true, title: true, description: true }
        },
        companyCommunity: {
          select: { id: true, title: true, description: true }
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        whatDid: true,
        results: true,
        skillTopicIds: true, // Skills demonstrated in this contribution
        companyEvent: true,
        companyCampaign: true,
        companyTraining: true,
        companyImpactEvent: true,
        companyCommunity: true,
      },
    });

    // Extract CompanyX context from MyContribution
    if (myContribution) {
      if (myContribution.companyEvent) {
        companyXContext = {
          type: 'event' as const,
          id: myContribution.companyEvent.id,
          title: myContribution.companyEvent.title,
          description: myContribution.companyEvent.description || undefined,
        };
      } else if (myContribution.companyCampaign) {
        companyXContext = {
          type: 'campaign' as const,
          id: myContribution.companyCampaign.id,
          title: myContribution.companyCampaign.title,
          description: myContribution.companyCampaign.description || undefined,
        };
      } else if (myContribution.companyTraining) {
        companyXContext = {
          type: 'training' as const,
          id: myContribution.companyTraining.id,
          title: myContribution.companyTraining.title || 'Untitled Training',
          description: myContribution.companyTraining.description || undefined,
        };
      } else if (myContribution.companyImpactEvent) {
        companyXContext = {
          type: 'impactEvent' as const,
          id: myContribution.companyImpactEvent.id,
          title: myContribution.companyImpactEvent.title,
          description: myContribution.companyImpactEvent.description || undefined,
        };
      } else if (myContribution.companyCommunity) {
        companyXContext = {
          type: 'community' as const,
          id: myContribution.companyCommunity.id,
          title: myContribution.companyCommunity.title,
          description: myContribution.companyCommunity.description || undefined,
        };
      }
    }
  }

  // 5. Build context for AI generation
  const context = buildContext(skillTopic, recentItems, marketValues, myContribution, companyXContext);

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
  myContribution: any | null,
  companyXContext: { type: string; id: string; title: string; description?: string } | null
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
    myContribution: myContribution
      ? {
          id: myContribution.id,
          title: myContribution.title,
          description: myContribution.description,
          whatDid: myContribution.whatDid,
          results: myContribution.results,
          skillTopicIds: myContribution.skillTopicIds || [], // Skills demonstrated
        }
      : null,
    companyXContext,
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
        myContributionId: context.myContribution?.id,
        companyXContext: context.companyXContext,
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
  const { skillTopic, recentWork, marketContexts, adjacentTopics, myContribution, companyXContext } = context;

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
          `${i + 1}. ${item.title}${item.description ? `: ${item.description}` : ''} (${item.evidenceType || 'evidence'}, ${item.occurredAt ? new Date(item.occurredAt).toLocaleDateString() : 'recent'})`
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
${myContribution ? `MY CONTRIBUTION: ${myContribution.title || 'Untitled'}${myContribution.description ? ` - ${myContribution.description}` : ''}${myContribution.whatDid ? `\n  What I Did: ${myContribution.whatDid}` : ''}${myContribution.results ? `\n  Results: ${myContribution.results}` : ''}${myContribution.skillTopicIds && myContribution.skillTopicIds.length > 0 ? `\n  Skills Demonstrated: ${myContribution.skillTopicIds.length} skill(s)` : ''}\n` : ''}
${companyXContext ? `COMPANY WORK CONTEXT: ${companyXContext.title} (${companyXContext.type})${companyXContext.description ? ` - ${companyXContext.description}` : ''}\n` : ''}

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
