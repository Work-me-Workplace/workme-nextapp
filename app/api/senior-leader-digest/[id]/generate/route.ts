import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { generateSeniorLeaderDigest } from '@/lib/services/senior-leader-digest-ai-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/senior-leader-digest/:id/generate
 * This is the handoff to AI.
 * 
 * Responsibilities:
 * - Fetch digest + ordered entries
 * - Construct AI prompt payload
 * - Call AI service
 * - Store generated opening note + subject line
 * - Update status → GENERATED
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id: digestId } = await params

    // 3. Fetch digest with entries
    const digest = await prisma.seniorLeaderDigest.findUnique({
      where: { id: digestId },
      include: {
        entries: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    if (!digest) {
      return NextResponse.json(
        { success: false, error: 'Digest not found' },
        { status: 404 },
      )
    }

    // 4. Organize entries by type
    const deliveries = digest.entries
      .filter(e => e.type === 'DELIVERY')
      .map(e => ({
        title: e.title,
        impact: e.description || undefined,
      }))

    const wins = digest.entries
      .filter(e => e.type === 'WIN')
      .map(e => ({
        title: e.title,
        impact: e.description || undefined,
      }))

    const workforce = digest.entries
      .filter(e => e.type === 'WORKFORCE')
      .map(e => ({
        note: e.description || e.title,
      }))

    const reminders = digest.entries
      .filter(e => e.type === 'REMINDER')
      .map(e => ({
        note: e.description || e.title,
      }))

    // 5. Construct AI input payload
    const aiInput = {
      leaderName: digest.leaderName,
      leaderRole: digest.leaderRole,
      weekOf: digest.weekOf.toISOString().split('T')[0], // Format as YYYY-MM-DD
      sections: {
        deliveries,
        wins,
        workforce,
        reminders,
      },
    }

    console.log('[API POST /api/senior-leader-digest/:id/generate] Calling AI service', {
      digestId,
      entriesCount: digest.entries.length,
      deliveriesCount: deliveries.length,
      winsCount: wins.length,
      workforceCount: workforce.length,
      remindersCount: reminders.length,
    })

    // 6. Call AI service
    const aiOutput = await generateSeniorLeaderDigest(aiInput)

    // 7. Update digest with generated content
    const updatedDigest = await prisma.seniorLeaderDigest.update({
      where: { id: digestId },
      data: {
        subjectLine: aiOutput.subjectLine,
        openingNote: aiOutput.openingNote,
        status: 'GENERATED',
      },
      include: {
        entries: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    console.log('[API POST /api/senior-leader-digest/:id/generate] SUCCESS', {
      digestId,
      subjectLine: aiOutput.subjectLine,
    })

    return NextResponse.json({
      success: true,
      digest: updatedDigest,
      generated: {
        subjectLine: aiOutput.subjectLine,
        openingNote: aiOutput.openingNote,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/senior-leader-digest/:id/generate error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate digest',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

