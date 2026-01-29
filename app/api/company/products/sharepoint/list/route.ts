import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // Load WorkMe identity to get companyId
    const workMe = await loadWorkMe(firebaseId)
    
    // Get companyId from URL params or use WorkMe's companyId
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId') || workMe.companyId
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      )
    }
    
    // Validate that the requested companyId matches the user's companyId for security
    if (companyId !== workMe.companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: companyId does not match user\'s company' },
        { status: 403 }
      )
    }

    // TODO: Add companyId field to CompanyProductSharepoint schema and filter by it
    // For now, we validate companyId but return all products (schema update needed)
    const products = await prisma.companyProductSharepoint.findMany({
      orderBy: { createdAt: 'desc' },
    })

    console.log(`[API GET /api/company/products/sharepoint/list] Returning ${products.length} products for companyId: ${companyId}`)

    return NextResponse.json({
      success: true,
      products,
    })
  } catch (error: any) {
    console.error('Failed to list sharepoint products:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
