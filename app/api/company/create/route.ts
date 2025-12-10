/**
 * ⚠️ DEPRECATED - COMMENTED OUT
 * 
 * This route incorrectly created CompanyUnit instead of Company.
 * Will be reworked as part of the company create UX redesign.
 * 
 * MVP1 Architecture: Use /api/company-affiliation/save to create Company (HQ) and set string labels.
 */

/*
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company/create
 * 
 * Create CompanyUnit in registry (matches RaceRegistry pattern)
 * Search-before-create to prevent duplicates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Company name is required' },
        { status: 400 },
      )
    }

    const companyName = name.trim()

    // Search-before-create: check if company already exists
    const existing = await prisma.companyUnit.findFirst({
      where: {
        name: {
          equals: companyName,
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        company: existing,
        message: 'Company already exists',
      })
    }

    // Create new CompanyUnit
    const company = await prisma.companyUnit.create({
      data: {
        name: companyName,
      },
    })

    return NextResponse.json({
      success: true,
      company,
    })
  } catch (error: any) {
    console.error('❌ Company create error:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Company with this name already exists' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create company' },
      { status: 500 },
    )
  }
}
*/

// Stub to prevent 404
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'This route has been deprecated. Use /api/company-affiliation/save instead.' },
    { status: 410 }, // 410 Gone
  )
}

