import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Auth - get workMeId and companyId
    const auth = await requireWorkMeAuth(request)
    const workMe = await prisma.workMe.findUnique({
      where: { id: auth.id },
      select: { companyId: true },
    })

    if (!workMe?.companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required. Please set your company affiliation.' },
        { status: 400 }
      )
    }

    const {
      name,
      category,
      platformSeries,
      description,
      whySpecial,
      payloadNotes,
      intendedTotalUnits,
      knownShipsInClass,
      classStartDate,
    } = await request.json()

    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: 'Name and category are required' },
        { status: 400 }
      )
    }

    const product = await prisma.companyPlatformProduct.create({
      data: {
        companyId: workMe.companyId,
        workMeId: auth.id,
        name,
        category,
        platformSeries: platformSeries || null,
        description: description || null,
        whySpecial: whySpecial || null,
        payloadNotes: payloadNotes || null,
        intendedTotalUnits: intendedTotalUnits || null,
        knownShipsInClass: Array.isArray(knownShipsInClass) ? knownShipsInClass : [],
        classStartDate: classStartDate ? new Date(classStartDate) : null,
      },
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('Failed to create platform product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
