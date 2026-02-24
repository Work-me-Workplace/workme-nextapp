import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface TrainingSaveRequest {
  trainingId: string
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
  registrationDeadline: string | null
  location: string | null
  format: 'in-person' | 'virtual' | 'hybrid' | null
  link: string | null
  registrationLinks: Array<{ label?: string; url: string }> | null
  timeSlots: Array<{ date?: string; startTime: string; endTime: string; label?: string }> | null
  poc: {
    name: string | null
    email: string | null
    phone: string | null
    rankOrTitle: string | null
  }
}

/**
 * STAGE 2 SAVE: Finalize Training Entry
 * 
 * Updates ALL real training fields, sets ingestStatus = "saved"
 * Does NOT overwrite ingest fields (ingestRawText, ingestType, ingestCreatedAt)
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Training record already has companyUnitId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const data: TrainingSaveRequest = await request.json()

    if (!data.trainingId) {
      return NextResponse.json(
        { success: false, error: 'trainingId is required' },
        { status: 400 }
      )
    }

    // Verify training exists (no companyUnit check - training already has companyUnitId from creation)
    const existing = await prisma.companyTraining.findUnique({
      where: {
        id: data.trainingId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      )
    }

    // Split POC name
    let pocFirstName: string | null = null
    let pocLastName: string | null = null
    if (data.poc.name) {
      const nameParts = data.poc.name.trim().split(/\s+/)
      pocFirstName = nameParts[0] || null
      pocLastName = nameParts.slice(1).join(' ') || null
    }

    // Update ALL real training fields
    // DO NOT overwrite ingest fields, companyId, or workMeId
    const updated = await prisma.companyTraining.update({
      where: { id: data.trainingId },
      data: {
        // Core
        title: data.title,
        topic: data.topic,
        description: data.description,
        mandatory: data.mandatory,
        sponsoringOffice: data.sponsoringOffice,

        // Date / Time
        trainingDate: data.trainingDate ? new Date(data.trainingDate) : null,
        startTime: data.timeSlots?.length ? data.timeSlots[0].startTime : data.startTime,
        endTime: data.timeSlots?.length ? data.timeSlots[0].endTime : data.endTime,
        timeSlots: data.timeSlots ?? undefined,
        completionDeadline: data.completionDeadline ? new Date(data.completionDeadline) : null,
        isSelfPaced: data.isSelfPaced || false,
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,

        // Format / Location
        location: data.location,
        format: data.format,
        link: data.link,
        registrationLinks: data.registrationLinks ?? undefined,

        // POC
        pocFirstName,
        pocLastName,
        pocEmail: data.poc.email,
        pocPhone: data.poc.phone,
        pocRankOrTitle: data.poc.rankOrTitle,

        // Status
        ingestStatus: 'saved',

        // Preserve critical fields: ingestRawText, ingestType, ingestCreatedAt, companyId, workMeId
        // These are set during creation and should never be overwritten during save
        companyId: existing.companyId,
        workMeId: existing.workMeId,
        ingestRawText: existing.ingestRawText,
        ingestType: existing.ingestType,
        ingestCreatedAt: existing.ingestCreatedAt,
      },
    })

    return NextResponse.json({
      success: true,
      trainingId: updated.id,
      training: updated,
    })
  } catch (error: any) {
    console.error('[Training Save] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save training' },
      { status: 500 }
    )
  }
}

