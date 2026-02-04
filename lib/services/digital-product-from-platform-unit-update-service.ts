/**
 * Digital Product From Platform Unit Update Service
 * 
 * Generates a ProductDigitalSign from a CompanyPlatformUnitUpdate.
 * 
 * This service handles platform unit updates (builders trials, sea trials, keel laying, etc.)
 * and produces workforce-facing digital signage products.
 */

import { prisma } from '@/lib/prisma'
import { DigitalSignType } from '@prisma/client'
import { buildDigitalSignageProduct } from './digital-signage-product-builder-service'

export interface DigitalProductFromUnitUpdateInput {
  updateId: string
  createdByWorkMeId: string
  companyUnit?: string | null
}

export interface DigitalProductFromUnitUpdateResult {
  digitalSign: {
    id: string
    signType: DigitalSignType
    companyUnit: string | null
    createdAt: Date
    updatedAt: Date
    companyNews: {
      headline: string
      subheadline: string | null
      body: string | null
      link: string | null
    } | null
  }
  platformUnit: {
    id: string
    name: string | null
    hullNumber: string
    currentStatus: string | null
  }
  update: {
    id: string
    statusUpdate: string | null
    narrativeSummary: string | null
  }
}

/**
 * Generate a ProductDigitalSign from a CompanyPlatformUnitUpdate
 * 
 * @param input - Service input parameters
 * @returns Created digital sign product and platform unit/update data
 * @throws Error if update not found or validation fails
 */
export async function digitalProductFromPlatformUnitUpdateService(
  input: DigitalProductFromUnitUpdateInput
): Promise<DigitalProductFromUnitUpdateResult> {
  const { updateId, createdByWorkMeId, companyUnit } = input

  // Step 1: Fetch and validate the platform unit update
  const update = await prisma.companyPlatformUnitUpdate.findUnique({
    where: { id: updateId },
    include: {
      platformUnit: {
        include: {
          platformProduct: {
            select: {
              name: true,
              category: true,
            },
          },
        },
      },
      statement: {
        select: {
          id: true,
          headline: true,
          sourceName: true,
          sourceUrl: true,
          rawText: true,
          aiSummary: true,
        },
      },
    },
  })

  if (!update) {
    throw new Error(`Platform unit update with id ${updateId} not found`)
  }

  const unit = update.platformUnit

  // Step 2: Validate platform unit exists
  if (!unit.platformProduct) {
    throw new Error(
      `Platform unit ${unit.id} is not associated with a platform product`
    )
  }

  const platformClass = unit.platformClass || unit.platformProduct.name
  if (!platformClass) {
    throw new Error(
      `Platform class is required for unit ${unit.id} but not found`
    )
  }

  // Step 3: Build headline from status update or unit name
  const unitName = unit.name || unit.hullNumber
  let headline = ''
  
  if (update.statusUpdate) {
    // Use status update as the main headline (e.g., "Builder's Trials", "Sea Trials")
    headline = `${unitName ? `USS ${unitName} ` : ''}${update.statusUpdate}`
  } else {
    // Fallback to unit name with platform class
    headline = unitName 
      ? `USS ${unitName} ${platformClass} Update`
      : `${platformClass} Unit Update`
  }

  // Step 4: Build subheadline
  // Include platform class and relevant dates if available
  let subheadline = `${platformClass}`
  
  if (unit.shipyard || unit.defenseContractor) {
    const shipyard = unit.shipyard || unit.defenseContractor
    subheadline += ` | ${shipyard}`
  }

  // Add date information if available
  const relevantDate = update.seaTrialsStartDate || update.deliveryDate || update.commissioningDate || update.keelLaidDate
  if (relevantDate) {
    const dateStr = new Date(relevantDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    subheadline += ` | ${dateStr}`
  }

  // Step 5: Build body text
  // Prefer narrative summary, then AI summary from statement, then status update details
  let body = ''
  
  if (update.narrativeSummary) {
    body = update.narrativeSummary
  } else if (update.statement?.aiSummary) {
    body = update.statement.aiSummary
  } else {
    // Build from available fields
    const parts: string[] = []
    
    if (update.statusUpdate) {
      parts.push(`Status: ${update.statusUpdate}`)
    }
    
    if (update.percentComplete !== null) {
      parts.push(`Progress: ${update.percentComplete}% complete`)
    }
    
    if (update.scheduleNote) {
      parts.push(update.scheduleNote)
    }
    
    if (update.industrialBaseNote) {
      parts.push(update.industrialBaseNote)
    }
    
    if (update.leadershipQuote) {
      parts.push(`"${update.leadershipQuote}"`)
    }
    
    body = parts.join('. ')
  }

  // If body is still empty, use a default message
  if (!body) {
    body = `Update on ${unitName || 'platform unit'} progress and status.`
  }

  // Step 6: Get link from statement if available
  const link = update.statement?.sourceUrl || null

  // Step 7: Create the digital signage product using COMPANY_NEWS type
  // Platform unit updates are workforce-facing news about unit progress
  const digitalSignResult = await buildDigitalSignageProduct({
    signType: DigitalSignType.COMPANY_NEWS,
    companyUnit: companyUnit || null,
    createdByWorkMeId,
    companyNews: {
      headline,
      subheadline,
      body,
      link,
    },
    assetIds: [],
  })

  // Step 8: Return the created digital product
  return {
    digitalSign: {
      id: digitalSignResult.signage.id,
      signType: digitalSignResult.signage.signType,
      companyUnit: digitalSignResult.signage.companyUnit,
      createdAt: digitalSignResult.signage.createdAt,
      updatedAt: digitalSignResult.signage.updatedAt,
      companyNews: digitalSignResult.signage.companyNews
        ? {
            headline: digitalSignResult.signage.companyNews.headline,
            subheadline: digitalSignResult.signage.companyNews.subheadline,
            body: digitalSignResult.signage.companyNews.body,
            link: digitalSignResult.signage.companyNews.link,
          }
        : null,
    },
    platformUnit: {
      id: unit.id,
      name: unit.name,
      hullNumber: unit.hullNumber,
      currentStatus: unit.currentStatus,
    },
    update: {
      id: update.id,
      statusUpdate: update.statusUpdate,
      narrativeSummary: update.narrativeSummary,
    },
  }
}
