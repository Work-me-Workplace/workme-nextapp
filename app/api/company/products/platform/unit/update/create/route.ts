import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processNewsArticle } from '@/lib/services/platform-update-service'

export async function POST(request: Request) {
  try {
    const {
      platformUnitId,
      rawText,
      sourceUrl,
      statementId, // Optional: if creating update from existing statement
      // CompanyPlatformUnitUpdate fields
      statusUpdate,
      percentComplete,
      scheduleNote,
      industrialBaseNote,
      leadershipQuote,
      keelLaidDate,
      seaTrialsStartDate,
      deliveryDate,
      commissioningDate,
      narrativeSummary,
      tags,
    } = await request.json()

    if (!platformUnitId) {
      return NextResponse.json(
        { success: false, error: 'Platform Unit ID is required' },
        { status: 400 }
      )
    }

    // Statement is OPTIONAL - update can exist independently
    // Only validate rawText/statementId if user is trying to create/link a statement
    // But update itself doesn't require either

    // Get the unit to find its platform product
    const unit = await prisma.companyPlatformUnit.findUnique({
      where: { id: platformUnitId },
      include: { platformProduct: true },
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'Platform unit not found' },
        { status: 404 }
      )
    }

    // Statement is OPTIONAL - bolt on for provenance
    // Only create/link statement if rawText or statementId provided
    let statementIdToLink: string | null = null
    
    if (statementId) {
      // Use existing statement (verify it belongs to this unit)
      const statement = await prisma.companyPlatformUnitStatement.findUnique({
        where: { id: statementId },
      })
      if (!statement || statement.platformUnitId !== platformUnitId) {
        return NextResponse.json(
          { success: false, error: 'Statement not found or does not belong to this unit' },
          { status: 404 }
        )
      }
      statementIdToLink = statementId
    } else if (rawText) {
      // Create new statement (optional - just for provenance)
      const statement = await prisma.companyPlatformUnitStatement.create({
        data: {
          platformUnitId,
          rawText,
          sourceUrl: sourceUrl || null,
          sourceName: null, // Could be extracted from URL or text
          headline: null, // Could be extracted from text
        },
      })
      statementIdToLink = statement.id
    }
    // If neither statementId nor rawText provided, that's fine - update exists independently

    // Create update - statementId is OPTIONAL (bolt on for provenance)
    // Update can exist independently with just the fields provided
    const update = await prisma.companyPlatformUnitUpdate.create({
      data: {
        platformUnitId, // REQUIRED - must belong to a unit
        statementId: statementIdToLink, // OPTIONAL - bolt on for provenance
        // All update fields are optional - include only what's provided
        statusUpdate: statusUpdate || null,
        percentComplete: percentComplete !== null && percentComplete !== undefined ? parseInt(String(percentComplete)) : null,
        scheduleNote: scheduleNote || null,
        industrialBaseNote: industrialBaseNote || null,
        leadershipQuote: leadershipQuote || null,
        keelLaidDate: keelLaidDate ? new Date(keelLaidDate) : null,
        seaTrialsStartDate: seaTrialsStartDate ? new Date(seaTrialsStartDate) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        commissioningDate: commissioningDate ? new Date(commissioningDate) : null,
        narrativeSummary: narrativeSummary || null,
        tags: Array.isArray(tags) ? tags : [],
      },
    })

    return NextResponse.json({
      success: true,
      update,
      statementId: statementIdToLink, // Return statementId if one was created/linked
    })
  } catch (error: any) {
    console.error('Failed to create unit update:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
