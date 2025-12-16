import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { inferTeamMember, TeamMemberType } from '@/lib/services/team-member-inference-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/team/infer
 * Infer structured team member data from natural language description
 * 
 * Body: { description: string, type?: 'Director' | 'Deputy' | 'Peer' | 'Subordinate' }
 * Returns: { success: true, data: TeamMemberData }
 */
export async function POST(request: Request) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)

    const body = await request.json()
    const { description, type } = body

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      )
    }

    if (description.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Description must be at least 10 characters' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/team/infer]', {
      firebaseId,
      descriptionLength: description.length,
      suggestedType: type,
    })

    // Infer the team member data
    const inferredData = await inferTeamMember(
      description,
      type as TeamMemberType | undefined
    )

    console.log('[API POST /api/team/infer] SUCCESS', {
      firebaseId,
      inferredType: inferredData.type,
    })

    return NextResponse.json({
      success: true,
      data: inferredData,
    })
  } catch (error: any) {
    console.error('❌ POST /api/team/infer error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to infer team member data',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}



