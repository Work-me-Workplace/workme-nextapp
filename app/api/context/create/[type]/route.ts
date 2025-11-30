import { NextResponse } from 'next/server'
import type { ContextType } from '@/lib/types/context-type'
import { createTypedContext } from '@/lib/server/context-factory'
import { SCHEMA_MAP } from '@/lib/server/context-schemas'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { loadMembership } from '@/lib/auth/loadMembership'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const VALID_TYPES: ContextType[] = [
  'campaign',
  'impact_event',
  'training',
  'event',
  'community',
  'benefits',
  'career',
  'employee_cause',
]

/**
 * POST /api/context/create/[type]
 * Create a new typed context using factory pattern
 * 
 * Examples:
 * - POST /api/context/create/campaign
 * - POST /api/context/create/event
 * - POST /api/context/create/training
 * 
 * Body: { ...typedContextData } (validated against schema)
 * Returns: { success: true, typed, router }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)

    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { type } = await params
    const body = await request.json()

    // 3. Determine companyUnit from request body or use default
    const companyUnit = body.companyUnit || workMe.companyUnit
    const companyDivision = body.companyDivision || workMe.companyDivision

    if (!companyUnit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'companyUnit is required. Provide in request body or set as default in profile.' 
        },
        { status: 400 },
      )
    }

    // 4. Load membership & verify access
    const membership = await loadMembership(workMeId, companyUnit)

    console.log('[API POST /api/context/create/[type]]', {
      type,
      payload: body,
      workMeId,
      companyUnit,
      companyDivision,
      role: membership.role,
    })

    // Validate type
    if (!type || !VALID_TYPES.includes(type as ContextType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid context type. Must be one of: ${VALID_TYPES.join(', ')}` 
        },
        { status: 400 },
      )
    }

    // Get schema for validation
    const schema = SCHEMA_MAP[type as keyof typeof SCHEMA_MAP]
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

    // Validate companyUnit is set
    if (!companyUnit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User must set a companyUnit before creating work items' 
        },
        { status: 400 },
      )
    }

    // Create using factory (includes transaction)
    const result = await createTypedContext(type as ContextType, cleanData, workMeId, companyUnit, companyDivision)

    console.log('[API POST /api/context/create/[type]] SUCCESS', {
      type,
      typedId: result.typed.id,
    })

    return NextResponse.json({
      success: true,
      typed: result.typed,
    })
  } catch (error: any) {
    console.error('❌ POST /api/context/create/[type] error:', error)
    
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
        error: error.message || 'Failed to create context',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

