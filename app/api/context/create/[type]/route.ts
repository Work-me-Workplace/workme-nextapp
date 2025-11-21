import { NextResponse } from 'next/server'
import { getWorkMeId } from '@/lib/getWorkMeId.server'
import {
  createCampaign,
  createImpactEvent,
  createTraining,
  createEvent,
  createCommunityOpportunity,
  createBenefits,
  createCareer,
  createEmployeeCause,
} from '@/lib/actions/typed-contexts'

const VALID_TYPES = [
  'campaign',
  'impact_event',
  'training',
  'event',
  'community',
  'benefits',
  'career',
  'employee_cause',
] as const

type ContextType = typeof VALID_TYPES[number]

/**
 * POST /api/context/create/[type]
 * Create a new typed context
 * 
 * Examples:
 * - POST /api/context/create/campaign
 * - POST /api/context/create/event
 * - POST /api/context/create/training
 * 
 * Body: { ...typedContextData }
 * Returns: { success: true, campaign/event/etc, workContext }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    const workMeId = await getWorkMeId()
    const body = await request.json()

    if (!workMeId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      )
    }

    if (!type || !VALID_TYPES.includes(type as ContextType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid context type. Must be one of: ${VALID_TYPES.join(', ')}` 
        },
        { status: 400 },
      )
    }

    let result

    switch (type as ContextType) {
      case 'campaign':
        result = await createCampaign(body, workMeId)
        break
      
      case 'impact_event':
        result = await createImpactEvent(body)
        break
      
      case 'training':
        result = await createTraining(body)
        break
      
      case 'event':
        result = await createEvent(body)
        break
      
      case 'community':
        result = await createCommunityOpportunity(body)
        break
      
      case 'benefits':
        result = await createBenefits(body)
        break
      
      case 'career':
        result = await createCareer(body)
        break
      
      case 'employee_cause':
        result = await createEmployeeCause(body)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown context type' },
          { status: 400 },
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create context' },
        { status: 400 },
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ POST /api/context/create/[type] error:', error)
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

