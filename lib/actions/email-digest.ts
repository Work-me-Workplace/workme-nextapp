'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Schema for creating email digest product
const createEmailDigestProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
})

// Schema for creating email digest edition
const createEmailDigestEditionSchema = z.object({
  emailDigestId: z.string().uuid(),
})

/**
 * Create an email digest product
 */
export async function createEmailDigestProduct(data: z.infer<typeof createEmailDigestProductSchema>) {
  try {
    const validated = createEmailDigestProductSchema.parse(data)
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must set a companyId' }
    }

    const product = await prisma.workForceEnduringProdEmailDigest.create({
      data: {
        title: validated.title,
        description: validated.description ?? undefined,
        companyUnit: companyId, // Note: WorkForceEnduringProdEmailDigest still uses companyUnit field
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, product }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error creating email digest product:', error)
    return { success: false, error: 'Failed to create email digest product' }
  }
}

/**
 * Create an email digest edition
 * Queries all CompanyX summaries and generates content via OpenAI
 */
export async function createEmailDigestEdition(data: z.infer<typeof createEmailDigestEditionSchema>) {
  try {
    const validated = createEmailDigestEditionSchema.parse(data)
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must set a companyId' }
    }

    // Verify product exists and belongs to user's company
    const product = await prisma.workForceEnduringProdEmailDigest.findFirst({
      where: {
        id: validated.emailDigestId,
        companyUnit: companyId, // Note: WorkForceEnduringProdEmailDigest still uses companyUnit field
      },
    })

    if (!product) {
      return { success: false, error: 'Email digest product not found' }
    }

    // Query all CompanyX summaries for this company
    const [events, campaigns, trainings, benefits, impactEvents, communities, careers, employeeCauses] = await Promise.all([
      prisma.companyEvent.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true },
      }),
      prisma.companyCampaign.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true },
      }),
      prisma.companyTraining.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true },
      }),
      prisma.companyBenefits.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true },
      }),
      prisma.companyImpactEvent.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true },
      }),
      prisma.companyCommunity.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true },
      }),
      prisma.companyCareer.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true },
      }),
      prisma.companyEmployeeCause.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true },
      }),
    ])

    // Build prompt string from CompanyX summaries
    const summaries: string[] = []

    if (events.length > 0) {
      summaries.push('EVENTS:')
      events.forEach((event) => {
        summaries.push(`- ${event.title}: ${event.summary || event.description || 'No description'}`)
      })
    }

    if (campaigns.length > 0) {
      summaries.push('\nCAMPAIGNS:')
      campaigns.forEach((campaign) => {
        summaries.push(`- ${campaign.title}: ${campaign.summary || campaign.description || 'No description'}`)
      })
    }

    if (trainings.length > 0) {
      summaries.push('\nTRAINING:')
      trainings.forEach((training) => {
        summaries.push(`- ${training.title}: ${training.summary || training.description || 'No description'}`)
      })
    }

    if (benefits.length > 0) {
      summaries.push('\nBENEFITS:')
      benefits.forEach((benefit) => {
        summaries.push(`- ${benefit.title}: ${benefit.summary || benefit.description || 'No description'}`)
      })
    }

    if (impactEvents.length > 0) {
      summaries.push('\nIMPACT EVENTS:')
      impactEvents.forEach((impact) => {
        summaries.push(`- ${impact.title}: ${impact.summary || impact.description || 'No description'}`)
      })
    }

    if (communities.length > 0) {
      summaries.push('\nCOMMUNITY:')
      communities.forEach((community) => {
        summaries.push(`- ${community.title}: ${community.summary || community.description || 'No description'}`)
      })
    }

    if (careers.length > 0) {
      summaries.push('\nCAREER:')
      careers.forEach((career) => {
        summaries.push(`- ${career.title}: ${career.summary || career.description || 'No description'}`)
      })
    }

    if (employeeCauses.length > 0) {
      summaries.push('\nEMPLOYEE CAUSES:')
      employeeCauses.forEach((cause) => {
        summaries.push(`- ${cause.title}: ${cause.summary || cause.description || 'No description'}`)
      })
    }

    const promptText = summaries.join('\n')

    // TODO: Replace with actual OpenAI API call
    // For now, return a placeholder response
    const generatedContent = await generateEmailDigestContent(promptText, product.title)

    // Create edition
    const edition = await prisma.emailDigestEdition.create({
      data: {
        emailDigestId: validated.emailDigestId,
        contentJson: generatedContent,
        originatorId: workMeId,
        companyUnit: companyId, // Note: EmailDigestEdition still uses companyUnit field
      },
    })

    return { success: true, edition }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error creating email digest edition:', error)
    return { success: false, error: 'Failed to create email digest edition' }
  }
}

/**
 * Get email digest product by ID
 */
export async function getEmailDigestProduct(id: string) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or user must set a companyUnit' }
    }

    const product = await prisma.workForceEnduringProdEmailDigest.findFirst({
      where: {
        id,
        companyUnit,
      },
      include: {
        editions: {
          orderBy: { generatedAt: 'desc' },
        },
      },
    })

    if (!product) {
      return { success: false, error: 'Email digest product not found' }
    }

    return { success: true, product }
  } catch (error) {
    console.error('Error fetching email digest product:', error)
    return { success: false, error: 'Failed to fetch email digest product' }
  }
}

/**
 * Get all email digest products for current user
 */
export async function getEmailDigestProducts() {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or user must set a companyUnit', products: [] }
    }

    const products = await prisma.workForceEnduringProdEmailDigest.findMany({
      where: {
        companyUnit,
      },
      include: {
        editions: {
          orderBy: { generatedAt: 'desc' },
          take: 1, // Get latest edition for preview
        },
        _count: {
          select: {
            editions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, products }
  } catch (error) {
    console.error('Error fetching email digest products:', error)
    return { success: false, error: 'Failed to fetch email digest products', products: [] }
  }
}

/**
 * Get email digest edition by ID
 */
export async function getEmailDigestEdition(editionId: string) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or user must set a companyUnit' }
    }

    const edition = await prisma.emailDigestEdition.findFirst({
      where: {
        id: editionId,
        companyUnit,
      },
      include: {
        product: true,
      },
    })

    if (!edition) {
      return { success: false, error: 'Email digest edition not found' }
    }

    return { success: true, edition }
  } catch (error) {
    console.error('Error fetching email digest edition:', error)
    return { success: false, error: 'Failed to fetch email digest edition' }
  }
}

// Placeholder function - replace with actual OpenAI API call
async function generateEmailDigestContent(promptText: string, productTitle: string): Promise<any> {
  // TODO: Implement actual OpenAI API integration
  // For now, return a placeholder structure
  return {
    subject: `${productTitle} - ${new Date().toLocaleDateString()}`,
    body: `This is a placeholder generated email digest.\n\nContent:\n${promptText.substring(0, 500)}...\n\nTODO: Integrate with OpenAI API to generate actual content.`,
    generatedAt: new Date().toISOString(),
  }
}

