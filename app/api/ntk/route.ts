import { NextResponse } from 'next/server'
import { listNTKs } from '@/lib/server/ntk'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/ntk
 * List all NTKs for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    console.log('[API GET /api/ntk]', { workMeId, companyUnit, companyDivision })

    const result = await listNTKs(companyUnit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ GET /api/ntk error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list NTKs',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

