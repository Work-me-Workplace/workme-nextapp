/**
 * WorkStuff Career Hydrate
 * 
 * POST /api/workstuff/career/hydrate - Hydrate career from raw text
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseCareer } from '@/lib/services/career-parser-service'

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

    const career = await prisma.companyCareer.findUnique({
      where: { id },
    })

    if (!career) {
      return NextResponse.json(
        { success: false, error: 'Career not found' },
        { status: 404 }
      )
    }

    if (!career.ingestRawText) {
      return NextResponse.json(
        { success: false, error: 'No raw text found for hydration' },
        { status: 400 }
      )
    }

    const model = await parseCareer(career.ingestRawText)

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[WorkStuff Career Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate career' },
      { status: 500 }
    )
  }
}
