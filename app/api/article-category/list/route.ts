/**
 * GET /api/article-category/list
 * 
 * List all article categories for the authenticated user's company
 */

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
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    // Get all categories for this company
    const categories = await prisma.articleCategory.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        categories,
      },
    })
  } catch (error: any) {
    console.error('❌ GET /api/article-category/list error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list categories' },
      { status: 500 }
    )
  }
}
