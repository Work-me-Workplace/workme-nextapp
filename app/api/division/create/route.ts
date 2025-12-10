/**
 * ⚠️ DEPRECATED - COMMENTED OUT
 * 
 * This route referenced the deleted DivisionUnit model.
 * Will be reworked as part of the company create UX redesign.
 * 
 * MVP1 Architecture: division is now a string label on WorkMe,
 * not a separate model. Use /api/company-affiliation/save instead.
 */

/*
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/division/create
 * 
 * Create DivisionUnit in registry (matches RaceRegistry pattern)
 * Search-before-create to prevent duplicates within a CompanyUnit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, companyUnitId } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Division name is required' },
        { status: 400 },
      )
    }

    if (!companyUnitId || typeof companyUnitId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'companyUnitId is required' },
        { status: 400 },
      )
    }

    const divisionName = name.trim()

    // Verify CompanyUnit exists
    const company = await prisma.companyUnit.findUnique({
      where: { id: companyUnitId },
    })

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 },
      )
    }

    // Search-before-create: check if division already exists in this company
    const existing = await prisma.divisionUnit.findFirst({
      where: {
        companyUnitId,
        name: {
          equals: divisionName,
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        divisionUnit: existing, // Match frontend expectation
        division: existing, // Also include for backward compatibility
        message: 'Division already exists in this company',
      })
    }

    // Create new DivisionUnit
    const division = await prisma.divisionUnit.create({
      data: {
        name: divisionName,
        companyUnitId,
      },
    })

    return NextResponse.json({
      success: true,
      divisionUnit: division, // Match frontend expectation
      division, // Also include for backward compatibility
    })
  } catch (error: any) {
    console.error('❌ Division create error:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Division with this name already exists in this company' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create division' },
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

