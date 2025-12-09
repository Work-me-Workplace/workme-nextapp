import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/company-products/list
 * List all company products for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    console.log('[API GET /api/company-products/list]', {
      workMeId,
    })

    const products = await prisma.companyProduct.findMany({
      where: {
        workMeId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        productionStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log('[API GET /api/company-products/list] SUCCESS', {
      count: products.length,
    })

    return NextResponse.json({
      success: true,
      products,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company-products/list error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to list products',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

