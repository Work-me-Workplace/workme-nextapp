import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const statusUpdate = searchParams.get('statusUpdate')

    // TODO: CompanyPlatformProduct doesn't have companyId field yet
    // For now, get all platform units (schema update needed to filter by company)
    // See docs/WORKME_ID_PARAMS_IMPLEMENTATION.md for schema migration plan
    const units = await prisma.companyPlatformUnit.findMany({
      select: {
        id: true,
      },
    })

    const unitIds = units.map(u => u.id)

    if (unitIds.length === 0) {
      return NextResponse.json({
        success: true,
        updates: [],
      })
    }

    // Build where clause
    const where: any = {
      platformUnitId: {
        in: unitIds,
      },
    }

    if (statusUpdate) {
      where.statusUpdate = statusUpdate
    }

    // Get all updates for these units
    const updates = await prisma.companyPlatformUnitUpdate.findMany({
      where,
      include: {
        platformUnit: {
          select: {
            id: true,
            hullNumber: true,
            name: true,
            platformProduct: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        statement: {
          select: {
            headline: true,
            sourceName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to recent updates
    })

    return NextResponse.json({
      success: true,
      updates,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company/products/platform/unit/updates/list error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list updates' },
      { status: 500 }
    )
  }
}
