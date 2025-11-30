import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { inferCompanyXType } from '@/lib/services/companyx-topic-inference'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 1: Type Inference
 * 
 * Takes raw blob → Infers suggested type → Returns type only
 * No DB writes, no parsing, just type inference
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyUnit not set' },
        { status: 401 }
      )
    }

    const { blob } = await request.json()

    if (!blob || typeof blob !== 'string') {
      return NextResponse.json(
        { success: false, error: 'blob is required' },
        { status: 400 }
      )
    }

    // Infer type using hybrid inference service
    const inference = await inferCompanyXType(blob)

    // Map CompanyXType to ingest type
    // Supported: training, career, event, notice, task, other
    let suggestedType: string
    switch (inference.type) {
      case 'training':
        suggestedType = 'training'
        break
      case 'career':
        suggestedType = 'career'
        break
      case 'event':
        suggestedType = 'event'
        break
      case 'impact_event':
        suggestedType = 'notice'
        break
      case 'campaign':
      case 'benefits':
      case 'community':
      case 'employee_cause':
        suggestedType = 'task'
        break
      default:
        suggestedType = 'other'
    }

    return NextResponse.json({
      success: true,
      suggestedType,
    })
  } catch (error: any) {
    console.error('[Type Infer] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to infer type' },
      { status: 500 }
    )
  }
}

