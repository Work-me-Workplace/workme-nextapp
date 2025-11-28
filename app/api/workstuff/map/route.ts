import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getSections, updateSection } from '@/lib/redis'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET: Retrieve all sections for mapping
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth.workMeId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { workMeId } = auth
    const sections = await getSections(workMeId)

    return NextResponse.json({
      success: true,
      sections: sections || [],
    })
  } catch (error: any) {
    console.error('[Get Sections] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get sections' },
      { status: 500 }
    )
  }
}

/**
 * POST: Update section mapping
 * 
 * Accepts: { sectionId, type }
 * Updates: section.type = type, section.status = "mapped"
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth.workMeId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { workMeId } = auth
    const { sectionId, type } = await request.json()

    if (!sectionId || !type) {
      return NextResponse.json(
        { success: false, error: 'sectionId and type are required' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = [
      'training',
      'event',
      'campaign',
      'impact_event',
      'benefits',
      'community',
      'career',
      'employee_cause',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type: ${type}` },
        { status: 400 }
      )
    }

    // Update section in Redis
    await updateSection(workMeId, sectionId, {
      type,
      status: 'mapped',
    })

    return NextResponse.json({
      success: true,
      mappedType: type,
      sectionId,
    })
  } catch (error: any) {
    console.error('[Map Section] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to map section' },
      { status: 500 }
    )
  }
}
