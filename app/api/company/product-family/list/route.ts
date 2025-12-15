/**
 * GET /api/company/product-family/list
 * 
 * Get list of ProductFamily options for dropdown selection
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    // 3. Fetch ProductFamilies (optionally filtered by companyId if provided)
    const productFamilies = await prisma.productFamily.findMany({
      where: companyId ? { companyId } : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        companyId: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      productFamilies,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company/product-family/list error:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch product families' },
      { status: 500 }
    )
  }
}