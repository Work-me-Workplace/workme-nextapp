/**
 * Digital Product From Company Milestone Delivery Service
 * 
 * Generates a ProductDigitalSign from a CompanyPlatformUnit DELIVERY milestone.
 * 
 * This service handles platform unit delivery milestones (not keel laying, not commissioning).
 * Delivery is an industrial lifecycle event that updates fleet capacity and unit status,
 * and should produce a workforce-facing digital signage product.
 */

import { prisma } from '@/lib/prisma'
import { DigitalSignType } from '@prisma/client'
import { buildDigitalSignageProduct } from './digital-signage-product-builder-service'

export interface DigitalProductFromDeliveryMilestoneInput {
  milestoneId: string
  createdByWorkMeId: string
  companyUnit?: string | null
}

export interface DigitalProductFromDeliveryMilestoneResult {
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
}

/**
 * Generate a ProductDigitalSign from a CompanyPlatformUnit DELIVERY milestone
 * 
 * @param input - Service input parameters
 * @returns Created digital sign product and updated platform unit
 * @throws Error if milestone is not a DELIVERY milestone or validation fails
 */
export async function digitalProductFromCompanyMilestoneDeliveryService(
  input: DigitalProductFromDeliveryMilestoneInput
): Promise<DigitalProductFromDeliveryMilestoneResult> {
  const { milestoneId, createdByWorkMeId, companyUnit } = input

  // Step 1: Fetch and validate the milestone
  const milestone = await prisma.companyMilestone.findUnique({
    where: { id: milestoneId },
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
    },
  })

  if (!milestone) {
    throw new Error(`Milestone with id ${milestoneId} not found`)
  }

  // Step 2: Validate milestone type and category
  if (milestone.milestoneType !== 'DELIVERY') {
    throw new Error(
      `Milestone type must be DELIVERY, but got ${milestone.milestoneType}`
    )
  }

  if (milestone.category !== 'PLATFORM_UNIT') {
    throw new Error(
      `Milestone category must be PLATFORM_UNIT, but got ${milestone.category}`
    )
  }

  // Step 3: Validate platform unit exists
  if (!milestone.platformUnit) {
    throw new Error(
      `Milestone ${milestoneId} is not associated with a platform unit`
    )
  }

  const unit = milestone.platformUnit

  // Step 4: Validate required unit fields
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

  const shipyard = unit.shipyard || unit.defenseContractor
  if (!shipyard) {
    throw new Error(
      `Shipyard/builder is required for unit ${unit.id} but not found`
    )
  }

  // Step 5: Calculate total delivered fleet count
  // Count units in the same platform product that have deliveryToFleetDate set
  // Exclude the current unit to avoid double-counting
  const deliveredUnits = await prisma.companyPlatformUnit.count({
    where: {
      platformProductId: unit.platformProductId,
      deliveryToFleetDate: {
        not: null,
      },
      id: {
        not: unit.id, // Exclude current unit
      },
    },
  })

  // Add 1 for the current unit being delivered
  const totalDeliveredCount = deliveredUnits + 1

  // Step 6: Generate ordinal suffix for delivery count (e.g., "26th", "1st", "2nd")
  const ordinalSuffix = (n: number): string => {
    const j = n % 10
    const k = n % 100
    if (j === 1 && k !== 11) return `${n}st`
    if (j === 2 && k !== 12) return `${n}nd`
    if (j === 3 && k !== 13) return `${n}rd`
    return `${n}th`
  }

  const deliveryOrdinal = ordinalSuffix(totalDeliveredCount)

  // Step 7: Build title
  const unitName = unit.name || unit.hullNumber
  const title = `USS ${unitName} Delivered to the Fleet`

  // Step 8: Build subhead (workforce-facing, emphasizing partnership and production)
  // Reference General Dynamics Electric Boat and NAVSEA
  // Identify the unit as a platform class submarine named for the state
  let shipyardName = shipyard
  if (shipyard.includes('Electric Boat') || shipyard.includes('General Dynamics')) {
    shipyardName = 'General Dynamics Electric Boat'
  }
  
  let subhead = `${shipyardName} and NAVSEA deliver the ${deliveryOrdinal} ${platformClass}`
  if (unit.name) {
    subhead += ` submarine named for ${unit.name}`
  } else {
    subhead += ' submarine'
  }

  // Step 9: Build additional line (one sentence describing increase in fleet capability and collaboration)
  const additionalLine = `This delivery strengthens our fleet's capabilities and demonstrates the continued partnership between our workforce, ${shipyard}, and the Navy in advancing undersea warfare capabilities.`

  // Step 10: Build tag (flush-right metadata)
  // Note: The tag should be displayed as flush-right metadata in the UI
  // Since ProductDigitalSignCompanyNews doesn't have a separate tag field,
  // this could be added to the body or handled as a separate metadata field in a future enhancement
  const tag = `Platform Delivery | USS ${unitName} (${unit.hullNumber})`

  // Step 11: Determine hero image
  // Use milestone image if provided, otherwise fall back to unit default image
  // For now, we'll leave this as null since there's no image field on milestone
  // The caller can attach images via assetIds if needed
  // Note: Explicitly exclude ceremonial imagery per requirements
  const heroImageAssetId: string | null = null

  // Step 13: Create the digital signage product using COMPANY_NEWS type
  // Note: The requirements mention tone: "INDUSTRIAL_SUCCESS" and visibility: "WORKFORCE"
  // These fields don't exist in the current schema but could be added as metadata fields
  // For now, the signType (COMPANY_NEWS) and companyUnit serve as indicators
  const digitalSignResult = await buildDigitalSignageProduct({
    signType: DigitalSignType.COMPANY_NEWS,
    companyUnit: companyUnit || null,
    createdByWorkMeId,
    companyNews: {
      headline: title,
      subheadline: subhead,
      body: additionalLine,
      link: milestone.sourceUrl || null,
    },
    assetIds: heroImageAssetId ? [heroImageAssetId] : [],
  })
  
  // Note: The digital sign is not directly linked to the milestone or platform unit
  // in the current schema. If linking is needed, consider adding:
  // - companyPlatformUnitId field to ProductDigitalSign
  // - companyPlatformUnitMilestoneId field to ProductDigitalSign
  // Or use a junction table for many-to-many relationships

  // Step 14: Update unit lifecycle status to DELIVERED_AWAITING_COMMISSION
  const updatedUnit = await prisma.companyPlatformUnit.update({
    where: { id: unit.id },
    data: {
      currentStatus: 'DELIVERED_AWAITING_COMMISSION',
      deliveryToFleetDate: milestone.date || new Date(),
    },
    select: {
      id: true,
      name: true,
      hullNumber: true,
      currentStatus: true,
    },
  })

  // Step 15: Return the created digital product
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
    platformUnit: updatedUnit,
  }
}





