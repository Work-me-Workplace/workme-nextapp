import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, location, contractorType, capabilities, constraints, productionRate, notes } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const product = await prisma.companyProductCapacity.create({
      data: {
        name,
        location: location || null,
        contractorType: contractorType || null,
        capabilities: Array.isArray(capabilities) ? capabilities : [],
        constraints: Array.isArray(constraints) ? constraints : [],
        productionRate: productionRate || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('Failed to create capacity product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
