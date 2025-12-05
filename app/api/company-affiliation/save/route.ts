import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company-affiliation/save
 * 
 * Save company and division to CompanyAffiliation module
 * Do NOT write to WorkMe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, unitName, divisionName, companyUnitId, divisionUnitId } = body

    // Handle new simple 3-field format
    if (companyName !== undefined || unitName !== undefined || divisionName !== undefined) {
      // Auth required for saving affiliation
      const { firebaseId } = await verifyAuth(request as Request)
      const workMe = await loadWorkMe(firebaseId)
      const { id: workMeId } = workMe

      const results: any = {}

      // 1. Company HQ (CompanyRegistry) - search or create
      if (companyName && typeof companyName === 'string' && companyName.trim()) {
        const normalizedHQName = companyName.trim()
        
        // Search for existing CompanyRegistry
        let companyHQ = await prisma.companyRegistry.findFirst({
          where: {
            name: {
              equals: normalizedHQName,
              mode: 'insensitive',
            },
          },
        })

        // If not found, create it
        if (!companyHQ) {
          companyHQ = await prisma.companyRegistry.create({
            data: {
              name: normalizedHQName,
            },
          })
          console.log('✅ CompanyRegistry (HQ) created:', companyHQ.id)
        } else {
          console.log('✅ CompanyRegistry (HQ) found:', companyHQ.id)
        }

        results.companyHQ = {
          id: companyHQ.id,
          name: companyHQ.name,
        }
      }

      // 2. Company Unit (CompanyUnit) - search or create
      if (unitName && typeof unitName === 'string' && unitName.trim()) {
        const normalizedUnitName = unitName.trim()
        
        // Search for existing CompanyUnit
        let companyUnit = await prisma.companyUnit.findFirst({
          where: {
            name: {
              equals: normalizedUnitName,
              mode: 'insensitive',
            },
          },
        })

        // If not found, create it
        if (!companyUnit) {
          companyUnit = await prisma.companyUnit.create({
            data: {
              name: normalizedUnitName,
            },
          })
          console.log('✅ CompanyUnit created:', companyUnit.id)
        } else {
          console.log('✅ CompanyUnit found:', companyUnit.id)
        }

        results.companyUnit = {
          id: companyUnit.id,
          name: companyUnit.name,
        }
      }

      // 3. Division (DivisionUnit) - search or create (requires companyUnitId)
      if (divisionName && typeof divisionName === 'string' && divisionName.trim()) {
        if (!results.companyUnit?.id) {
          return NextResponse.json(
            { success: false, error: 'Company Unit is required before creating Division' },
            { status: 400 },
          )
        }

        const normalizedDivisionName = divisionName.trim()
        
        // Search for existing DivisionUnit
        let divisionUnit = await prisma.divisionUnit.findFirst({
          where: {
            name: {
              equals: normalizedDivisionName,
              mode: 'insensitive',
            },
            companyUnitId: results.companyUnit.id,
          },
        })

        // If not found, create it
        if (!divisionUnit) {
          divisionUnit = await prisma.divisionUnit.create({
            data: {
              name: normalizedDivisionName,
              companyUnitId: results.companyUnit.id,
            },
          })
          console.log('✅ DivisionUnit created:', divisionUnit.id)
        } else {
          console.log('✅ DivisionUnit found:', divisionUnit.id)
        }

        results.divisionUnit = {
          id: divisionUnit.id,
          name: divisionUnit.name,
        }
      }

      // 4. Upsert CompanyAffiliation with the resolved IDs
      const companyAffiliation = await prisma.companyAffiliation.upsert({
        where: { workMeId },
        create: {
          workMeId,
          companyUnitId: results.companyUnit?.id || null,
          divisionUnitId: results.divisionUnit?.id || null,
        },
        update: {
          companyUnitId: results.companyUnit?.id || undefined,
          divisionUnitId: results.divisionUnit?.id || undefined,
        },
        include: {
          company: { select: { id: true, name: true } },
          division: { select: { id: true, name: true } },
        },
      })

      return NextResponse.json({ 
        success: true,
        companyHQ: results.companyHQ || null,
        companyUnit: results.companyUnit || null,
        divisionUnit: results.divisionUnit || null,
        companyAffiliation,
        message: 'Affiliation saved successfully',
      })
    }

    // Existing logic for companyUnitId/divisionUnitId format (requires auth)
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    if (!companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'companyUnitId is required' },
        { status: 400 },
      )
    }

    // Upsert CompanyAffiliation (NOT WorkMe)
    const companyAffiliation = await prisma.companyAffiliation.upsert({
      where: { workMeId },
      create: {
        workMeId,
        companyUnitId: companyUnitId || null,
        divisionUnitId: divisionUnitId || null,
      },
      update: {
        companyUnitId: companyUnitId !== undefined ? companyUnitId : undefined,
        divisionUnitId: divisionUnitId !== undefined ? divisionUnitId : undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      companyAffiliation,
    })
  } catch (error: any) {
    console.error('❌ CompanyAffiliationSave error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save company affiliation' },
      { status: 500 },
    )
  }
}

/**
 * GET /api/company-affiliation
 * 
 * Get CompanyAffiliation for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const companyAffiliation = await prisma.companyAffiliation.findUnique({
      where: { workMeId },
      include: {
        company: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      companyAffiliation: companyAffiliation || null,
    })
  } catch (error: any) {
    console.error('❌ CompanyAffiliationGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get company affiliation' },
      { status: 500 },
    )
  }
}

