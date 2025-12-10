import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { searchEmployees } from '@/lib/employee/service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/employee/search?q=query
 * 
 * Search for employees by name
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

    // 2. Get search query
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    // 3. Search employees
    const employees = await searchEmployees(query, workMe.companyId)

    return NextResponse.json({
      success: true,
      employees,
    })
  } catch (error: any) {
    console.error('❌ GET /api/employee/search error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search employees',
      },
      { status: 500 }
    )
  }
}
