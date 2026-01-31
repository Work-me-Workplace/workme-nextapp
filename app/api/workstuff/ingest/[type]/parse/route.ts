import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { parseCompanyXContent } from '@/lib/services/companyx-unified-mapper'
import type { ContextType } from '@/lib/types/context-type'
import { isValidContextType } from '@/lib/types/context-type'

export const dynamic = 'force-dynamic'

/**
 * Parse-only: returns structured data from rawText for the given type.
 * Does NOT create any DB record. Used when user clicks Continue (review step).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    await requireWorkMeAuth(request)
    const { type } = await params
    const { rawText } = await request.json()

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    if (!type || !isValidContextType(type)) {
      return NextResponse.json(
        { success: false, error: 'Valid type is required' },
        { status: 400 }
      )
    }

    const parsed = await parseCompanyXContent(rawText.trim(), type as ContextType)
    const model = 'data' in parsed ? parsed.data : null

    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Parse returned no data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[Parse CompanyX] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse content',
        parseError: error.message,
      },
      { status: 500 }
    )
  }
}
