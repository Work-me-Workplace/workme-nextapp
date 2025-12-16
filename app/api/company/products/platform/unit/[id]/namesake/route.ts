import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params
    const namesake = await request.json()

    if (!namesake || !namesake.fullName) {
      return NextResponse.json(
        { success: false, error: 'Namesake fullName is required' },
        { status: 400 }
      )
    }

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

    // Upsert namesake (unique constraint on platformUnitId)
    const createdNamesake = await prisma.companyPlatformUnitNamesake.upsert({
      where: { platformUnitId: unitId },
      update: {
        fullName: namesake.fullName,
        knownAs: namesake.knownAs || undefined,
        role: namesake.role || undefined,
        whyKnown: namesake.whyKnown || undefined,
        legacySummary: namesake.legacySummary || undefined,
        era: namesake.era || undefined,
        honors: namesake.honors || [],
        notes: namesake.notes || undefined,
      },
      create: {
        platformUnitId: unitId,
        fullName: namesake.fullName,
        knownAs: namesake.knownAs || undefined,
        role: namesake.role || undefined,
        whyKnown: namesake.whyKnown || undefined,
        legacySummary: namesake.legacySummary || undefined,
        era: namesake.era || undefined,
        honors: namesake.honors || [],
        notes: namesake.notes || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      namesake: createdNamesake,
    })
  } catch (error: any) {
    console.error('Failed to create/update namesake:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create namesake' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params

    const namesake = await prisma.companyPlatformUnitNamesake.findUnique({
      where: { platformUnitId: unitId },
    })

    return NextResponse.json({
      success: true,
      namesake: namesake || null,
    })
  } catch (error: any) {
    console.error('Failed to get namesake:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get namesake' },
      { status: 500 }
    )
  }
}
