/**
 * GET /api/decks/status/[generationId]
 * Check Gamma generation status. Optional query digitalSignId to update ProductDigitalSign.
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { checkGammaGenerationStatus } from '@/lib/deck/gamma-service'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ generationId: string }> }
) {
  try {
    await verifyAuth(request)
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { generationId } = await params
    const { searchParams } = new URL(request.url)
    const digitalSignId = searchParams.get('digitalSignId')

    if (!generationId) {
      return NextResponse.json(
        { success: false, error: 'generationId is required' },
        { status: 400 }
      )
    }

    const statusResult = await checkGammaGenerationStatus(generationId)
    const deckUrl = statusResult.gammaUrl ?? statusResult.url

    if (digitalSignId) {
      if (statusResult.status === 'completed' && deckUrl) {
        await prisma.productDigitalSign.update({
          where: { id: digitalSignId },
          data: {
            gammaStatus: 'ready',
            gammaDeckUrl: deckUrl,
            gammaPptxUrl: statusResult.pptxUrl ?? null,
            gammaError: null,
          },
        })
      } else if (statusResult.status === 'failed' || statusResult.status === 'error') {
        await prisma.productDigitalSign.update({
          where: { id: digitalSignId },
          data: {
            gammaStatus: 'error',
            gammaError: statusResult.error ?? 'Generation failed',
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      status: statusResult.status === 'completed' ? 'ready' : statusResult.status,
      url: deckUrl ?? undefined,
      pptxUrl: statusResult.pptxUrl ?? undefined,
      error: statusResult.error ?? undefined,
    })
  } catch (error) {
    console.error('Deck status check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check generation status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
