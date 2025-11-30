import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
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
  trainingDate: string | null // ISO date string
  startTime: string | null
  endTime: string | null
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
 * STAGE 2 SAVE: Finalize Training Entry
 * 
 * Updates ALL real training fields, sets ingestStatus = "saved"
 * Does NOT overwrite ingest fields (ingestRawText, ingestType, ingestCreatedAt)
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
    const data: TrainingSaveRequest = await request.json()

    if (!data.trainingId) {
      return NextResponse.json(
        { success: false, error: 'trainingId is required' },
        { status: 400 }
      )
    }

    // Verify training exists and belongs to company unit
    const existing = await prisma.companyTraining.findFirst({
      where: {
        id: data.trainingId,
        companyUnit,
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
    // DO NOT overwrite ingest fields
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
        startTime: data.startTime,
        endTime: data.endTime,

        // Format / Location
        location: data.location,
        format: data.format,
        link: data.link,

        // POC
        pocFirstName,
        pocLastName,
        pocEmail: data.poc.email,
        pocPhone: data.poc.phone,
        pocRankOrTitle: data.poc.rankOrTitle,

        // Status
        ingestStatus: 'saved',

        // ingestRawText, ingestType, ingestCreatedAt remain unchanged
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

