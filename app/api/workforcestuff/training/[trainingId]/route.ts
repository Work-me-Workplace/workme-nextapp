/**
 * API Route: Fetch a single CompanyTraining by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trainingId: string }> }
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
    const { trainingId } = await params

    const training = await prisma.companyTraining.findFirst({
      where: {
        id: trainingId,
        companyId, // Multi-tenant security
      },
    })

    if (!training) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      )
    }

    // Convert dates to ISO strings for JSON serialization
    const trainingResponse = {
      ...training,
      trainingDate: training.trainingDate ? training.trainingDate.toISOString() : null,
      completionDeadline: training.completionDeadline ? training.completionDeadline.toISOString() : null,
      registrationDeadline: training.registrationDeadline ? training.registrationDeadline.toISOString() : null,
      createdAt: training.createdAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      training: trainingResponse,
    })
  } catch (error: any) {
    console.error('[Training Detail API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
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

    const { trainingId } = await params
    const body = await request.json()
    const { data } = body

    const existing = await prisma.companyTraining.findFirst({
      where: {
        id: trainingId,
        companyId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      )
    }

    // Preserve ingest fields
    const updateData: any = {
      ...data,
    }
    if (existing.ingestRawText !== undefined) {
      updateData.ingestRawText = existing.ingestRawText
    }
    if (existing.ingestType !== undefined) {
      updateData.ingestType = existing.ingestType
    }
    if (existing.ingestCreatedAt !== undefined) {
      updateData.ingestCreatedAt = existing.ingestCreatedAt
    }

    const updated = await prisma.companyTraining.update({
      where: { id: trainingId },
      data: updateData,
    })

    return NextResponse.json({ success: true, training: updated })
  } catch (error: any) {
    console.error('[Training Update API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update training' },
      { status: 500 }
    )
  }
}

