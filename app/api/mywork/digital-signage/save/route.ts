import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { DigitalSignType } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface SaveDigitalSignageRequest {
  signType: DigitalSignType
  companyUnit?: string
  signageId?: string // If provided, update existing; otherwise create new
  workforceAchievement?: {
    headline: string
    subhead?: string | null
    factualStatement?: string | null
    quote?: string | null
    quoteAttribution?: string | null
    runtimeGuidance?: string | null
    imageAssetId?: string | null
    employeeId?: string | null
    highlightId?: string | null
  }
}

/**
 * POST /api/mywork/digital-signage/save
 * 
 * Step 5: Save Digital Signage (create or update)
 * 
 * If signageId provided → update existing
 * If not → create new
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkMeAuth(request)
    const body: SaveDigitalSignageRequest = await request.json()
    const { signType, companyUnit, signageId, workforceAchievement } = body

    // Validate sign type
    if (!signType || !Object.values(DigitalSignType).includes(signType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signType' },
        { status: 400 }
      )
    }

    // Validate workforceAchievement data
    if (signType === DigitalSignType.WORKFORCE_ACHIEVEMENT) {
      if (!workforceAchievement || !workforceAchievement.headline) {
        return NextResponse.json(
          { success: false, error: 'workforceAchievement with headline is required' },
          { status: 400 }
        )
      }
    }

    // If signageId provided, update existing
    if (signageId) {
      // Check if signage exists and belongs to user
      const existing = await prisma.productDigitalSign.findUnique({
        where: { id: signageId },
        include: {
          workforceAchievement: true,
        }
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Signage not found' },
          { status: 404 }
        )
      }

      if (existing.createdByWorkMeId !== auth.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        )
      }

      // Update the signage
      const updated = await prisma.productDigitalSign.update({
        where: { id: signageId },
        data: {
          companyUnit: companyUnit || existing.companyUnit,
          ...(signType === DigitalSignType.WORKFORCE_ACHIEVEMENT && workforceAchievement && {
            workforceAchievement: {
              upsert: {
                create: {
                  headline: workforceAchievement.headline,
                  subhead: workforceAchievement.subhead || null,
                  factualStatement: workforceAchievement.factualStatement || null,
                  quote: workforceAchievement.quote || null,
                  quoteAttribution: workforceAchievement.quoteAttribution || null,
                  runtimeGuidance: workforceAchievement.runtimeGuidance || '2 weeks',
                  imageAssetId: workforceAchievement.imageAssetId || null,
                  employeeId: workforceAchievement.employeeId || null,
                  highlightId: workforceAchievement.highlightId || null,
                },
                update: {
                  headline: workforceAchievement.headline,
                  subhead: workforceAchievement.subhead || null,
                  factualStatement: workforceAchievement.factualStatement || null,
                  quote: workforceAchievement.quote || null,
                  quoteAttribution: workforceAchievement.quoteAttribution || null,
                  runtimeGuidance: workforceAchievement.runtimeGuidance || '2 weeks',
                  imageAssetId: workforceAchievement.imageAssetId || null,
                  employeeId: workforceAchievement.employeeId || null,
                  highlightId: workforceAchievement.highlightId || null,
                },
              }
            }
          }),
        },
        include: {
          workforceAchievement: true,
        }
      })

      return NextResponse.json({
        success: true,
        signage: updated,
      })
    } else {
      // Create new signage
      const signage = await prisma.productDigitalSign.create({
        data: {
          signType,
          companyUnit: companyUnit || null,
          createdByWorkMeId: auth.id,
          ...(signType === DigitalSignType.WORKFORCE_ACHIEVEMENT && workforceAchievement && {
            workforceAchievement: {
              create: {
                headline: workforceAchievement.headline,
                subhead: workforceAchievement.subhead || null,
                factualStatement: workforceAchievement.factualStatement || null,
                quote: workforceAchievement.quote || null,
                quoteAttribution: workforceAchievement.quoteAttribution || null,
                runtimeGuidance: workforceAchievement.runtimeGuidance || '2 weeks',
                imageAssetId: workforceAchievement.imageAssetId || null,
                employeeId: workforceAchievement.employeeId || null,
                highlightId: workforceAchievement.highlightId || null,
              }
            }
          }),
        },
        include: {
          workforceAchievement: true,
        }
      })

      return NextResponse.json({
        success: true,
        signage,
      })
    }
  } catch (error: any) {
    console.error('❌ POST /api/mywork/digital-signage/save error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save digital signage',
      },
      { status: 500 }
    )
  }
}
