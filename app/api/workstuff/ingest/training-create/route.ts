import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface TrainingCreateRequest {
  companyId: string
  ingestRawText?: string | null
  title: string | null
  description: string | null
  mandatory: boolean
  topic: string | null
  sponsoringOffice: string | null
  trainingDate: string | null
  startTime: string | null
  endTime: string | null
  completionDeadline: string | null
  isSelfPaced: boolean
  location: string | null
  format: 'in-person' | 'virtual' | 'hybrid' | null
  link: string | null
  poc: {
    name: string | null
    email: string | null
    phone: string | null
    rankOrTitle: string | null
  }
}

/**
 * Create training in one shot (no pending record). Writes to DB only when user hits Save.
 * AUTH: WorkMe-only. SCOPE: companyId from payload.
 */
export async function POST(request: NextRequest) {
  try {
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const data: TrainingCreateRequest = await request.json()

    if (!data.companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      )
    }

    let pocFirstName: string | null = null
    let pocLastName: string | null = null
    if (data.poc?.name) {
      const nameParts = data.poc.name.trim().split(/\s+/)
      pocFirstName = nameParts[0] || null
      pocLastName = nameParts.slice(1).join(' ') || null
    }

    const created = await prisma.companyTraining.create({
      data: {
        companyId: data.companyId,
        workMeId,
        ingestRawText: data.ingestRawText ?? null,
        ingestType: 'training',
        ingestStatus: 'saved',
        ingestCreatedAt: new Date(),

        title: data.title ?? null,
        topic: data.topic ?? null,
        description: data.description ?? null,
        mandatory: data.mandatory ?? false,
        sponsoringOffice: data.sponsoringOffice ?? null,

        trainingDate: data.trainingDate ? new Date(data.trainingDate) : null,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        completionDeadline: data.completionDeadline ? new Date(data.completionDeadline) : null,
        isSelfPaced: data.isSelfPaced ?? false,

        location: data.location ?? null,
        format: data.format ?? null,
        link: data.link ?? null,

        pocFirstName,
        pocLastName,
        pocEmail: data.poc?.email ?? null,
        pocPhone: data.poc?.phone ?? null,
        pocRankOrTitle: data.poc?.rankOrTitle ?? null,

        summary: data.description ?? data.title ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      trainingId: created.id,
      training: created,
    })
  } catch (error: any) {
    console.error('[Training Create] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create training' },
      { status: 500 }
    )
  }
}
