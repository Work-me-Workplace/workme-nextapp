import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface EmployeeCauseSaveRequest {
  employeeCauseId: string
  title: string | null
  description: string | null
  impactSummary: string | null
  partnerOrg: string | null
  windowStart: string | null // ISO date string
  windowEnd: string | null // ISO date string
  locations: string[] | null
  link: string | null
  deadlines: Array<{ label: string; date: string }> | null
  sponsoringDepartment: string | null
  pocList: Array<{
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
  }> | null
  extraInstructions: Record<string, any> | null
}

/**
 * STAGE 2 SAVE: Finalize Employee Cause Entry
 * 
 * Updates ALL real employee cause fields
 * Does NOT overwrite ingest fields (ingestRawText)
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Employee Cause record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const data: EmployeeCauseSaveRequest = await request.json()

    if (!data.employeeCauseId) {
      return NextResponse.json(
        { success: false, error: 'employeeCauseId is required' },
        { status: 400 }
      )
    }

    // Verify employee cause exists
    const existing = await prisma.companyEmployeeCause.findUnique({
      where: {
        id: data.employeeCauseId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Employee Cause not found' },
        { status: 404 }
      )
    }

    // Update ALL employee cause fields to match the model
    // DO NOT overwrite ingest fields
    const updated = await prisma.companyEmployeeCause.update({
      where: { id: data.employeeCauseId },
      data: {
        // Core
        title: data.title || 'Untitled Employee Cause',
        description: data.description,
        impactSummary: data.impactSummary,
        partnerOrg: data.partnerOrg,
        sponsoringDepartment: data.sponsoringDepartment,
        
        // Dates
        windowStart: data.windowStart ? new Date(data.windowStart) : null,
        windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
        
        // Locations / Links
        locations: data.locations ?? undefined,
        link: data.link,
        deadlines: data.deadlines ? data.deadlines as any : undefined,
        extraInstructions: data.extraInstructions ? data.extraInstructions as any : undefined,
        pocList: data.pocList ? data.pocList as any : undefined,

        // ingestRawText remains unchanged
      },
    })

    return NextResponse.json({
      success: true,
      employeeCauseId: updated.id,
      employeeCause: updated,
    })
  } catch (error: any) {
    console.error('[Employee Cause Save] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save employee cause' },
      { status: 500 }
    )
  }
}
