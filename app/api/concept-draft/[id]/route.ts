/**
 * Concept Draft Detail API Routes
 * 
 * GET /api/concept-draft/[id] - Get a concept draft by ID
 * PUT /api/concept-draft/[id] - Update a concept draft
 * DELETE /api/concept-draft/[id] - Delete a concept draft
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
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params

    const draft = await prisma.conceptDraft.findFirst({
      where: {
        id,
        workMeId,
      },
    })

    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Concept draft not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      draft,
    })
  } catch (error: any) {
    console.error('❌ Concept Draft Get error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch concept draft' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params
    const body = await request.json()

    // Verify draft belongs to user
    const existing = await prisma.conceptDraft.findFirst({
      where: {
        id,
        workMeId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Concept draft not found' },
        { status: 404 }
      )
    }

    const draft = await prisma.conceptDraft.update({
      where: { id },
      data: {
        title: body.title?.trim() || existing.title,
        summary: body.summary !== undefined ? (body.summary?.trim() || null) : existing.summary,
        howItWorks: body.howItWorks !== undefined ? (body.howItWorks?.trim() || null) : existing.howItWorks,
        whoImpacted: body.whoImpacted !== undefined ? (Array.isArray(body.whoImpacted) ? body.whoImpacted : []) : existing.whoImpacted,
        example: body.example !== undefined ? (body.example?.trim() || null) : existing.example,
        timeframe: body.timeframe !== undefined ? (body.timeframe?.trim() || null) : existing.timeframe,
        potentialStart: body.potentialStart !== undefined ? (body.potentialStart?.trim() || null) : existing.potentialStart,
        status: body.status || existing.status,
      },
    })

    return NextResponse.json({
      success: true,
      draft,
    })
  } catch (error: any) {
    console.error('❌ Concept Draft Update error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update concept draft' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params

    // Verify draft belongs to user
    const existing = await prisma.conceptDraft.findFirst({
      where: {
        id,
        workMeId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Concept draft not found' },
        { status: 404 }
      )
    }

    await prisma.conceptDraft.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('❌ Concept Draft Delete error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete concept draft' },
      { status: 500 }
    )
  }
}

