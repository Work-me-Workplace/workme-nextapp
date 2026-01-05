import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/employee/search-by-role?role=DIRECTOR
 * 
 * Search for employees by role enum (filters by title matching role)
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

    // 2. Get role from query params
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role parameter is required' },
        { status: 400 }
      )
    }

    // 3. Map role enum to title search patterns
    const roleTitlePatterns: Record<string, string[]> = {
      SES: ['ses', 'senior executive service'],
      DIRECTOR: ['director'],
      DEPUTY_DIRECTOR: ['deputy director'],
      EXECUTIVE_DIRECTOR: ['executive director'],
      CHIEF: ['chief'],
      DEPUTY_CHIEF: ['deputy chief'],
      COMMANDER: ['commander'],
      DEPUTY_COMMANDER: ['deputy commander'],
    }

    const patterns = roleTitlePatterns[role] || [role.toLowerCase()]

    // 4. Search employees by title matching role patterns
    const employees = await prisma.companyEmployee.findMany({
      where: {
        companyId: workMe.companyId,
        OR: patterns.map((pattern) => ({
          title: {
            contains: pattern,
            mode: 'insensitive',
          },
        })),
      },
      select: {
        id: true,
        fullName: true,
        title: true,
        email: true,
        companyUnit: true,
        photoUrl: true,
      },
      orderBy: {
        fullName: 'asc',
      },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      employees,
    })
  } catch (error: any) {
    console.error('❌ GET /api/employee/search-by-role error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search employees by role',
      },
      { status: 500 }
    )
  }
}





