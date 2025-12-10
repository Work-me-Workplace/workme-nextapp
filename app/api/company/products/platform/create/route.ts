import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, category, programCode, description, whySpecial } = await request.json()

    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: 'Name and category are required' },
        { status: 400 }
      )
    }

    const product = await prisma.companyPlatformProduct.create({
      data: {
        name,
        category,
        programCode: programCode || null,
        description: description || null,
        whySpecial: whySpecial || null,
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
