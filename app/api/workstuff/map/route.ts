import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getSections, storeSections } from '@/lib/redis'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STEP 2: Update section mapping
 * 
 * Updates a section's type and status in Redis
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth.workMeId || !auth.companyId) {
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

    // Get current sections
    const sections = await getSections(workMeId)
    
    // Find and update the section
    const sectionIndex = sections.findIndex((s: any) => s.id === sectionId)
    if (sectionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      )
    }

    // Update section
    sections[sectionIndex] = {
      ...sections[sectionIndex],
      type,
      status: 'mapped' as const,
      modelStatus: type === 'training' ? 'pending' : 'coming_soon' as const,
    }

    // Save back to Redis
    await storeSections(workMeId, sections)

    return NextResponse.json({
      success: true,
      section: sections[sectionIndex],
    })
  } catch (error: any) {
    console.error('[Map Section] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to map section' },
      { status: 500 }
    )
  }
}

/**
 * GET: Retrieve all sections
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
      sections,
    })
  } catch (error: any) {
    console.error('[Get Sections] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get sections' },
      { status: 500 }
    )
  }
}

