import { NextResponse } from 'next/server'
import { listStandaloneOutputs } from '@/lib/server/work-output-standalone'
import { verifyAuth } from '@/lib/server/verifyAuth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/output-standalone
 * List all standalone outputs for the authenticated user
 */
export async function GET(request: Request) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyId } = await verifyAuth(request)

    console.log('[API GET /api/output-standalone]', {
      workMeId,
      companyId,
    })

    const result = await listStandaloneOutputs(companyId)

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

