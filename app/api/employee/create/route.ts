import { NextRequest, NextResponse } from 'next/server'
import { createEmployee } from '@/lib/employee/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/employee/create
 * 
 * Create a new employee
 * Simple: just name and companyId required
 * 
 * Body: {
 *   fullName?: string,
 *   firstName?: string,
 *   lastName?: string,
 *   title?: string,
 *   email?: string,
 *   phone?: string,
 *   photoUrl?: string,
 *   companyUnit?: string,
 *   division?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, firstName, lastName, title, email, phone, photoUrl, companyUnit, division } = body

    // Validate
    if (!fullName && !firstName && !lastName) {
      return NextResponse.json(
        { success: false, error: 'fullName or firstName/lastName is required' },
        { status: 400 }
      )
    }

    // Create employee
    const employee = await createEmployee({
      fullName,
      firstName,
      lastName,
      title: title || null,
      email: email || null,
      phone: phone || null,
      photoUrl: photoUrl || null,
      companyUnit: companyUnit || null,
      division: division || null,
    })

    return NextResponse.json({
      success: true,
      employee,
    })
  } catch (error: any) {
    console.error('❌ POST /api/employee/create error:', error)

    const status = error.message?.includes('not found') || error.message?.includes('belong to a company')
      ? 400
      : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create employee',
      },
      { status }
    )
  }
}




