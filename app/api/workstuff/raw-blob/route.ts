import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getRawBlob } from '@/lib/redis'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET: Retrieve raw blob from Redis
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth.workMeId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { workMeId } = auth
    const blob = await getRawBlob(workMeId)

    return NextResponse.json({
      success: true,
      blob: blob || null,
    })
  } catch (error: any) {
    console.error('[Get Raw Blob] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get raw blob' },
      { status: 500 }
    )
  }
}

