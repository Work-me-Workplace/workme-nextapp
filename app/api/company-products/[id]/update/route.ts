import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/company-products/[id]/update
 * Update a company product
 */
export async function POST(
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

    // 3. Parse request body
    const body = await request.json()

    console.log('[API POST /api/company-products/[id]/update]', {
      workMeId,
      productId,
    })

    // 4. Verify product belongs to user
    const existingProduct = await prisma.companyProduct.findFirst({
      where: {
        id: productId,
        workMeId,
      },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 },
      )
    }

    // 5. Build update data (only include provided fields)
    const updateData: any = {}
    
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Product name cannot be empty' },
          { status: 400 },
        )
      }
      updateData.name = body.name.trim()
    }
    
    if (body.category !== undefined) {
      updateData.category = body.category?.trim() || null
    }
    
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }
    
    if (body.missionRole !== undefined) {
      updateData.missionRole = body.missionRole?.trim() || null
    }
    
    if (body.keyCapabilities !== undefined) {
      updateData.keyCapabilities = Array.isArray(body.keyCapabilities) 
        ? body.keyCapabilities 
        : []
    }
    
    if (body.limitations !== undefined) {
      updateData.limitations = Array.isArray(body.limitations) 
        ? body.limitations 
        : []
    }
    
    if (body.productionStatus !== undefined) {
      updateData.productionStatus = body.productionStatus?.trim() || null
    }
    
    if (body.leadershipFraming !== undefined) {
      updateData.leadershipFraming = body.leadershipFraming?.trim() || null
    }
    
    if (body.talkingPoints !== undefined) {
      updateData.talkingPoints = body.talkingPoints
    }
    
    if (body.publicSources !== undefined) {
      updateData.publicSources = body.publicSources
    }

    // 6. Update product
    const product = await prisma.companyProduct.update({
      where: {
        id: productId,
      },
      data: updateData,
    })

    console.log('[API POST /api/company-products/[id]/update] SUCCESS')

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('❌ POST /api/company-products/[id]/update error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

