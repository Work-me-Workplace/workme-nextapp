import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
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
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!workMeId || !companyUnit) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyUnit not set' },
        { status: 401 }
      )
    }
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
    const validTypes = ['training', 'career', 'event', 'notice', 'task', 'other']
    if (!validTypes.includes(selectedType)) {
      return NextResponse.json(
        { success: false, error: `Invalid selectedType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (selectedType === 'training') {
      // Create CompanyTraining with ONLY ingest snapshot
      const training = await prisma.companyTraining.create({
        data: {
          ingestRawText: rawText,
          ingestType: selectedType,
          ingestStatus: 'pending',
          ingestCreatedAt: new Date(),
          companyUnit,
          createdByWorkMeId: workMeId,
          mandatory: false,
        },
      })

      return NextResponse.json({
        success: true,
        trainingId: training.id,
        redirectTo: `/mycompany/workforcestuff/training/ingest/${training.id}`,
        training,
      })
    } else if (selectedType === 'career') {
      // Create CompanyCareer with ONLY ingest snapshot
      const career = await prisma.companyCareer.create({
        data: {
          ingestRawText: rawText,
          title: '', // Required field, will be updated in Stage 2
          companyUnit,
          createdByWorkMeId: workMeId,
        },
      })

      return NextResponse.json({
        success: true,
        careerId: career.id,
        redirectTo: `/mycompany/workforcestuff/career/ingest/${career.id}`,
        career,
      })
    } else {
      // Other types coming soon
      return NextResponse.json(
        { success: false, error: `Type "${selectedType}" is coming soon. Only "training" and "career" are currently supported.` },
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

