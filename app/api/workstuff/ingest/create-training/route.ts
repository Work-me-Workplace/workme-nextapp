import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 1: Create CompanyX model with Ingest Snapshot
 * 
 * Creates a new CompanyX row (currently only Training) with ONLY ingest fields populated.
 * All "real" fields remain null until Stage 2.
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
    const { rawText, selectedType } = await request.json()

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    if (!selectedType || typeof selectedType !== 'string') {
      return NextResponse.json(
        { success: false, error: 'selectedType is required' },
        { status: 400 }
      )
    }

    // Validate selectedType
    const validTypes = ['training', 'event', 'notice', 'task', 'other']
    if (!validTypes.includes(selectedType)) {
      return NextResponse.json(
        { success: false, error: `Invalid selectedType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // For now, only "training" is fully implemented
    if (selectedType === 'training') {
      // Create CompanyTraining with ONLY ingest snapshot
      // DO NOT set real training fields - they don't exist in DB yet or should remain null
      const training = await prisma.companyTraining.create({
        data: {
          ingestRawText: rawText,
          ingestType: selectedType,
          ingestStatus: 'pending',
          ingestCreatedAt: new Date(),
          companyId,
          // Only set mandatory default - all other real fields remain undefined (Prisma will use schema defaults)
          mandatory: false,
        },
      })

      return NextResponse.json({
        success: true,
        trainingId: training.id,
        redirectTo: `/mycompany/workforcestuff/training/ingest/${training.id}`,
        training,
      })
    } else {
      // Other types coming soon
      return NextResponse.json(
        { success: false, error: `Type "${selectedType}" is coming soon. Only "training" is currently supported.` },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('[Create Training] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create training' },
      { status: 500 }
    )
  }
}

