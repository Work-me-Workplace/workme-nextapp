/**
 * GET /api/decks/digital-signage/preview?digitalSignId=...
 * Returns the default narrative blob that would be sent to Gamma (from signage content).
 * Used to pre-fill "Details for Gamma" so the user can edit before sending.
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'
import { buildGammaBlob } from '@/lib/deck/blob-mapper'
import { digitalSignageToDeckSpec } from '@/lib/deck/digital-signage-to-deck'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await verifyAuth(request)
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const digitalSignId = searchParams.get('digitalSignId')

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

  const deckSpec = digitalSignageToDeckSpec(signage)
  const blob = buildGammaBlob(deckSpec)

  return NextResponse.json({
    success: true,
    preview: blob,
  })
}
