import { NextResponse } from 'next/server'
import { getCompanyX } from '@/lib/server/get-company-x'
import { updateTypedContext, deleteTypedContext } from '@/lib/server/context-factory'
import { SCHEMA_MAP } from '@/lib/server/context-schemas'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import type { ContextType } from '@/lib/types/context-type'
import { prisma } from '@/lib/prisma'

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
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    const { contextId } = await params

    console.log('[API GET /api/context/[contextId]]', {
      contextId,
      workMeId,
      companyUnit,
      companyDivision,
    })

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Context ID is required' },
        { status: 400 },
      )
    }

    // Search across all CompanyX models to find the one with this ID
    // Since we don't have the type, we need to check all models
    const modelMap: Record<ContextType, string> = {
      campaign: 'companyCampaign',
      impact_event: 'companyImpactEvent',
      training: 'companyTraining',
      event: 'companyEvent',
      community: 'companyCommunity',
      benefits: 'companyBenefits',
      career: 'companyCareer',
      employee_cause: 'companyEmployeeCause',
    }

    let workContext: any = null
    let foundType: ContextType | null = null

    // Validate companyUnit is set
    if (!companyUnit) {
      return NextResponse.json(
        { success: false, error: 'User must set a companyUnit' },
        { status: 400 },
      )
    }

    // Try each model type until we find a match
    for (const [type, modelName] of Object.entries(modelMap) as [ContextType, string][]) {
      const result = await (prisma as any)[modelName].findFirst({
        where: {
          id: contextId,
          companyUnit, // Multi-tenant security
        },
      })
      if (result) {
        workContext = result
        foundType = type
        break
      }
    }

    if (!workContext || !foundType) {
      console.error('[API GET /api/context/[contextId]] ERROR: Context not found', {
        contextId,
      })
      return NextResponse.json(
        { success: false, error: 'Context not found or unauthorized' },
        { status: 404 },
      )
    }

    // Enrich with typed data
    const enriched = await getCompanyX(contextId, foundType, companyUnit)

    console.log('[API GET /api/context/[contextId]] SUCCESS', {
      contextId,
      type: foundType,
      title: enriched?.title,
    })

    return NextResponse.json({
      success: true,
      workContext: enriched,
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
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    const { contextId } = await params
    const body = await request.json()

    console.log('[API PUT /api/context/[contextId]]', {
      contextId,
      payload: body,
      workMeId,
      companyUnit,
      companyDivision,
    })

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Context ID is required' },
        { status: 400 },
      )
    }

    // Search across all CompanyX models to find the one with this ID
    const modelMap: Record<ContextType, string> = {
      campaign: 'companyCampaign',
      impact_event: 'companyImpactEvent',
      training: 'companyTraining',
      event: 'companyEvent',
      community: 'companyCommunity',
      benefits: 'companyBenefits',
      career: 'companyCareer',
      employee_cause: 'companyEmployeeCause',
    }

    // Validate companyUnit is set
    if (!companyUnit) {
      return NextResponse.json(
        { success: false, error: 'User must set a companyUnit' },
        { status: 400 },
      )
    }

    let foundType: ContextType | null = null

    // Try each model type until we find a match
    for (const [type, modelName] of Object.entries(modelMap) as [ContextType, string][]) {
      const result = await (prisma as any)[modelName].findFirst({
        where: {
          id: contextId,
          companyUnit, // Multi-tenant security
        },
      })
      if (result) {
        foundType = type
        break
      }
    }

    if (!foundType) {
      return NextResponse.json(
        { success: false, error: 'Context not found or unauthorized' },
        { status: 404 },
      )
    }

    // Get schema for validation based on context type
    const schema = SCHEMA_MAP[foundType as keyof typeof SCHEMA_MAP]
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
      foundType,
      cleanData,
      workMeId,
      companyUnit
    )

    console.log('[API PUT /api/context/[contextId]] SUCCESS', {
      contextId,
      type: foundType,
      typedId: result.typed.id,
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
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    const { contextId } = await params

    console.log('[API DELETE /api/context/[contextId]]', {
      contextId,
      workMeId,
      companyUnit,
      companyDivision,
    })

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Context ID is required' },
        { status: 400 },
      )
    }

    // Search across all CompanyX models to find the one with this ID
    const modelMap: Record<ContextType, string> = {
      campaign: 'companyCampaign',
      impact_event: 'companyImpactEvent',
      training: 'companyTraining',
      event: 'companyEvent',
      community: 'companyCommunity',
      benefits: 'companyBenefits',
      career: 'companyCareer',
      employee_cause: 'companyEmployeeCause',
    }

    let foundType: ContextType | null = null

    // Try each model type until we find a match
    for (const [type, modelName] of Object.entries(modelMap) as [ContextType, string][]) {
      const result = await (prisma as any)[modelName].findFirst({
        where: {
          id: contextId,
          companyUnit, // Multi-tenant security
          ...(companyDivision && { companyDivision }),
        },
      })
      if (result) {
        foundType = type
        break
      }
    }

    if (!foundType) {
      return NextResponse.json(
        { success: false, error: 'Context not found or unauthorized' },
        { status: 404 },
      )
    }

    // Delete using factory (includes transaction and ownership validation)
    await deleteTypedContext(contextId, foundType, workMeId, companyUnit)

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

