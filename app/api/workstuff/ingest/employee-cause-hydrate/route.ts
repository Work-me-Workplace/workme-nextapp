import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseEmployeeCause } from '@/lib/services/employee-cause-mapper-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 2: Employee Cause Hydration
 * 
 * Pure function - reads ingestRawText, parses it, returns structured model.
 * No DB writes. Hydration is read-only.
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Employee Cause record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { employeeCauseId } = await request.json()

    if (!employeeCauseId) {
      return NextResponse.json(
        { success: false, error: 'employeeCauseId is required' },
        { status: 400 }
      )
    }

    // Load CompanyEmployeeCause
    const employeeCause = await prisma.companyEmployeeCause.findUnique({
      where: {
        id: employeeCauseId,
      },
    })

    if (!employeeCause) {
      return NextResponse.json(
        { success: false, error: 'Employee Cause not found' },
        { status: 404 }
      )
    }

    if (!employeeCause.ingestRawText) {
      return NextResponse.json(
        { success: false, error: 'No raw text found for hydration' },
        { status: 400 }
      )
    }

    // Parse employee cause data (pure function, no DB writes)
    const model = await parseEmployeeCause(employeeCause.ingestRawText)

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[Employee Cause Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate employee cause' },
      { status: 500 }
    )
  }
}
