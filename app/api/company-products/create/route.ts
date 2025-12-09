import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/company-products/create
 * Create a new company product
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Parse request body
    const body = await request.json()
    const { name, category, description } = body

    // 4. Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 },
      )
    }

    console.log('[API POST /api/company-products/create]', {
      workMeId,
      name,
    })

    // 5. Create product
    const product = await prisma.companyProduct.create({
      data: {
        workMeId,
        name: name.trim(),
        category: category?.trim() || null,
        description: description?.trim() || null,
      },
    })

    console.log('[API POST /api/company-products/create] SUCCESS', {
      productId: product.id,
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('❌ POST /api/company-products/create error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

