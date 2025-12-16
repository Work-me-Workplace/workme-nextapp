import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params
    const livingHomage = await request.json()

    if (!livingHomage || !livingHomage.fullName) {
      return NextResponse.json(
        { success: false, error: 'Living homage fullName is required' },
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

    // Upsert living homage (unique constraint on platformUnitId)
    const createdLivingHomage = await prisma.companyPlatformUnitLivingHomage.upsert({
      where: { platformUnitId: unitId },
      update: {
        fullName: livingHomage.fullName,
        role: livingHomage.role || undefined,
        relation: livingHomage.relation || undefined,
        notes: livingHomage.notes || undefined,
      },
      create: {
        platformUnitId: unitId,
        fullName: livingHomage.fullName,
        role: livingHomage.role || undefined,
        relation: livingHomage.relation || undefined,
        notes: livingHomage.notes || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      livingHomage: createdLivingHomage,
    })
  } catch (error: any) {
    console.error('Failed to create/update living homage:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create living homage' },
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

    const livingHomage = await prisma.companyPlatformUnitLivingHomage.findUnique({
      where: { platformUnitId: unitId },
    })

    return NextResponse.json({
      success: true,
      livingHomage: livingHomage || null,
    })
  } catch (error: any) {
    console.error('Failed to get living homage:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get living homage' },
      { status: 500 }
    )
  }
}
