/**
 * API Route: Fetch a single CompanyCareer by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ careerId: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }
    const { careerId } = await params

    const career = await prisma.companyCareer.findFirst({
      where: {
        id: careerId,
        companyId, // Multi-tenant security
      },
    })

    if (!career) {
      return NextResponse.json(
        { success: false, error: 'Career not found' },
        { status: 404 }
      )
    }

    // Convert dates to ISO strings for JSON serialization
    const careerResponse = {
      ...career,
      createdAt: career.createdAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      career: careerResponse,
    })
  } catch (error: any) {
    console.error('[Career Detail API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch career' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ careerId: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    const { careerId } = await params
    const body = await request.json()
    const { data } = body

    const existing = await prisma.companyCareer.findFirst({
      where: {
        id: careerId,
        companyId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Career not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.companyCareer.update({
      where: { id: careerId },
      data: {
        ...data,
        // Preserve ingest fields
        ingestRawText: existing.ingestRawText,
        summary: data.summary ?? existing.summary,
      },
    })

    return NextResponse.json({ success: true, career: updated })
  } catch (error: any) {
    console.error('[Career Update API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update career' },
      { status: 500 }
    )
  }
}

