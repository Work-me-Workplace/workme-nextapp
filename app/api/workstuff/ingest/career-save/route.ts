/**
 * API Route: Save Career Model
 * 
 * Stage 2 Save: Updates all real career fields, does NOT overwrite ingestRawText
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface CareerSaveRequest {
  careerId: string
  title: string | null
  description: string | null
  level: 'NAVSEA' | 'NAVY' | 'DOD' | null
  type: 'Leadership' | 'Fellowship' | 'Other' | null
  eligibility: {
    paygradeRange: { min: string | null; max: string | null }
    timeInServiceMonths: number | null
    timeInPositionMonths: number | null
    who: string | null
  }
  application: {
    instructions: string | null
    link: string | null
  }
  extras: {
    cost: string | null
    notes: string[] | null
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth.workMeId || !auth.companyUnit) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyUnit not set' },
        { status: 401 }
      )
    }

    const { companyUnit } = auth
    const data: CareerSaveRequest = await request.json()

    if (!data.careerId) {
      return NextResponse.json(
        { success: false, error: 'careerId is required' },
        { status: 400 }
      )
    }

    // Verify career exists and belongs to company unit
    const existing = await prisma.companyCareer.findFirst({
      where: {
        id: data.careerId,
        companyUnit,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Career not found' },
        { status: 404 }
      )
    }

    // Update ALL real career fields
    // DO NOT overwrite ingestRawText
    // Title is required, so use empty string if null
    const updated = await prisma.companyCareer.update({
      where: { id: data.careerId },
      data: {
        title: data.title || '',
        description: data.description ?? null,
        level: data.level ?? null,
        type: data.type ?? null,
        eligibility: data.eligibility ? JSON.parse(JSON.stringify(data.eligibility)) : null,
        application: data.application ? JSON.parse(JSON.stringify(data.application)) : null,
        extras: data.extras ? JSON.parse(JSON.stringify(data.extras)) : null,
        // ingestRawText remains unchanged
      },
    })

    return NextResponse.json({
      success: true,
      careerId: updated.id,
      career: updated,
    })
  } catch (error: any) {
    console.error('[Career Save] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save career' },
      { status: 500 }
    )
  }
}

