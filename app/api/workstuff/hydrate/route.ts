/**
 * WorkStuff Hydration API
 * 
 * POST /api/workstuff/hydrate
 * 
 * Hydrates a WorkStuff item from its ingestRawText
 * Pure function - reads ingestRawText, parses it, returns structured model.
 * No DB writes. Hydration is read-only.
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { CONTEXT_TYPE_TO_MODEL } from '@/lib/services/companyx-mapper'
import { parseTraining } from '@/lib/services/training-parser-service'
import { parseCareer } from '@/lib/services/career-parser-service'
import type { ContextType } from '@/lib/types/context-type'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { id, type } = await request.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      )
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { success: false, error: 'type is required' },
        { status: 400 }
      )
    }

    const validTypes: ContextType[] = [
      'training',
      'career',
      'event',
      'campaign',
      'impact_event',
      'community',
      'benefits',
      'employee_cause',
    ]

    if (!validTypes.includes(type as ContextType)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const modelName = CONTEXT_TYPE_TO_MODEL[type as ContextType]

    // Load the record
    const record = await (prisma as any)[modelName].findUnique({
      where: { id },
    })

    if (!record) {
      return NextResponse.json(
        { success: false, error: `${type} not found` },
        { status: 404 }
      )
    }

    if (!record.ingestRawText) {
      return NextResponse.json(
        { success: false, error: 'No raw text found for hydration' },
        { status: 400 }
      )
    }

    // Parse based on type
    let model: any
    if (type === 'training') {
      model = await parseTraining(record.ingestRawText)
    } else if (type === 'career') {
      model = await parseCareer(record.ingestRawText)
    } else {
      // For other types, return the raw text for now
      // Can add parsers later if needed
      return NextResponse.json({
        success: true,
        model: {
          rawText: record.ingestRawText,
          note: 'Parser not yet implemented for this type',
        },
      })
    }

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[WorkStuff Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate WorkStuff item' },
      { status: 500 }
    )
  }
}
