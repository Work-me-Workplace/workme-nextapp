import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/company/[id]
 * 
 * Get company details by ID
 * Public endpoint - no auth required for reading company info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 },
      )
    }

    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        industry: true,
        website: true,
        description: true,
      },
    })

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      company,
    })
  } catch (error: any) {
    console.error('❌ CompanyGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get company' },
      { status: 500 },
    )
  }
}

