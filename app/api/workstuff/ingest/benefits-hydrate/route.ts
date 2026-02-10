import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseBenefits } from '@/lib/services/benefits-mapper-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 2: Benefits Hydration
 * 
 * Pure function - reads ingestRawText, parses it, returns structured model.
 * No DB writes. Hydration is read-only.
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Benefits record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { benefitsId } = await request.json()

    if (!benefitsId) {
      return NextResponse.json(
        { success: false, error: 'benefitsId is required' },
        { status: 400 }
      )
    }

    // Load CompanyBenefits
    const benefits = await prisma.companyBenefits.findUnique({
      where: {
        id: benefitsId,
      },
    })

    if (!benefits) {
      return NextResponse.json(
        { success: false, error: 'Benefits not found' },
        { status: 404 }
      )
    }

    if (!benefits.ingestRawText) {
      return NextResponse.json(
        { success: false, error: 'No raw text found for hydration' },
        { status: 400 }
      )
    }

    // Parse benefits data (pure function, no DB writes)
    const model = await parseBenefits(benefits.ingestRawText)

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[Benefits Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate benefits' },
      { status: 500 }
    )
  }
}
