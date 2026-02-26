import { NextRequest, NextResponse } from 'next/server'
import { suggestEventTheme } from '@/lib/services/event-mapper-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/workstuff/ingest/event-suggest-theme
 * Body: { rawText?: string, title?: string, description?: string }
 * Returns: { success: true, theme: string | null, eventCategory: string | null }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rawText, title, description } = body

    const result = await suggestEventTheme({ rawText, title, description })

    return NextResponse.json({
      success: true,
      theme: result.theme,
      eventCategory: result.eventCategory,
    })
  } catch (error: any) {
    console.error('[event-suggest-theme]', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to suggest theme' },
      { status: 500 }
    )
  }
}
