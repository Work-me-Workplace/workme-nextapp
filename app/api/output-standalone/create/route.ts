import { NextResponse } from 'next/server'
import { createStandaloneOutput } from '@/lib/server/work-output-standalone'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/output-standalone/create
 * Create a new standalone output
 * 
 * Body: { outputType, title, description?, draftContent?, metadata?, workSupportId? }
 * Returns: { success: true, operation, outputType, outputId, message, data }
 */
export async function POST(request: Request) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!companyUnit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User must set a companyUnit before creating work items' 
        },
        { status: 400 },
      )
    }

    const body = await request.json()

    console.log('[API POST /api/output-standalone/create]', {
      payload: body,
      workMeId,
      companyUnit,
    })

    const result = await createStandaloneOutput(body, workMeId, companyUnit)

    console.log('[API POST /api/output-standalone/create] SUCCESS', {
      outputId: result.outputId,
      outputType: result.outputType,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ POST /api/output-standalone/create error:', error)
    
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

    // Return 401 for auth errors, 500 for others
    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create standalone output',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

