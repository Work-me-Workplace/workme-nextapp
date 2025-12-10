import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, description, impactArea, maturityLevel, demoStatus, partners, benefits } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const product = await prisma.companyProductInnovation.create({
      data: {
        name,
        description: description || null,
        impactArea: impactArea || null,
        maturityLevel: maturityLevel || null,
        demoStatus: demoStatus || null,
        partners: Array.isArray(partners) ? partners : [],
        benefits: Array.isArray(benefits) ? benefits : [],
      },
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('Failed to create innovation product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
