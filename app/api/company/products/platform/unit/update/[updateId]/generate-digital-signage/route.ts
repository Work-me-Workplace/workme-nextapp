/**
 * POST /api/company/products/platform/unit/update/[updateId]/generate-digital-signage
 * 
 * Generate a digital signage product from a platform unit update
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { digitalProductFromPlatformUnitUpdateService } from '@/lib/services/digital-product-from-platform-unit-update-service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ updateId: string }> }
) {
  try {
    const auth = await requireWorkMeAuth(request)
    const { updateId } = await params

    if (!updateId) {
      return NextResponse.json(
        { success: false, error: 'updateId is required' },
        { status: 400 }
      )
    }

    // Get optional companyUnit from request body
    const body = await request.json().catch(() => ({}))
    const { companyUnit } = body

    // Generate digital signage from platform unit update
    const result = await digitalProductFromPlatformUnitUpdateService({
      updateId,
      createdByWorkMeId: auth.id,
      companyUnit: companyUnit || null,
    })

    return NextResponse.json({
      success: true,
      digitalSign: result.digitalSign,
      platformUnit: result.platformUnit,
      update: result.update,
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/products/platform/unit/update/[updateId]/generate-digital-signage error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate digital signage from platform unit update',
      },
      { status: 500 }
    )
  }
}
