import { NextResponse } from 'next/server'
import { getWorkContext } from '@/lib/server/get-work-context'
import { updateTypedContext, deleteTypedContext } from '@/lib/server/context-factory'
import { SCHEMA_MAP } from '@/lib/server/context-schemas'
import { verifyAuth } from '@/lib/server/verifyAuth'
import type { ContextType } from '@prisma/client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/context/[contextId]
 * Get a single WorkContext with enriched typed data
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> }
) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyId } = await verifyAuth(request)

    const { contextId } = await params

    console.log('[API GET /api/context/[contextId]]', {
      contextId,
      workMeId,
      companyId,
    })

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Context ID is required' },
        { status: 400 },
      )
    }

    // Get WorkContext with enrichment (uses factory pattern, filtered by companyId)
    const workContext = await getWorkContext(contextId, companyId)

    if (!workContext) {
      console.error('[API GET /api/context/[contextId]] ERROR: Context not found', {
        contextId,
      })
      return NextResponse.json(
        { success: false, error: 'Context not found or unauthorized' },
        { status: 404 },
      )
    }

    console.log('[API GET /api/context/[contextId]] SUCCESS', {
      contextId,
      routerId: workContext.id,
      type: workContext.type,
      title: workContext.title,
    })

    return NextResponse.json({
      success: true,
      workContext,
    })
  } catch (error: any) {
    console.error('❌ GET /api/context/[contextId] error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch context',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/context/[contextId]
 * Update a WorkContext's typed data using factory pattern
 * 
 * Body: { ...typedContextData } (validated against schema)
 * Updates the typed model, not the router entry
 * Type comes from router.type, not request body
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> }
) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyId } = await verifyAuth(request)

    const { contextId } = await params
    const body = await request.json()

    console.log('[API PUT /api/context/[contextId]]', {
      contextId,
      payload: body,
      workMeId,
      companyId,
    })

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Context ID is required' },
        { status: 400 },
      )
    }

    // Get WorkContext to determine type (uses factory enrichment, filtered by companyId)
    const workContext = await getWorkContext(contextId, companyId)

    if (!workContext) {
      return NextResponse.json(
        { success: false, error: 'Context not found or unauthorized' },
        { status: 404 },
      )
    }

    // Get schema for validation based on context type
    const schema = SCHEMA_MAP[workContext.type as keyof typeof SCHEMA_MAP]
    if (!schema) {
      return NextResponse.json(
        { success: false, error: 'No schema found for context type' },
        { status: 400 },
      )
    }

    // Validate and parse data
    const validated = schema.parse(body)

    // Clean up data for Prisma (convert null to undefined)
    const cleanData = Object.fromEntries(
      Object.entries(validated).map(([key, value]) => [
        key,
        value === null ? undefined : value,
      ])
    )

    // Update using factory (includes transaction and ownership validation)
    const result = await updateTypedContext(
      contextId,
      workContext.type,
      cleanData,
      workMeId,
      companyId
    )

    console.log('[API PUT /api/context/[contextId]] SUCCESS', {
      contextId,
      type: workContext.type,
      typedId: result.typed.id,
      routerId: result.router.id,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ PUT /api/context/[contextId] error:', error)
    
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

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update context',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/context/[contextId]
 * Delete a WorkContext and its typed data using factory pattern
 * Validates ownership and deletes both atomically
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> }
) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyId } = await verifyAuth(request)

    const { contextId } = await params

    console.log('[API DELETE /api/context/[contextId]]', {
      contextId,
      workMeId,
      companyId,
    })

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Context ID is required' },
        { status: 400 },
      )
    }

    // Delete using factory (includes transaction and ownership validation)
    await deleteTypedContext(contextId, workMeId, companyId)

    console.log('[API DELETE /api/context/[contextId]] SUCCESS', {
      contextId,
    })

    return NextResponse.json({
      success: true,
      message: 'Context deleted successfully',
    })
  } catch (error: any) {
    console.error('❌ DELETE /api/context/[contextId] error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete context',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

