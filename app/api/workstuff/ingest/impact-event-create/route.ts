import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface ImpactEventCreateRequest {
  companyId: string
  ingestRawText?: string | null
  title: string | null
  description: string | null
  summary: string | null
  effectiveDate: string | null
  location: string | null
  impactedPopulation: string | null
  urgency: string | null
  pocFirstName: string | null
  pocLastName: string | null
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * Create impact event in one shot (no pending record). Writes to DB only when user hits Save.
 * AUTH: WorkMe-only. SCOPE: companyId from payload.
 */
export async function POST(request: NextRequest) {
  try {
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const data: ImpactEventCreateRequest = await request.json()

    if (!data.companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      )
    }

    const created = await prisma.companyImpactEvent.create({
      data: {
        companyId: data.companyId,
        workMeId,
        ingestRawText: data.ingestRawText ?? null,

        title: data.title || 'Untitled Impact Event',
        description: data.description ?? null,
        summary: data.summary ?? data.description ?? null,

        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
        location: data.location ?? null,
        impactedPopulation: data.impactedPopulation ?? null,
        urgency: data.urgency ?? null,

        pocFirstName: data.pocFirstName ?? null,
        pocLastName: data.pocLastName ?? null,
        pocEmail: data.pocEmail ?? null,
        pocPhone: data.pocPhone ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      impactEventId: created.id,
      impactEvent: created,
    })
  } catch (error: any) {
    console.error('[Impact Event Create] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create impact event' },
      { status: 500 }
    )
  }
}
