import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company-affiliation/save
 * 
 * MVP1 Architecture: Save company affiliation using companyId (FK) and string labels.
 * - companyId: FK to Company (required for org identity)
 * - companyUnit: Optional string label
 * - division: Optional string label
 * 
 * No CompanyUnit or DivisionUnit models - just strings.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, unitName, divisionName } = body

    // Auth required
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    let companyId: string | null = null
    let companyUnit: string | null = null
    let division: string | null = null

    // 1. Company (HQ) - search or create (required for companyId)
    if (companyName && typeof companyName === 'string' && companyName.trim()) {
      const normalizedCompanyName = companyName.trim()
      
      // Search for existing Company
      let company = await prisma.company.findFirst({
        where: {
          name: {
            equals: normalizedCompanyName,
            mode: 'insensitive',
          },
        },
      })

      // If not found, create it
      if (!company) {
        company = await prisma.company.create({
          data: {
            name: normalizedCompanyName,
          },
        })
        console.log('[CompanyAffiliation] Company created:', company.id)
      } else {
        console.log('[CompanyAffiliation] Company found:', company.id)
      }

      companyId = company.id
    }

    // 2. Company Unit - just store as string label (no model lookup)
    if (unitName && typeof unitName === 'string' && unitName.trim()) {
      companyUnit = unitName.trim()
    }

    // 3. Division - just store as string label (no model lookup)
    if (divisionName && typeof divisionName === 'string' && divisionName.trim()) {
      division = divisionName.trim()
    }

    // 4. Update WorkMe with companyId (FK) and string labels
    const updatedWorkMe = await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        companyId: companyId || workMe.companyId, // Preserve existing if not provided
        companyUnit: companyUnit !== undefined ? companyUnit : workMe.companyUnit,
        division: division !== undefined ? division : workMe.division,
      },
      include: {
        Company: { 
          select: { id: true, name: true } 
        },
      },
    })

    console.log('[CompanyAffiliation] WorkMe updated:', {
      workMeId,
      companyId: updatedWorkMe.companyId,
      companyUnit: updatedWorkMe.companyUnit,
      division: updatedWorkMe.division,
    })

    return NextResponse.json({ 
      success: true,
      workMe: {
        id: updatedWorkMe.id,
        companyId: updatedWorkMe.companyId,
        companyUnit: updatedWorkMe.companyUnit,
        division: updatedWorkMe.division,
        company: updatedWorkMe.Company,
      },
      message: 'Company affiliation saved successfully',
    })
  } catch (error: any) {
    console.error('[CompanyAffiliation] Error:', error)
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
        companyUnit: true,
        division: true,
        Company: { 
          select: { id: true, name: true } 
        },
      },
    })

    return NextResponse.json({
      success: true,
      companyAffiliation: workMeWithCompany ? {
        companyId: workMeWithCompany.companyId,
        companyUnit: workMeWithCompany.companyUnit,
        division: workMeWithCompany.division,
        company: workMeWithCompany.Company,
      } : null,
    })
  } catch (error: any) {
    console.error('[CompanyAffiliation] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get company affiliation' },
      { status: 500 },
    )
  }
}
