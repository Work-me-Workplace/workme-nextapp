/**
 * WorkStuff Cause Hydrate
 * 
 * POST /api/workstuff/cause/hydrate - Hydrate cause from raw text
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

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

    const cause = await prisma.companyEmployeeCause.findUnique({
      where: { id },
    })

    if (!cause) {
      return NextResponse.json(
        { success: false, error: 'Cause not found' },
        { status: 404 }
      )
    }

    if (!cause.ingestRawText) {
      return NextResponse.json(
        { success: false, error: 'No raw text found for hydration' },
        { status: 400 }
      )
    }

    // For now, return the raw text
    // Can add parser later if needed
    return NextResponse.json({
      success: true,
      model: {
        rawText: cause.ingestRawText,
        note: 'Parser not yet implemented for employee cause',
      },
    })
  } catch (error: any) {
    console.error('[WorkStuff Cause Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate cause' },
      { status: 500 }
    )
  }
}
