import { NextResponse } from 'next/server'
import { createNTK } from '@/lib/server/ntk'
import { verifyAuth } from '@/lib/server/verifyAuth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/ntk/create
 * Create a new NTK
 * 
 * Body: { header, poc, summary, sourceText?, draftContent?, metadata? }
 * Returns: { success: true, ntkId, ntk }
 */
export async function POST(request: Request) {
  try {
    const { workMeId, companyId } = await verifyAuth(request)
    const body = await request.json()

    console.log('[API POST /api/ntk/create]', {
      payload: body,
      workMeId,
      companyId,
    })

    const result = await createNTK(body, workMeId, companyId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ POST /api/ntk/create error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create NTK',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

