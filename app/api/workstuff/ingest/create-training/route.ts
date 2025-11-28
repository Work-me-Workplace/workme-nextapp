import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 1: Create Training with Ingest Snapshot
 * 
 * Creates a new CompanyTraining row with ONLY ingest fields populated.
 * All "real" training fields remain null until Stage 2.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth.workMeId || !auth.companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { companyId } = auth
    const { rawText } = await request.json()

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    // Create CompanyTraining with ONLY ingest snapshot
    const training = await prisma.companyTraining.create({
      data: {
        ingestRawText: rawText,
        ingestType: 'training',
        ingestStatus: 'pending',
        ingestCreatedAt: new Date(),
        companyId,
        // All "real" fields remain null
        title: null,
        description: null,
        mandatory: false,
        trainingDate: null,
        startTime: null,
        endTime: null,
        location: null,
        format: null,
        link: null,
        pocFirstName: null,
        pocLastName: null,
        pocEmail: null,
        pocPhone: null,
        pocRankOrTitle: null,
      },
    })

    return NextResponse.json({
      success: true,
      trainingId: training.id,
      training,
    })
  } catch (error: any) {
    console.error('[Create Training] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create training' },
      { status: 500 }
    )
  }
}

