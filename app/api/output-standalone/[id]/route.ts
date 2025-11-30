import { NextResponse } from 'next/server'
import { getStandaloneOutput, updateStandaloneOutput, deleteStandaloneOutput } from '@/lib/server/work-output-standalone'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/output-standalone/[id]
 * Get a standalone output by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    const { id } = await params

    console.log('[API GET /api/output-standalone/[id]]', {
      id,
      workMeId,
      companyUnit,
      companyDivision,
    })

    const result = await getStandaloneOutput(id, companyUnit)

    console.log('[API GET /api/output-standalone/[id]] SUCCESS', {
      id,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ GET /api/output-standalone/[id] error:', error)

    // Return 401 for auth errors, 404 for not found, 500 for others
    const status = error.message?.includes('Unauthorized') 
      ? 401 
      : error.message === 'Output not found' 
      ? 404 
      : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get standalone output',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

/**
 * PUT /api/output-standalone/[id]
 * Update a standalone output
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    const { id } = await params
    const body = await request.json()

    console.log('[API PUT /api/output-standalone/[id]]', {
      id,
      payload: body,
      workMeId,
      companyUnit,
      companyDivision,
    })

    const result = await updateStandaloneOutput({ id, ...body }, workMeId, companyUnit)

    console.log('[API PUT /api/output-standalone/[id]] SUCCESS', {
      id,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ PUT /api/output-standalone/[id] error:', error)
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 },
      )
    }

    // Return 401 for auth errors, 404 for not found, 500 for others
    const status = error.message?.includes('Unauthorized') 
      ? 401 
      : error.message === 'Output not found' 
      ? 404 
      : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update standalone output',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

/**
 * DELETE /api/output-standalone/[id]
 * Delete a standalone output
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    const { id } = await params

    console.log('[API DELETE /api/output-standalone/[id]]', {
      id,
      workMeId,
      companyUnit,
      companyDivision,
    })

    const result = await deleteStandaloneOutput(id, workMeId, companyUnit)

    console.log('[API DELETE /api/output-standalone/[id]] SUCCESS', {
      id,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ DELETE /api/output-standalone/[id] error:', error)

    // Return 401 for auth errors, 404 for not found, 500 for others
    const status = error.message?.includes('Unauthorized') 
      ? 401 
      : error.message === 'Output not found' 
      ? 404 
      : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete standalone output',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

