import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getParsedCompanyX, storeParsedCompanyX, getPendingFieldGroups, storePendingFieldGroups } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import type { ContextType } from '@/lib/types/context-type'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * LAYER 2: PROGRESSIVE PARSER (Step-by-Step)
 * 
 * Handles field group parsing, validation, and upsert
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

    const { fieldGroup, fieldData, companyXId, type } = await request.json()

    if (!fieldGroup || !fieldData || !type) {
      return NextResponse.json(
        { success: false, error: 'fieldGroup, fieldData, and type are required' },
        { status: 400 }
      )
    }

    // Get current parsed data from Redis
    let parsedData = await getParsedCompanyX(workMeId)
    if (!parsedData) {
      // Initialize if doesn't exist
      parsedData = {
        type: type as ContextType,
        data: {},
        fieldGroups: {
          core: { status: 'pending' },
          scheduling: { status: 'pending' },
          audience: { status: 'pending' },
          metadata: { status: 'pending' },
          attachments: { status: 'pending' },
        },
      }
    }

    // Update the field group with new data
    parsedData.data = {
      ...parsedData.data,
      ...fieldData,
    }

    parsedData.fieldGroups[fieldGroup] = {
      status: 'completed',
      completedAt: new Date().toISOString(),
      data: fieldData,
    }

    // Save back to Redis
    await storeParsedCompanyX(workMeId, parsedData)

    // If companyXId provided, upsert to Prisma
    if (companyXId) {
      await upsertCompanyX(companyXId, type as ContextType, parsedData.data, companyId, workMeId)
    }

    // Update pending field groups
    const pending = await getPendingFieldGroups(workMeId)
    const updatedPending = pending.filter((g: string) => g !== fieldGroup)
    await storePendingFieldGroups(workMeId, updatedPending)

    return NextResponse.json({
      success: true,
      parsedData,
      pending: updatedPending,
    })
  } catch (error: any) {
    console.error('[Progressive Parser] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse field group' },
      { status: 500 }
    )
  }
}

/**
 * Upsert CompanyX model to Prisma
 */
async function upsertCompanyX(
  companyXId: string | null,
  type: ContextType,
  data: any,
  companyId: string,
  workMeId: string
) {
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

  if (companyXId) {
    // Update existing
    await model.update({
      where: { id: companyXId },
      data: {
        ...data,
        companyId,
      },
    })
  } else {
    // Create new
    await model.create({
      data: {
        ...data,
        companyId,
      },
    })
  }
}

/**
 * GET: Retrieve current parsing state
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth.workMeId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { workMeId } = auth

    const parsedData = await getParsedCompanyX(workMeId)
    const pending = await getPendingFieldGroups(workMeId)

    return NextResponse.json({
      success: true,
      parsedData,
      pending,
    })
  } catch (error: any) {
    console.error('[Progressive Parser GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get parsing state' },
      { status: 500 }
    )
  }
}

