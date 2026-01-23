import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseImpactEvent } from '@/lib/services/impact-event-mapper-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 2: Impact Event Hydration
 * 
 * Pure function - reads ingestRawText, parses it, returns structured model.
 * No DB writes. Hydration is read-only.
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Impact Event record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { impactEventId } = await request.json()

    if (!impactEventId) {
      return NextResponse.json(
        { success: false, error: 'impactEventId is required' },
        { status: 400 }
      )
    }

    // Load CompanyImpactEvent
    const impactEvent = await prisma.companyImpactEvent.findUnique({
      where: {
        id: impactEventId,
      },
    })

    if (!impactEvent) {
      return NextResponse.json(
        { success: false, error: 'Impact Event not found' },
        { status: 404 }
      )
    }

    if (!impactEvent.ingestRawText) {
      return NextResponse.json(
        { success: false, error: 'No raw text found for hydration' },
        { status: 400 }
      )
    }

    // Parse impact event data (pure function, no DB writes)
    const model = await parseImpactEvent(impactEvent.ingestRawText)

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[Impact Event Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate impact event' },
      { status: 500 }
    )
  }
}

