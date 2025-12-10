/**
 * WorkStuff Training Hydrate
 * 
 * POST /api/workstuff/training/hydrate - Hydrate training from raw text
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseTraining } from '@/lib/services/training-parser-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireWorkMeAuth(request)

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      )
    }

    const training = await prisma.companyTraining.findUnique({
      where: { id },
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

    const model = await parseTraining(training.ingestRawText)

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[WorkStuff Training Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate training' },
      { status: 500 }
    )
  }
}
