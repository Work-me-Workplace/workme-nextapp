import { NextRequest, NextResponse } from 'next/server'
import { enrichAndUpsertCompany } from '@/lib/actions/company-enrichment'
import { verifyAuth } from '@/lib/server/verifyAuth'

/**
 * POST /api/enrich/company
 * 
 * Enrich company data from Apollo and upsert to database
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { companyId } = await verifyAuth(req)
    
    // Parse request body
    const body = await req.json()
    const { companyName } = body
    
    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid companyName' },
        { status: 400 }
      )
    }
    
    // Enrich and upsert company
    const company = await enrichAndUpsertCompany(companyName)
    
    return NextResponse.json({
      success: true,
      company,
    })
  } catch (error: any) {
    console.error('❌ /api/enrich/company error:', error)
    
    // Handle authentication errors
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to enrich company' 
      },
      { status: 500 }
    )
  }
}

