import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseTraining } from '@/lib/services/training-parser-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 2: Training Hydration
 * 
 * Pure function - reads ingestRawText, parses it, returns structured model.
 * No DB writes. Hydration is read-only.
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Training record already has companyUnitId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { trainingId } = await request.json()

    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'trainingId is required' },
        { status: 400 }
      )
    }

    // Load CompanyTraining (no companyUnit check - training already has companyUnitId)
    const training = await prisma.companyTraining.findUnique({
      where: {
        id: trainingId,
      },
    })

    if (!training) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      )
    }

    if (!training.ingestRawText) {
      return NextResponse.json(
        { success: false, error: 'No raw text found for hydration' },
        { status: 400 }
      )
    }

    // Parse training data (pure function, no DB writes)
    const model = await parseTraining(training.ingestRawText)

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[Training Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate training' },
      { status: 500 }
    )
  }
}

