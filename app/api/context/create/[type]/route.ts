import { NextResponse } from 'next/server'
import { ContextType } from '@prisma/client'
import { createTypedContext } from '@/lib/server/context-factory'
import { SCHEMA_MAP } from '@/lib/server/context-schemas'

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
    const { type } = await params
    const body = await request.json()

    console.log('[API POST /api/context/create/[type]]', {
      type,
      payload: body,
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

    // Create using factory (includes transaction)
    const result = await createTypedContext(type as ContextType, cleanData)

    console.log('[API POST /api/context/create/[type]] SUCCESS', {
      type,
      typedId: result.typed.id,
      routerId: result.router.id,
    })

    return NextResponse.json(result)
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

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create context',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

