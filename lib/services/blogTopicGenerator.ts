/**
 * Blog Topic Generator Service
 * 
 * ⚠️ COMMENTED OUT - Service not integrated, causes Prisma validation errors
 * 
 * This service was designed to generate reflection-based blog topics from SkillTopics,
 * Market Value Intelligence, Recent SkillItems, and CompanyWork references.
 * 
 * STATUS: Not integrated into any API routes. Commented out to prevent build errors.
 * 
 * See: docs/SKILL_MODEL_STATUS.md for full documentation
 * 
 * Constraints:
 * - No "tips" or listicles
 * - Content must be experiential
 * - Blogs explain value, they do not create it
 * 
 * TO RE-ENABLE:
 * 1. Uncomment this file
 * 2. Ensure all Prisma relations are valid
 * 3. Create API routes that use this service
 * 4. Test thoroughly
 */

// import { prisma } from "@/lib/prisma";

// ⚠️ COMMENTED OUT - Service not integrated, causes Prisma validation errors
// See: docs/SKILL_MODEL_STATUS.md for full documentation

export interface BlogTopicInput {
  skillTopicId: string;
  companyWorkId?: string;
  recentSkillItemIds?: string[];
  marketNeedIds?: string[];
}

export interface BlogTopic {
  title: string;
  description: string;
  rationale: string; // Why this topic is relevant
  suggestedSkillTopics: string[]; // Related SkillTopic IDs
  marketContext?: string; // Market need context
}

/**
 * Generate 5 reflection-based blog topic options
 * 
 * ⚠️ COMMENTED OUT - Not integrated, causes Prisma validation errors
 * 
 * @param input - SkillTopic, CompanyWork, and context information
 * @returns Array of 5 blog topic options
 */
export async function generateBlogTopics(
  input: BlogTopicInput
): Promise<BlogTopic[]> {
  throw new Error(
    "blogTopicGenerator service is commented out. See docs/SKILL_MODEL_STATUS.md"
  );
  
  /* COMMENTED OUT - Uncomment when ready to integrate
  // Fetch SkillTopic with related data
  const skillTopic = await prisma.skillTopic.findUnique({
    where: { id: input.skillTopicId },
    include: {
      skillItems: {
        take: 10,
        orderBy: { occurredAt: "desc" },
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

  // Fetch CompanyWork if provided
  let companyWork = null;
  if (input.companyWorkId) {
    companyWork = await prisma.companyWork.findUnique({
      where: { id: input.companyWorkId },
    });
  }

  // Build context for AI generation
  const context = buildContext(skillTopic, companyWork);

  // Generate blog topics (this would call OpenAI in production)
  const topics = await generateTopicsWithAI(context);

  return topics;
  */
}

/**
 * Build context for blog topic generation
 * 
 * ⚠️ COMMENTED OUT - Not integrated
 */
function buildContext(skillTopic: any, companyWork: any | null) {
  /* COMMENTED OUT
  const recentItems = skillTopic.skillItems.slice(0, 5);
  const marketContexts = skillTopic.marketValues.map((mv: any) => ({
    need: mv.marketNeed.name,
    relevance: mv.relevanceLevel,
    useCases: mv.useCases,
    rationale: mv.rationale,
  }));

  const adjacentTopics = [
    ...skillTopic.pivotFrom.map((p: any) => p.toTopic.title),
    ...skillTopic.pivotTo.map((p: any) => p.fromTopic.title),
  ];

  return {
    skillTopic: {
      title: skillTopic.title,
      description: skillTopic.description,
      category: skillTopic.category,
    },
    recentWork: recentItems.map((item: any) => ({
      title: item.title,
      description: item.description,
      evidenceType: item.evidenceType,
      occurredAt: item.occurredAt,
      companyWork: item.companyWork?.title,
    })),
    marketContexts,
    adjacentTopics,
    companyWork: companyWork
      ? {
          title: companyWork.title,
          description: companyWork.description,
          workType: companyWork.workType,
        }
      : null,
  };
  */
  return {} as any;
}

/**
 * Generate blog topics using AI
 * 
 * ⚠️ COMMENTED OUT - Not integrated
 * 
 * In production, this would call OpenAI with a carefully crafted prompt.
 * For now, this is a placeholder that returns example topics.
 */
async function generateTopicsWithAI(context: any): Promise<BlogTopic[]> {
  /* COMMENTED OUT
  // TODO: Implement OpenAI integration
  // For now, return example topics based on context

  const topics: BlogTopic[] = [];

  // Example topic 1: Reflecting on recent work
  if (context.recentWork.length > 0 && context.companyWork) {
    topics.push({
      title: `Reflections on Using ${context.skillTopic.title} to ${context.companyWork.title}`,
      description: `A reflection on how ${context.skillTopic.title} was applied in ${context.companyWork.title}`,
      rationale: `Recent work in ${context.companyWork.title} demonstrates ${context.skillTopic.title}`,
      suggestedSkillTopics: [context.skillTopic.title],
      marketContext: context.marketContexts[0]?.need,
    });
  }

  // Example topic 2: Market relevance
  if (context.marketContexts.length > 0) {
    const marketContext = context.marketContexts[0];
    topics.push({
      title: `How ${context.skillTopic.title} Matters in ${marketContext.need}`,
      description: `Exploring why ${context.skillTopic.title} is relevant in ${marketContext.need}`,
      rationale: `Market intelligence shows ${context.skillTopic.title} is highly relevant in ${marketContext.need}`,
      suggestedSkillTopics: [context.skillTopic.title],
      marketContext: marketContext.need,
    });
  }

  // Example topic 3: Adjacent capabilities
  if (context.adjacentTopics.length > 0) {
    topics.push({
      title: `The Connection Between ${context.skillTopic.title} and ${context.adjacentTopics[0]}`,
      description: `Exploring how ${context.skillTopic.title} relates to ${context.adjacentTopics[0]}`,
      rationale: `Adjacent pivot suggests connection between these capabilities`,
      suggestedSkillTopics: [context.skillTopic.title, context.adjacentTopics[0]],
    });
  }

  // Example topic 4: Growth reflection
  topics.push({
    title: `Growing Through ${context.skillTopic.title}: A Personal Journey`,
    description: `Reflecting on the growth journey with ${context.skillTopic.title}`,
    rationale: `Multiple evidence points show growth in this capability`,
    suggestedSkillTopics: [context.skillTopic.title],
  });

  // Example topic 5: Practical application
  if (context.recentWork.length > 0) {
    topics.push({
      title: `Lessons Learned: Applying ${context.skillTopic.title} in Practice`,
      description: `Practical insights from applying ${context.skillTopic.title}`,
      rationale: `Recent evidence provides practical application examples`,
      suggestedSkillTopics: [context.skillTopic.title],
    });
  }

  // Return exactly 5 topics (pad if needed)
  while (topics.length < 5) {
    topics.push({
      title: `Exploring ${context.skillTopic.title}`,
      description: `A reflection on ${context.skillTopic.title}`,
      rationale: `General reflection topic`,
      suggestedSkillTopics: [context.skillTopic.title],
    });
  }

  return topics.slice(0, 5);
  */
  return [];
}

/**
 * Example usage:
 * 
 * const topics = await generateBlogTopics({
 *   skillTopicId: "topic-event-coordination",
 *   companyWorkId: "work-holiday-open-house",
 *   recentSkillItemIds: ["item-1", "item-2"]
 * });
 * 
 * Output:
 * [
 *   {
 *     title: "Reflections on Using Event Coordination to Holiday Open House",
 *     description: "...",
 *     rationale: "...",
 *     suggestedSkillTopics: ["Event Coordination"],
 *     marketContext: "Change Enablement"
 *   },
 *   ...
 * ]
 */

