import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface BenefitsSaveRequest {
  benefitsId: string
  title: string | null
  description: string | null
  employeeBenefitSummary: string | null
  windowStart: string | null // ISO date string
  windowEnd: string | null // ISO date string
  actionLink: string | null
  deadlines: Array<{ label: string; date: string }> | null
  resources: Record<string, any> | null
  pocList: Array<{
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    department?: string | null
  }> | null
}

/**
 * STAGE 2 SAVE: Finalize Benefits Entry
 * 
 * Updates ALL real benefits fields
 * Does NOT overwrite ingest fields (ingestRawText)
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Benefits record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const data: BenefitsSaveRequest = await request.json()

    if (!data.benefitsId) {
      return NextResponse.json(
        { success: false, error: 'benefitsId is required' },
        { status: 400 }
      )
    }

    // Verify benefits exists
    const existing = await prisma.companyBenefits.findUnique({
      where: {
        id: data.benefitsId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Benefits not found' },
        { status: 404 }
      )
    }

    // Update ALL benefits fields to match the model
    // DO NOT overwrite ingest fields
    const updated = await prisma.companyBenefits.update({
      where: { id: data.benefitsId },
      data: {
        // Core
        title: data.title || 'Untitled Benefits',
        description: data.description,
        employeeBenefitSummary: data.employeeBenefitSummary,
        
        // Dates
        windowStart: data.windowStart ? new Date(data.windowStart) : null,
        windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
        
        // Links / Resources
        actionLink: data.actionLink,
        deadlines: data.deadlines ? data.deadlines as any : undefined,
        resources: data.resources ? data.resources as any : undefined,
        pocList: data.pocList ? data.pocList as any : undefined,

        // ingestRawText remains unchanged
      },
    })

    return NextResponse.json({
      success: true,
      benefitsId: updated.id,
      benefits: updated,
    })
  } catch (error: any) {
    console.error('[Benefits Save] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save benefits' },
      { status: 500 }
    )
  }
}
