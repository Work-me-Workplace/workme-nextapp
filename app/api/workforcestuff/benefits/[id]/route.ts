/**
 * Benefits Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params

    const item = await prisma.companyBenefits.findFirst({
      where: { id, companyId },
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Benefits not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: item })
  } catch (error: any) {
    console.error('[Benefits Detail] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch benefits' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { data } = body

    const existing = await prisma.companyBenefits.findFirst({
      where: { id, companyId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Benefits not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.companyBenefits.update({
      where: { id },
      data: {
        ...data,
        // Preserve ingest fields
        ingestRawText: existing.ingestRawText,
        summary: data.summary ?? existing.summary,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('[Benefits Update] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update benefits' },
      { status: 500 }
    )
  }
}
