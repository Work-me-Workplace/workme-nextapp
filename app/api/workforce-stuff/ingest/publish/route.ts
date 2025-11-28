import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getParsedCompanyX, deleteWorkstuffKeys } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import type { ContextType } from '@/lib/types/context-type'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * PUBLISH: Finalize parsing and create CompanyX model
 * Deletes all Redis keys and returns final CompanyX item
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth.workMeId || !auth.companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { workMeId, companyId } = auth

    const { companyXId } = await request.json()

    // Get final parsed data
    const parsedData = await getParsedCompanyX(workMeId)
    if (!parsedData) {
      return NextResponse.json(
        { success: false, error: 'No parsed data found' },
        { status: 404 }
      )
    }

    const type = parsedData.type as ContextType
    const data = parsedData.data

    // Create CompanyX model
    const modelMap: Record<ContextType, string> = {
      event: 'companyEvent',
      training: 'companyTraining',
      campaign: 'companyCampaign',
      impact_event: 'companyImpactEvent',
      community: 'companyCommunity',
      benefits: 'companyBenefits',
      career: 'companyCareer',
      employee_cause: 'companyEmployeeCause',
    }

    const modelName = modelMap[type]
    if (!modelName) {
      throw new Error(`Unknown type: ${type}`)
    }

    const model = (prisma as any)[modelName]

    // Create the CompanyX model
    const companyX = await model.create({
      data: {
        ...data,
        companyId,
        originatorId: workMeId,
      },
    })

    // Delete all Redis keys
    await deleteWorkstuffKeys(workMeId)

    return NextResponse.json({
      success: true,
      companyX: {
        id: companyX.id,
        type,
        ...companyX,
      },
    })
  } catch (error: any) {
    console.error('[Publish] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish' },
      { status: 500 }
    )
  }
}

