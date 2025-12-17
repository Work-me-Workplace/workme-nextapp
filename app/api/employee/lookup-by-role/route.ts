import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/employee/lookup-by-role?role=DIRECTOR
 * 
 * Lookup employees by role enum - filters CompanyEmployee by title matching the role
 */
export async function GET(request: NextRequest) {
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

    // 2. Get role query param
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'role query parameter is required' },
        { status: 400 }
      )
    }

    // 3. Map role enum to title search patterns
    const roleTitlePatterns: Record<string, string[]> = {
      'SES': ['ses', 'senior executive service'],
      'DIRECTOR': ['director'],
      'DEPUTY_DIRECTOR': ['deputy director'],
      'EXECUTIVE_DIRECTOR': ['executive director'],
      'CHIEF': ['chief'],
      'DEPUTY_CHIEF': ['deputy chief'],
      'COMMANDER': ['commander'],
      'DEPUTY_COMMANDER': ['deputy commander'],
      'OTHER': [],
    }

    const patterns = roleTitlePatterns[role] || []

    // 4. Query employees matching role patterns
    let employees = []
    
    if (patterns.length > 0) {
      // Build OR conditions for title matching
      const titleConditions = patterns.map(pattern => ({
        title: {
          contains: pattern,
          mode: 'insensitive' as const,
        },
      }))

      employees = await prisma.companyEmployee.findMany({
        where: {
          companyId: workMe.companyId,
          OR: titleConditions,
        },
        select: {
          id: true,
          fullName: true,
          title: true,
          email: true,
          companyUnit: true,
        },
        orderBy: {
          fullName: 'asc',
        },
        take: 50, // Limit results
      })
    } else {
      // For OTHER role, return all employees (or empty if you prefer)
      employees = await prisma.companyEmployee.findMany({
        where: {
          companyId: workMe.companyId,
        },
        select: {
          id: true,
          fullName: true,
          title: true,
          email: true,
          companyUnit: true,
        },
        orderBy: {
          fullName: 'asc',
        },
        take: 50,
      })
    }

    return NextResponse.json({
      success: true,
      employees,
      role,
    })
  } catch (error: any) {
    console.error('❌ GET /api/employee/lookup-by-role error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to lookup employees by role',
      },
      { status: 500 }
    )
  }
}


