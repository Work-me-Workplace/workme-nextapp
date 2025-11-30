import { NextResponse } from 'next/server'
import { getNTK, updateNTK, deleteNTK } from '@/lib/server/ntk'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/ntk/[ntkId]
 * Get a single NTK by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ ntkId: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe
    const { ntkId } = await params

    console.log('[API GET /api/ntk/[ntkId]]', { ntkId, workMeId, companyUnit, companyDivision })

    const result = await getNTK(ntkId, workMeId, companyUnit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ GET /api/ntk/[ntkId] error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 404

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get NTK',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

/**
 * PUT /api/ntk/[ntkId]
 * Update an NTK
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ ntkId: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe
    const { ntkId } = await params
    const body = await request.json()

    console.log('[API PUT /api/ntk/[ntkId]]', { ntkId, payload: body, workMeId, companyUnit, companyDivision })

    const result = await updateNTK({ ntkId, ...body }, workMeId, companyUnit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ PUT /api/ntk/[ntkId] error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update NTK',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

/**
 * DELETE /api/ntk/[ntkId]
 * Delete an NTK
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ntkId: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe
    const { ntkId } = await params

    console.log('[API DELETE /api/ntk/[ntkId]]', { ntkId, workMeId, companyUnit, companyDivision })

    const result = await deleteNTK(ntkId, workMeId, companyUnit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ DELETE /api/ntk/[ntkId] error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete NTK',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

