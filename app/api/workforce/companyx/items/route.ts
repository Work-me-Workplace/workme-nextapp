import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// GET /api/workforce/companyx/items?startDate=2025-12-01&endDate=2025-12-31
// OR
// GET /api/workforce/companyx/items?type=CompanyEvent
// OR
// GET /api/workforce/companyx/items (get all recent - last 90 days)
export async function GET(req: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(req)
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'User must set a companyId' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // By type - get latest 50
    if (type) {
      let items: any[] = []
      const limit = 50

      switch (type) {
        case 'CompanyEvent':
          items = await prisma.companyEvent.findMany({
            where: { companyId },
            select: {
              id: true,
              title: true,
              theme: true,
              description: true,
              eventDate: true,
              startTime: true,
              endTime: true,
              registrationRequired: true,
              registrationLink: true,
              pocEmail: true,
              pocPhone: true,
              ingestRawText: true, // Include raw text for AI generation
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
          break
        case 'CompanyTraining':
          items = await prisma.companyTraining.findMany({
            where: { companyId },
            select: {
              id: true,
              title: true,
              topic: true,
              description: true,
              mandatory: true,
              trainingDate: true,
              startTime: true,
              endTime: true,
              location: true,
              format: true,
              link: true,
              pocFirstName: true,
              pocLastName: true,
              pocEmail: true,
              pocPhone: true,
              ingestRawText: true, // Include raw text for AI generation
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
          break
        case 'CompanyCampaign':
          items = await prisma.companyCampaign.findMany({
            where: { companyId },
            select: {
              id: true,
              title: true,
              description: true,
              summary: true,
              windowStart: true,
              windowEnd: true,
              pocFirstName: true,
              pocLastName: true,
              pocEmail: true,
              ingestRawText: true, // Include raw text for AI generation
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
          break
        case 'CompanyBenefits':
          items = await prisma.companyBenefits.findMany({
            where: { companyId },
            select: {
              id: true,
              title: true,
              description: true,
              windowStart: true,
              windowEnd: true,
              ingestRawText: true, // Include raw text for AI generation
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
          break
        case 'CompanyImpactEvent':
          items = await prisma.companyImpactEvent.findMany({
            where: { companyId },
            select: {
              id: true,
              title: true,
              description: true,
              summary: true,
              effectiveDate: true,
              urgency: true,
              impactedPopulation: true,
              ingestRawText: true, // CRITICAL for timekeeping - full blob
              pocFirstName: true,
              pocLastName: true,
              pocEmail: true,
              pocPhone: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
          break
        case 'CompanyCommunity':
          items = await prisma.companyCommunity.findMany({
            where: { companyId },
            select: {
              id: true,
              title: true,
              description: true,
              date: true,
              pocFirstName: true,
              pocLastName: true,
              pocEmail: true,
              ingestRawText: true, // Include raw text for AI generation
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
          break
        case 'CompanyCareer':
          items = await prisma.companyCareer.findMany({
            where: { companyId },
            select: {
              id: true,
              title: true,
              description: true,
              ingestRawText: true, // Include raw text for AI generation
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
          break
        case 'CompanyEmployeeCause':
          items = await prisma.companyEmployeeCause.findMany({
            where: { companyId },
            select: {
              id: true,
              title: true,
              description: true,
              windowStart: true,
              windowEnd: true,
              ingestRawText: true, // Include raw text for AI generation
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
          break
        default:
          return NextResponse.json(
            { success: false, error: `Unknown type: ${type}` },
            { status: 400 }
          )
      }

      console.log(`[CompanyX Items API] Returning ${items.length} items for type ${type}`)
      
      return NextResponse.json({
        success: true,
        items: { [type]: items },
        count: { [type]: items.length },
      })
    }

    // By date range - not implemented yet for simplicity
    if (startDate && endDate) {
      return NextResponse.json(
        { success: false, error: 'Date range not yet implemented, use type filter' },
        { status: 400 }
      )
    }

    // Get all recent (last 90 days across all types)
    return NextResponse.json(
      { success: false, error: 'Must provide type parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in companyx/items route:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch items', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
