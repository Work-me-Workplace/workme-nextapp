/**
 * POST /api/company/milestones/[id]/generate-digital-product
 * 
 * Generate a digital product from a milestone
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { digitalProductFromMilestoneService } from '@/lib/services/digital-product-from-milestone-service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    if (!workMeId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const milestoneId = params.id
    const body = await request.json()
    const { companyUnit } = body

    console.log('[API POST /api/company/milestones/:id/generate-digital-product]', {
      workMeId,
      milestoneId,
      companyUnit,
    })

    // Generate digital product from milestone
    const result = await digitalProductFromMilestoneService({
      milestoneId,
      createdByWorkMeId: workMeId,
      companyUnit: companyUnit || null,
    })

    console.log(`✅ Generated digital product ${result.digitalSign.id} from milestone ${milestoneId}`)

    return NextResponse.json({
      success: true,
      digitalSign: result.digitalSign,
      milestone: result.milestone,
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/milestones/:id/generate-digital-product error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate digital product' },
      { status: 500 }
    )
  }
}
