import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { enrichCompanyApollo } from '@/lib/external/apolloClient'
import { createEmployee } from '@/lib/employee/service'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/employee/enrich-from-apollo
 * 
 * Enrich/create employee from Apollo data
 * Similar to company enrichment - ingest, store
 * 
 * Body: {
 *   fullName: string,
 *   role?: string, // Optional role enum to filter Apollo results
 *   companyName?: string // Optional - uses user's company if not provided
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)

    if (!workMe.companyId) {
      return NextResponse.json(
        { success: false, error: 'User must belong to a company' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { fullName, role, companyName } = body

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'fullName is required' },
        { status: 400 }
      )
    }

    // 2. Get company name (use provided or fetch from database)
    let companyNameToEnrich = companyName
    if (!companyNameToEnrich) {
      const company = await prisma.company.findUnique({
        where: { id: workMe.companyId },
        select: { name: true },
      })
      companyNameToEnrich = company?.name
    }

    if (!companyNameToEnrich) {
      return NextResponse.json(
        { success: false, error: 'Company name is required for Apollo enrichment' },
        { status: 400 }
      )
    }

    // 3. Enrich from Apollo
    let apolloData
    try {
      apolloData = await enrichCompanyApollo(companyNameToEnrich)
    } catch (error: any) {
      console.error('❌ Apollo enrichment error:', error)
      return NextResponse.json(
        { success: false, error: `Apollo enrichment failed: ${error.message}` },
        { status: 500 }
      )
    }

    // 4. Find matching person in Apollo data
    const allPeople = [
      ...(apolloData.company?.employees || []),
      ...(apolloData.people || []),
    ]

    // Search for person by name (fuzzy match)
    const nameParts = fullName.toLowerCase().split(/\s+/)
    const matchingPerson = allPeople.find((person) => {
      const personName = (person.name || `${person.first_name || ''} ${person.last_name || ''}`).toLowerCase()
      return nameParts.every(part => personName.includes(part))
    })

    if (!matchingPerson) {
      return NextResponse.json(
        { success: false, error: `Person "${fullName}" not found in Apollo data for ${companyNameToEnrich}` },
        { status: 404 }
      )
    }

    // 5. Create or update employee from Apollo data
    const apolloFullName = matchingPerson.name || `${matchingPerson.first_name || ''} ${matchingPerson.last_name || ''}`.trim()
    const apolloTitle = matchingPerson.title || null
    const apolloEmail = null // Apollo doesn't provide email in this endpoint
    const apolloPhone = null

    // Check if employee already exists
    let employee = await prisma.companyEmployee.findFirst({
      where: {
        companyId: workMe.companyId,
        fullName: {
          equals: apolloFullName,
          mode: 'insensitive',
        },
      },
    })

    if (employee) {
      // Update existing employee with Apollo data
      employee = await prisma.companyEmployee.update({
        where: { id: employee.id },
        data: {
          title: apolloTitle || employee.title,
          // Don't overwrite email/phone if they exist
        },
      })
    } else {
      // Create new employee
      employee = await createEmployee({
        fullName: apolloFullName,
        title: apolloTitle,
        email: apolloEmail,
        phone: apolloPhone,
      })
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        title: employee.title,
        email: employee.email,
        companyUnit: employee.companyUnit,
      },
      apolloData: {
        title: apolloTitle,
        employmentHistory: matchingPerson.employment_history || [],
        seniority: matchingPerson.seniority,
        department: matchingPerson.department,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/employee/enrich-from-apollo error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to enrich employee from Apollo',
      },
      { status: 500 }
    )
  }
}


