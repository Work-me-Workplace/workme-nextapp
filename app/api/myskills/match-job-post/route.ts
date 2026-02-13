import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/verifyAuth';
import { loadWorkMe } from '@/lib/auth/loadWorkMe';
import { prisma } from '@/lib/prisma';
import { parseAndMatchJobPost } from '@/lib/services/jobPostParser';

/**
 * POST /api/myskills/match-job-post
 *
 * Paste an HR/job posting → parse out skills & requirements → match to your
 * WorkSkills and return "yep I have that" (with evidence) or gaps.
 *
 * Body: { jobPostText: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request);
    const workMe = await loadWorkMe(firebaseId);
    const { id: workMeId } = workMe;

    const body = await request.json();
    const jobPostText =
      typeof body.jobPostText === 'string' ? body.jobPostText.trim() : '';

    if (!jobPostText) {
      return NextResponse.json(
        { success: false, error: 'jobPostText is required' },
        { status: 400 }
      );
    }

    const workSkills = await prisma.workSkills.findUnique({
      where: { workMeId },
    }).catch(() => null);

    const result = await parseAndMatchJobPost({
      jobPostText,
      skillsRaw: workSkills?.skillsRaw ?? null,
      strengthsRaw: workSkills?.strengthsRaw ?? null,
      specialties: workSkills?.specialties ?? null,
      // Optional: if we had cached enriched summaries we could pass them here
      skillsSummary: null,
      strengthsSummary: null,
      specialtiesSummary: null,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('❌ Match job post error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse and match job post',
      },
      { status: 500 }
    );
  }
}
