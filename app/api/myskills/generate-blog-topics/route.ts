import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/verifyAuth';
import { loadWorkMe } from '@/lib/auth/loadWorkMe';
import {
  generateBlogTopics,
  SkillTopicBlogInput,
  MarketValueBlogInput,
} from '@/lib/services/blogTopicGenerator';

/**
 * POST /api/myskills/generate-blog-topics
 * 
 * Generate blog topics from SkillTopics and Market Value Intelligence
 * 
 * Supports two approaches:
 * 1. Skill-First: Provide skillTopicId
 * 2. Market-Value-First: Provide marketNeedId and/or relevanceLevel
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request);
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId);
    const { id: workMeId } = workMe;

    // 3. Parse request body
    const body = await request.json();
    const {
      skillTopicId,
      myContributionId, // Use MyContribution instead of companyWorkId
      recentSkillItemIds,
      marketNeedIds,
      // Market-value-first approach
      marketNeedId,
      relevanceLevel,
      skillTopicIds,
      limit,
    } = body;

    // 4. Determine which approach
    let input: SkillTopicBlogInput | MarketValueBlogInput;

    if (skillTopicId) {
      // Skill-first approach
      input = {
        workMeId,
        skillTopicId,
        myContributionId, // Links to CompanyX work via MyContribution
        recentSkillItemIds,
        marketNeedIds,
      };
    } else {
      // Market-value-first approach (work backwards)
      input = {
        workMeId,
        marketNeedId,
        relevanceLevel,
        skillTopicIds,
        limit: limit || 10,
      };
    }

    // 5. Generate blog topics
    const topics = await generateBlogTopics(input);

    return NextResponse.json({
      success: true,
      topics,
      count: topics.length,
    });
  } catch (error: any) {
    console.error('❌ Generate blog topics error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate blog topics' },
      { status: 500 }
    );
  }
}

