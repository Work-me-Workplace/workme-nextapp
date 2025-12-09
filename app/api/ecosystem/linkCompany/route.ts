/**
 * POST /api/ecosystem/linkCompany
 * 
 * Link an EcosystemPerson to an EcosystemCompany
 * 
 * Body: {
 *   personId: string
 *   companyId: string
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)

    const body = await request.json()
    const { personId, companyId } = body

    if (!personId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'personId and companyId are required' },
        { status: 400 }
      )
    }

    // Verify person exists and is in user's contacts
    const person = await prisma.ecosystemPerson.findUnique({
      where: { id: personId },
    })

    if (!person) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      )
    }

    const contact = await prisma.myEcosystemContact.findUnique({
      where: {
        workMeId_personId: {
          workMeId: workMe.id,
          personId: person.id,
        },
      },
    })

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Person not in your contacts' },
        { status: 403 }
      )
    }

    // Verify company exists
    const company = await prisma.ecosystemCompany.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    // Link person to company
    const updatedPerson = await prisma.ecosystemPerson.update({
      where: { id: personId },
      data: {
        companyId: companyId,
        companyName: company.name, // Also update companyName for backward compatibility
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json({
      success: true,
      person: updatedPerson,
    })
  } catch (error: any) {
    console.error('❌ POST /api/ecosystem/linkCompany error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to link company' },
      { status: 500 }
    )
  }
}

