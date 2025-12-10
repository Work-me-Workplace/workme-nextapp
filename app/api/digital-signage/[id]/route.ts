import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/digital-signage/[id]
 * 
 * Get a digital signage product by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWorkMeAuth(request)
    const { id } = params

    const signage = await prisma.productDigitalSign.findUnique({
      where: { id },
      include: {
        workforceAchievement: true,
        workforce: true,
        companyNews: true,
        companyEvent: true,
      }
    })

    if (!signage) {
      return NextResponse.json(
        { success: false, error: 'Digital signage not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      signage,
    })
  } catch (error: any) {
    console.error('❌ GET /api/digital-signage/[id] error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to load digital signage',
      },
      { status: 500 }
    )
  }
}
