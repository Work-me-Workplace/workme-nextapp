import { NextResponse } from 'next/server'
import { listStandaloneOutputs } from '@/lib/server/work-output-standalone'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/output-standalone
 * List all standalone outputs for the authenticated user
 */
export async function GET(request: Request) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    console.log('[API GET /api/output-standalone]', {
      workMeId,
      companyUnit,
    })

    const result = await listStandaloneOutputs(companyUnit)

    console.log('[API GET /api/output-standalone] SUCCESS', {
      count: result.data.length,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ GET /api/output-standalone error:', error)

    // Return 401 for auth errors, 500 for others
    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to list standalone outputs',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

