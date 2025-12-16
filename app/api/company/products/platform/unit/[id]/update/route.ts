import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params
    const update = await request.json()

    // Verify unit exists
    const unit = await prisma.companyPlatformUnit.findUnique({
      where: { id: unitId },
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'Platform unit not found' },
        { status: 404 }
      )
    }

    // Create update
    const createdUpdate = await prisma.companyPlatformUnitUpdate.create({
      data: {
        platformUnitId: unitId,
        statementId: update.statementId || undefined,
        percentComplete: update.percentComplete ?? undefined,
        statusUpdate: update.statusUpdate || undefined,
        scheduleNote: update.scheduleNote || undefined,
        industrialBaseNote: update.industrialBaseNote || undefined,
        leadershipQuote: update.leadershipQuote || undefined,
        keelLaidDate: update.keelLaidDate ? new Date(update.keelLaidDate) : undefined,
        seaTrialsStartDate: update.seaTrialsStartDate ? new Date(update.seaTrialsStartDate) : undefined,
        deliveryDate: update.deliveryDate ? new Date(update.deliveryDate) : undefined,
        commissioningDate: update.commissioningDate ? new Date(update.commissioningDate) : undefined,
        narrativeSummary: update.narrativeSummary || undefined,
        tags: update.tags || [],
      },
    })

    return NextResponse.json({
      success: true,
      update: createdUpdate,
    })
  } catch (error: any) {
    console.error('Failed to create update:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create update' },
      { status: 500 }
    )
  }
}
