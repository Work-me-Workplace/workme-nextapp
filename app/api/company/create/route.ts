import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company/create
 * 
 * Create a new company with minimal required fields:
 * - name (required)
 * - city (optional)
 * - state (optional)
 * - industry (optional)
 * 
 * Returns the created company with its unique ID
 * 
 * Body: { name: string, city?: string, state?: string, industry?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, city, state, industry } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 },
      )
    }

    const normalizedName = name.trim()

    // Check if company with this name already exists (case-insensitive)
    const existing = await prisma.company.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        company: {
          id: existing.id,
          name: existing.name,
          city: existing.city,
          state: existing.state,
          industry: existing.industry,
        },
        message: 'Company already exists',
      })
    }

    // Create new company with minimal fields
    const company = await prisma.company.create({
      data: {
        name: normalizedName,
        city: city?.trim() || null,
        state: state?.trim() || null,
        industry: industry?.trim() || null,
      },
    })

    console.log('✅ Company created:', company.id)

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        city: company.city,
        state: company.state,
        industry: company.industry,
      },
    })
  } catch (error: any) {
    console.error('❌ CompanyCreate error:', error)
    
    // Handle unique constraint violation (name must be unique)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A company with this name already exists' },
        { status: 409 },
      )
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create company' },
      { status: 500 },
    )
  }
}

