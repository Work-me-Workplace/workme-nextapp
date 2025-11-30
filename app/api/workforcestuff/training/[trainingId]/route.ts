/**
 * API Route: Fetch a single CompanyTraining by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { trainingId: string } }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyUnit not set' },
        { status: 401 }
      )
    }
    const { trainingId } = params

    const training = await prisma.companyTraining.findFirst({
      where: {
        id: trainingId,
        companyUnit, // Multi-tenant security
      },
    })

    if (!training) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      )
    }

    // Convert dates to ISO strings for JSON serialization
    const trainingResponse = {
      ...training,
      trainingDate: training.trainingDate ? training.trainingDate.toISOString() : null,
      createdAt: training.createdAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      training: trainingResponse,
    })
  } catch (error: any) {
    console.error('[Training Detail API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training' },
      { status: 500 }
    )
  }
}

