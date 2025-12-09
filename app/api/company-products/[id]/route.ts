import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/company-products/[id]
 * Get a company product by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const productId = params.id

    console.log('[API GET /api/company-products/[id]]', {
      workMeId,
      productId,
    })

    // 3. Find product (must belong to user)
    const product = await prisma.companyProduct.findFirst({
      where: {
        id: productId,
        workMeId,
      },
      include: {
        highlights: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        pressures: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        updates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 },
      )
    }

    console.log('[API GET /api/company-products/[id]] SUCCESS')

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company-products/[id] error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

