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

        // If not found, create it (link to Company HQ if available)
        if (!companyUnit) {
          companyUnit = await prisma.companyUnit.create({
            data: {
              name: normalizedUnitName,
              companyId: results.companyHQ?.id || null, // Link to Company HQ if available
            },
          })
          console.log('✅ CompanyUnit created:', companyUnit.id)
        } else {
          // If Company HQ exists and unit isn't linked, update it
          if (results.companyHQ?.id && !companyUnit.companyId) {
            companyUnit = await prisma.companyUnit.update({
              where: { id: companyUnit.id },
              data: { companyId: results.companyHQ.id },
            })
            console.log('✅ CompanyUnit linked to Company HQ:', companyUnit.id)
          } else {
            console.log('✅ CompanyUnit found:', companyUnit.id)
          }
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

      // 4. Update WorkMe directly with the resolved IDs
      const updatedWorkMe = await prisma.workMe.update({
        where: { id: workMeId },
        data: {
          companyId: results.companyHQ?.id || null,
          companyUnitId: results.companyUnit?.id || null,
          divisionId: results.divisionUnit?.id || null,
        },
        include: {
          company: { select: { id: true, name: true } },
          companyUnit: { select: { id: true, name: true } },
          division: { select: { id: true, name: true } },
        },
      })

      return NextResponse.json({ 
        success: true,
        companyHQ: results.companyHQ || null,
        companyUnit: results.companyUnit || null,
        divisionUnit: results.divisionUnit || null,
        workMe: {
          id: updatedWorkMe.id,
          companyId: updatedWorkMe.companyId,
          companyUnitId: updatedWorkMe.companyUnitId,
          divisionId: updatedWorkMe.divisionId,
          company: updatedWorkMe.company,
          companyUnit: updatedWorkMe.companyUnit,
          division: updatedWorkMe.division,
        },
        message: 'Company affiliation saved successfully',
      })
    }

    // Legacy logic for companyUnitId/divisionUnitId format (requires auth)
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    if (!companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'companyUnitId is required' },
        { status: 400 },
      )
    }

    // Update WorkMe directly
    const updatedWorkMe = await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        companyUnitId: companyUnitId || null,
        divisionId: divisionUnitId || null,
      },
      include: {
        companyUnit: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      workMe: {
        id: updatedWorkMe.id,
        companyUnitId: updatedWorkMe.companyUnitId,
        divisionId: updatedWorkMe.divisionId,
        companyUnit: updatedWorkMe.companyUnit,
        division: updatedWorkMe.division,
      },
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
 * Get company affiliation for current user (from WorkMe)
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const workMeWithCompany = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: {
        id: true,
        companyId: true,
        companyUnitId: true,
        divisionId: true,
        company: { select: { id: true, name: true } },
        companyUnit: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      companyAffiliation: workMeWithCompany ? {
        companyId: workMeWithCompany.companyId,
        companyUnitId: workMeWithCompany.companyUnitId,
        divisionId: workMeWithCompany.divisionId,
        company: workMeWithCompany.company,
        companyUnit: workMeWithCompany.companyUnit,
        division: workMeWithCompany.division,
      } : null,
    })
  } catch (error: any) {
    console.error('❌ CompanyAffiliationGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get company affiliation' },
      { status: 500 },
    )
  }
}

