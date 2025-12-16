import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/senior-leader-digest/:id/attach-entries
 * Attaches structured entries (wins, deliveries, reminders) to a digest
 * 
 * This is where:
 * - Units
 * - Milestones
 * - Events
 * get bolted on, not rewritten.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id: digestId } = params

    // 3. Verify digest exists
    const digest = await prisma.seniorLeaderDigest.findUnique({
      where: { id: digestId },
      include: { entries: true },
    })

    if (!digest) {
      return NextResponse.json(
        { success: false, error: 'Digest not found' },
        { status: 404 },
      )
    }

    // 4. Parse request body
    const body = await request.json()
    
    // Support both single entry and array of entries
    const entriesToAdd = Array.isArray(body) ? body : [body]

    // 5. Validate entries
    for (const entry of entriesToAdd) {
      const { type, title, description, sourceType, sourceId } = entry

      if (!type || !['DELIVERY', 'WIN', 'WORKFORCE', 'REMINDER'].includes(type)) {
        return NextResponse.json(
          { success: false, error: 'type must be one of: DELIVERY, WIN, WORKFORCE, REMINDER' },
          { status: 400 },
        )
      }

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'title is required' },
          { status: 400 },
        )
      }
    }

    // 6. Determine next orderIndex
    const maxOrderIndex = digest.entries.length > 0
      ? Math.max(...digest.entries.map(e => e.orderIndex))
      : -1

    // 7. Create entries
    const createdEntries = await Promise.all(
      entriesToAdd.map((entry, index) => {
        const { type, title, description, sourceType, sourceId } = entry
        return prisma.seniorLeaderDigestEntry.create({
          data: {
            digestId,
            type,
            title: title.trim(),
            description: description?.trim() || null,
            sourceType: sourceType || null,
            sourceId: sourceId || null,
            orderIndex: maxOrderIndex + 1 + index,
          },
        })
      })
    )

    console.log('[API POST /api/senior-leader-digest/:id/attach-entries] SUCCESS', {
      digestId,
      entriesCreated: createdEntries.length,
    })

    return NextResponse.json({
      success: true,
      entries: createdEntries,
    })
  } catch (error: any) {
    console.error('❌ POST /api/senior-leader-digest/:id/attach-entries error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to attach entries',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}
