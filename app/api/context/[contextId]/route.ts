import { NextResponse } from 'next/server'
import { getWorkMeId } from '@/lib/getWorkMeId.server'
import { getWorkContext, deleteWorkContext } from '@/lib/actions/work-context'
import { getTypedContext } from '@/lib/actions/typed-contexts'
import {
  updateCampaign,
  updateImpactEvent,
  updateTraining,
  updateEvent,
  updateCommunityOpportunity,
  updateBenefits,
  updateCareer,
  updateEmployeeCause,
} from '@/lib/actions/typed-contexts'

/**
 * GET /api/context/[contextId]
 * Get a single WorkContext with enriched typed data
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> }
) {
  try {
    const { contextId } = await params
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      )
    }

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Context ID is required' },
        { status: 400 },
      )
    }

    // Get WorkContext router entry
    const result = await getWorkContext(contextId)

    if (!result.success || !result.workContext) {
      return NextResponse.json(
        { success: false, error: result.error || 'Context not found' },
        { status: 404 },
      )
    }

    const workContext = result.workContext

    // Enrich with typed data
    const typedResult = await getTypedContext({
      type: workContext.type,
      typeRefId: workContext.typeRefId,
    })

    if (!typedResult.success) {
      return NextResponse.json(
        { success: false, error: typedResult.error || 'Failed to fetch typed context' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      workContext: {
        ...workContext,
        typedData: typedResult.data,
        title: typedResult.title,
      },
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
 * Update a WorkContext's typed data
 * 
 * Body: { ...typedContextData }
 * Updates the typed model, not the router entry
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> }
) {
  try {
    const { contextId } = await params
    const workMeId = await getWorkMeId()
    const body = await request.json()

    if (!workMeId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      )
    }

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Context ID is required' },
        { status: 400 },
      )
    }

    // Get WorkContext to find type and typeRefId
    const workContextResult = await getWorkContext(contextId)

    if (!workContextResult.success || !workContextResult.workContext) {
      return NextResponse.json(
        { success: false, error: 'Context not found' },
        { status: 404 },
      )
    }

    const workContext = workContextResult.workContext

    // Update the typed model based on type
    let result
    switch (workContext.type) {
      case 'campaign':
        result = await updateCampaign(contextId, body)
        break
      
      case 'impact_event':
        result = await updateImpactEvent(contextId, body)
        break
      
      case 'training':
        result = await updateTraining(contextId, body)
        break
      
      case 'event':
        result = await updateEvent(contextId, body)
        break
      
      case 'community':
        result = await updateCommunityOpportunity(contextId, body)
        break
      
      case 'benefits':
        result = await updateBenefits(contextId, body)
        break
      
      case 'career':
        result = await updateCareer(contextId, body)
        break
      
      case 'employee_cause':
        result = await updateEmployeeCause(contextId, body)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown context type' },
          { status: 400 },
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update context' },
        { status: 400 },
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ PUT /api/context/[contextId] error:', error)
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
 * Delete a WorkContext and its typed data
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> }
) {
  try {
    const { contextId } = await params
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      )
    }

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Context ID is required' },
        { status: 400 },
      )
    }

    const result = await deleteWorkContext(contextId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete context' },
        { status: 400 },
      )
    }

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

