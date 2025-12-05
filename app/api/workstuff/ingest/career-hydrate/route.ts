/**
 * API Route: Hydrate Career Model from Raw Text
 * 
 * Stage 2: Reads ingestRawText from CompanyCareer and uses GPT to extract structured fields
 * Returns hydrated model - NO DB writes
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseCareer } from '@/lib/services/career-parser-service'

export const dynamic = 'force-dynamic'

/**
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Career record already has companyUnitId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { careerId } = await request.json()

    if (!careerId || typeof careerId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'careerId is required' },
        { status: 400 }
      )
    }

    // Load the CompanyCareer row (no companyUnit check - career already has companyUnitId)
    const career = await prisma.companyCareer.findUnique({
      where: { id: careerId },
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

    // Run the model-specific parser
    const hydratedModel = await parseCareer(career.ingestRawText)

    return NextResponse.json({
      success: true,
      model: hydratedModel,
    })
  } catch (error: any) {
    console.error('[Career Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate career' },
      { status: 500 }
    )
  }
}

