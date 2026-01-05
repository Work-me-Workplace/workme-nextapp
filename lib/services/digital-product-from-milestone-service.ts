/**
 * Digital Product From Milestone Service
 * 
 * Generates a ProductDigitalSign from any CompanyMilestone
 * Uses the milestone's news artifact context when available
 */

import { prisma } from '@/lib/prisma'
import { DigitalSignType } from '@prisma/client'
import { buildDigitalSignageProduct } from './digital-signage-product-builder-service'

export interface DigitalProductFromMilestoneInput {
  milestoneId: string
  createdByWorkMeId: string
  companyUnit?: string | null
}

export interface DigitalProductFromMilestoneResult {
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
  milestone: {
    id: string
    title: string
    category: string | null
    milestoneType: string | null
    date: Date | null
  }
}

/**
 * Generate a ProductDigitalSign from any CompanyMilestone
 * 
 * @param input - Service input parameters
 * @returns Created digital sign product and milestone data
 * @throws Error if milestone not found or validation fails
 */
export async function digitalProductFromMilestoneService(
  input: DigitalProductFromMilestoneInput
): Promise<DigitalProductFromMilestoneResult> {
  const { milestoneId, createdByWorkMeId, companyUnit } = input

  // Step 1: Fetch the milestone with news artifact
  const milestone = await prisma.companyMilestone.findUnique({
    where: { id: milestoneId },
    include: {
      newsArtifact: {
        select: {
          id: true,
          headline: true,
          sourceName: true,
          sourceUrl: true,
          rawText: true,
          aiSummary: true,
          humanElements: true,
          noteworthyItems: true,
          leaderStatement: true,
        },
      },
      platformUnit: {
        select: {
          id: true,
          name: true,
          hullNumber: true,
          platformProduct: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!milestone) {
    throw new Error(`Milestone with id ${milestoneId} not found`)
  }

  // Step 2: Build the digital sign content
  // Use milestone title as headline
  const headline = milestone.title

  // Build subheadline from milestone details and news artifact
  let subheadline: string | null = null
  
  if (milestone.platformUnit) {
    // If platform unit exists, include it in the subheadline
    const unitName = milestone.platformUnit.name || milestone.platformUnit.hullNumber
    const productName = milestone.platformUnit.platformProduct?.name || 'Platform'
    subheadline = `${productName} ${unitName}`
  } else if (milestone.newsArtifact?.sourceName) {
    // Otherwise use source name if available
    subheadline = `Source: ${milestone.newsArtifact.sourceName}`
  }

  // Use description or AI summary as body
  let body: string | null = milestone.description || null
  
  if (!body && milestone.newsArtifact?.aiSummary) {
    body = milestone.newsArtifact.aiSummary
  }

  // Enhance body with leader statement if available
  if (milestone.newsArtifact?.leaderStatement && typeof milestone.newsArtifact.leaderStatement === 'object') {
    const leaderStatement = milestone.newsArtifact.leaderStatement as any
    if (leaderStatement.statement && leaderStatement.leader) {
      const quote = `"${leaderStatement.statement}" — ${leaderStatement.leader}`
      body = body ? `${body}\n\n${quote}` : quote
    }
  }

  // Use source URL from milestone or news artifact
  const link = milestone.sourceUrl || milestone.newsArtifact?.sourceUrl || null

  // Step 3: Create the digital signage product
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

  // Step 4: Return the created digital product
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
    milestone: {
      id: milestone.id,
      title: milestone.title,
      category: milestone.category,
      milestoneType: milestone.milestoneType,
      date: milestone.date,
    },
  }
}

