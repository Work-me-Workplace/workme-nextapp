/**
 * API Route: Fetch a single CompanyCareer by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { careerId: string } }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!workMeId || !companyUnit) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyUnit not set' },
        { status: 401 }
      )
    }
    const { careerId } = params

    const career = await prisma.companyCareer.findFirst({
      where: {
        id: careerId,
        companyUnit, // Multi-tenant security
      },
    })

    if (!career) {
      return NextResponse.json(
        { success: false, error: 'Career not found' },
        { status: 404 }
      )
    }

    // Convert dates to ISO strings for JSON serialization
    const careerResponse = {
      ...career,
      createdAt: career.createdAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      career: careerResponse,
    })
  } catch (error: any) {
    console.error('[Career Detail API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch career' },
      { status: 500 }
    )
  }
}

