/**
 * Concept Draft API Routes
 * 
 * GET /api/concept-draft - List all concept drafts for current user
 * POST /api/concept-draft - Create a new concept draft
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const drafts = await prisma.conceptDraft.findMany({
      where: {
        workMeId,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      drafts,
    })
  } catch (error: any) {
    console.error('❌ Concept Draft List error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch concept drafts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    const body = await request.json()
    const {
      title,
      summary,
      howItWorks,
      whoImpacted,
      example,
      timeframe,
      potentialStart,
      companyId: draftCompanyId,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'title is required' },
        { status: 400 }
      )
    }

    const draft = await prisma.conceptDraft.create({
      data: {
        workMeId,
        companyId: draftCompanyId || companyId || null,
        title: title.trim(),
        summary: summary?.trim() || null,
        howItWorks: howItWorks?.trim() || null,
        whoImpacted: Array.isArray(whoImpacted) ? whoImpacted : [],
        example: example?.trim() || null,
        timeframe: timeframe?.trim() || null,
        potentialStart: potentialStart?.trim() || null,
        status: 'DRAFT',
      },
    })

    return NextResponse.json({
      success: true,
      draft,
    })
  } catch (error: any) {
    console.error('❌ Concept Draft Create error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create concept draft' },
      { status: 500 }
    )
  }
}

