/**
 * Digital Signage Product Builder Service
 * 
 * Service that builds complete digital signage products including:
 * - ProductDigitalSign record
 * - Type-specific data (WorkforceAchievement, CompanyNews, etc.)
 * - Asset attachments (blob-backed via DigitalSignAsset)
 * 
 * This is the service layer that orchestrates the full product creation.
 */

import { prisma } from '@/lib/prisma'
import { DigitalSignType } from '@prisma/client'
import { parseDigitalSignage, ParsedDigitalSignage } from '@/lib/ai/digitalSignageParser'

export interface BuildDigitalSignageProductInput {
  signType: DigitalSignType
  rawText?: string // If provided, will parse using AI
  companyUnit?: string | null
  createdByWorkMeId: string
  
  // Pre-parsed data (if not using rawText)
  workforceAchievement?: {
    personName: string
    unit?: string | null
    achievement: string
    details?: string | null
  }
  companyNews?: {
    headline: string
    subheadline?: string | null
    body?: string | null
    link?: string | null
    thumbnail?: string | null
  }
  workforce?: {
    title: string
    summary?: string | null
    bullets?: string[] | null
    imageUrl?: string | null
    footerNote?: string | null
  }
  companyEvent?: {
    eventName: string
    eventDate?: string | null
    startTime?: string | null
    endTime?: string | null
    location?: string | null
    description?: string | null
    perks?: string[] | null
    registrationLink?: string | null
  }
  
  // Asset attachments (blob URLs or asset IDs)
  assetIds?: string[] // Asset IDs to link via DigitalSignAsset
}

export interface BuiltDigitalSignageProduct {
  signage: {
    id: string
    signType: DigitalSignType
    companyUnit: string | null
    createdAt: Date
    updatedAt: Date
    workforceAchievement?: any
    companyNews?: any
    workforce?: any
    companyEvent?: any
    assetAttachments: Array<{
      id: string
      assetId: string
      asset: any
    }>
  }
}

/**
 * Build a complete digital signage product
 * Handles parsing (if rawText provided), product creation, and asset linking
 */
export async function buildDigitalSignageProduct(
  input: BuildDigitalSignageProductInput
): Promise<BuiltDigitalSignageProduct> {
  const { signType, rawText, companyUnit, createdByWorkMeId, assetIds = [] } = input

  // Step 1: Parse raw text if provided, otherwise use pre-parsed data
  let parsedData: ParsedDigitalSignage | null = null
  
  if (rawText) {
    parsedData = await parseDigitalSignage(rawText, signType)
  }

  // Step 2: Determine the data to use (parsed or provided)
  let workforceAchievement = input.workforceAchievement
  let companyNews = input.companyNews
  let workforce = input.workforce
  let companyEvent = input.companyEvent

  if (parsedData) {
    switch (parsedData.type) {
      case 'WORKFORCE_ACHIEVEMENT':
        workforceAchievement = parsedData.data
        break
      case 'COMPANY_NEWS':
        companyNews = parsedData.data
        break
      case 'WORKFORCE':
        workforce = parsedData.data
        break
      case 'COMPANY_EVENT':
        companyEvent = parsedData.data
        break
    }
  }

  // Step 3: Validate required data for sign type
  if (signType === DigitalSignType.WORKFORCE_ACHIEVEMENT && !workforceAchievement) {
    throw new Error('workforceAchievement data is required for WORKFORCE_ACHIEVEMENT sign type')
  }
  if (signType === DigitalSignType.COMPANY_NEWS && !companyNews) {
    throw new Error('companyNews data is required for COMPANY_NEWS sign type')
  }
  if (signType === DigitalSignType.WORKFORCE && !workforce) {
    throw new Error('workforce data is required for WORKFORCE sign type')
  }
  if (signType === DigitalSignType.COMPANY_EVENT && !companyEvent) {
    throw new Error('companyEvent data is required for COMPANY_EVENT sign type')
  }

  // Step 4: Create the ProductDigitalSign with type-specific data
  const signage = await prisma.productDigitalSign.create({
    data: {
      signType,
      companyUnit: companyUnit || null,
      createdByWorkMeId,
      ...(signType === DigitalSignType.WORKFORCE_ACHIEVEMENT && workforceAchievement && {
        workforceAchievement: {
          create: {
            personName: workforceAchievement.personName,
            unit: workforceAchievement.unit || null,
            achievement: workforceAchievement.achievement,
            details: workforceAchievement.details || null,
          }
        }
      }),
      ...(signType === DigitalSignType.COMPANY_NEWS && companyNews && {
        companyNews: {
          create: {
            headline: companyNews.headline,
            subheadline: companyNews.subheadline || null,
            body: companyNews.body || null,
            link: companyNews.link || null,
          }
        }
      }),
      ...(signType === DigitalSignType.WORKFORCE && workforce && {
        workforce: {
          create: {
            title: workforce.title,
            summary: workforce.summary || null,
            bullets: workforce.bullets || [],
            icon: null, // Set via assets
            background: null, // Set via assets
            footerNote: workforce.footerNote || null,
          }
        }
      }),
      ...(signType === DigitalSignType.COMPANY_EVENT && companyEvent && {
        companyEvent: {
          create: {
            eventName: companyEvent.eventName,
            eventDate: companyEvent.eventDate ? new Date(companyEvent.eventDate) : null,
            startTime: companyEvent.startTime || null,
            endTime: companyEvent.endTime || null,
            location: companyEvent.location || null,
            description: companyEvent.description || null,
            perks: companyEvent.perks || [],
            registrationLink: companyEvent.registrationLink || null,
          }
        }
      }),
    },
    include: {
      workforceAchievement: true,
      companyNews: true,
      workforce: true,
      companyEvent: true,
    }
  })

  // Step 5: Link assets via DigitalSignAsset (blob-backed system)
  if (assetIds.length > 0) {
    // Verify assets exist
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: assetIds }
      }
    })

    if (assets.length !== assetIds.length) {
      throw new Error('Some asset IDs not found')
    }

    // Create DigitalSignAsset links
    await prisma.digitalSignAsset.createMany({
      data: assetIds.map(assetId => ({
        assetId,
        signageId: signage.id,
      })),
      skipDuplicates: true,
    })
  }

  // Step 6: Fetch complete product with assets
  const completeSignage = await prisma.productDigitalSign.findUnique({
    where: { id: signage.id },
    include: {
      workforceAchievement: true,
      companyNews: true,
      workforce: true,
      companyEvent: true,
      assetAttachments: {
        include: {
          asset: true,
        }
      }
    }
  })

  if (!completeSignage) {
    throw new Error('Failed to retrieve created signage')
  }

  return {
    signage: {
      id: completeSignage.id,
      signType: completeSignage.signType,
      companyUnit: completeSignage.companyUnit,
      createdAt: completeSignage.createdAt,
      updatedAt: completeSignage.updatedAt,
      workforceAchievement: completeSignage.workforceAchievement,
      companyNews: completeSignage.companyNews,
      workforce: completeSignage.workforce,
      companyEvent: completeSignage.companyEvent,
      assetAttachments: completeSignage.assetAttachments.map(att => ({
        id: att.id,
        assetId: att.assetId,
        asset: att.asset,
      })),
    }
  }
}
