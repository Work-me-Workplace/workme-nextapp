import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/verifyAuth';
import { loadWorkMe } from '@/lib/auth/loadWorkMe';
import { generateSimpleBlog } from '@/lib/services/simpleBlogGenerator';

/**
 * POST /api/blog/generate
 * 
 * Generate a simple 6-paragraph blog post from user inputs
 * 
 * Request Body:
 * {
 *   "whatHappened": "string (required)",
 *   "whatItTaught": "string (required)",
 *   "additionalContext": "string (optional)"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "blog": {
 *     "paragraphs": ["para1", "para2", ...],
 *     "fullText": "combined text"
 *   }
 * }
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
    const { whatHappened, whatItTaught, additionalContext } = body;

    // 4. Validate required fields
    if (!whatHappened || !whatHappened.trim()) {
      return NextResponse.json(
        { success: false, error: 'whatHappened is required' },
        { status: 400 }
      );
    }

    if (!whatItTaught || !whatItTaught.trim()) {
      return NextResponse.json(
        { success: false, error: 'whatItTaught is required' },
        { status: 400 }
      );
    }

    // 5. Generate blog
    const blog = await generateSimpleBlog({
      workMeId,
      whatHappened: whatHappened.trim(),
      whatItTaught: whatItTaught.trim(),
      additionalContext: additionalContext?.trim(),
    });

    return NextResponse.json({
      success: true,
      blog,
    });
  } catch (error: any) {
    console.error('❌ Blog generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate blog' },
      { status: 500 }
    );
  }
}

