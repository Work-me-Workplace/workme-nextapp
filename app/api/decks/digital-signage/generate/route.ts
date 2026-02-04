/**
 * POST /api/decks/digital-signage/generate
 * Generate a Gamma deck (presentation/PPT) from a digital signage product.
 * Same async flow as IgniteBd: returns generationId, client polls status.
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'
import { buildGammaBlob } from '@/lib/deck/blob-mapper'
import { generateDeckWithGamma, checkGammaGenerationStatus } from '@/lib/deck/gamma-service'
import { digitalSignageToDeckSpec } from '@/lib/deck/digital-signage-to-deck'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { digitalSignId, detailsForGamma } = body as { digitalSignId: string; detailsForGamma?: string }

    if (!digitalSignId) {
      return NextResponse.json(
        { success: false, error: 'digitalSignId is required' },
        { status: 400 }
      )
    }

    const signage = await prisma.productDigitalSign.findUnique({
      where: { id: digitalSignId },
      include: {
        workforceAchievement: true,
        workforce: true,
        companyNews: true,
        companyEvent: true,
      },
    })

    if (!signage) {
      return NextResponse.json(
        { success: false, error: 'Digital signage not found' },
        { status: 404 }
      )
    }

    if (signage.gammaStatus === 'generating') {
      return NextResponse.json(
        { success: false, error: 'Deck is already being generated' },
        { status: 409 }
      )
    }

    if (signage.gammaStatus === 'ready' && signage.gammaDeckUrl) {
      return NextResponse.json({
        success: true,
        status: 'ready',
        deckUrl: signage.gammaDeckUrl,
        pptxUrl: signage.gammaPptxUrl ?? undefined,
        message: 'Deck already generated',
      })
    }

    const blob =
      typeof detailsForGamma === 'string' && detailsForGamma.trim().length > 0
        ? detailsForGamma.trim()
        : buildGammaBlob(digitalSignageToDeckSpec(signage))

    await prisma.productDigitalSign.update({
      where: { id: digitalSignId },
      data: {
        gammaBlob: blob,
        gammaStatus: 'generating',
        gammaError: null,
      },
    })

    if (!process.env.GAMMA_API_KEY) {
      await prisma.productDigitalSign.update({
        where: { id: digitalSignId },
        data: {
          gammaStatus: 'error',
          gammaError: 'GAMMA_API_KEY not configured',
        },
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Gamma API key not configured. Please set GAMMA_API_KEY.',
        },
        { status: 500 }
      )
    }

    let generationId: string
    try {
      const result = await generateDeckWithGamma(blob)
      generationId = result.generationId
    } catch (gammaError) {
      const errorMessage =
        gammaError instanceof Error
          ? gammaError.message
          : typeof gammaError === 'object'
            ? JSON.stringify(gammaError)
            : String(gammaError)
      await prisma.productDigitalSign.update({
        where: { id: digitalSignId },
        data: {
          gammaStatus: 'error',
          gammaError: errorMessage,
        },
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate deck with Gamma',
          details: errorMessage,
        },
        { status: 500 }
      )
    }

    await prisma.productDigitalSign.update({
      where: { id: digitalSignId },
      data: {
        gammaGenerationId: generationId,
        gammaStatus: 'generating',
        gammaError: null,
      },
    })

    try {
      const statusResult = await checkGammaGenerationStatus(generationId)
      const deckUrl = statusResult.gammaUrl ?? statusResult.url

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
        return NextResponse.json({
          success: true,
          status: 'ready',
          deckUrl,
          pptxUrl: statusResult.pptxUrl ?? undefined,
        })
      }

      if (statusResult.status === 'failed' || statusResult.status === 'error') {
        await prisma.productDigitalSign.update({
          where: { id: digitalSignId },
          data: {
            gammaStatus: 'error',
            gammaError: statusResult.error ?? 'Generation failed',
          },
        })
        return NextResponse.json(
          {
            success: false,
            error: 'Gamma generation failed',
            details: statusResult.error ?? 'Unknown error',
          },
          { status: 500 }
        )
      }
    } catch {
      // Status check failed; generation was started; client can poll
    }

    return NextResponse.json({
      success: true,
      status: 'generating',
      generationId,
      message: 'Generation started. Poll GET /api/decks/status/{generationId}?digitalSignId=... for status.',
    })
  } catch (error) {
    console.error('Generate deck (digital signage) error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate deck',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
