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

// Schema for creating email digest edition (DRAFT)
const createEmailDigestEditionSchema = z.object({
  emailDigestId: z.string().uuid(),
})

// Schema for updating edition items (curation)
const updateEditionItemsSchema = z.object({
  editionId: z.string().uuid(),
  items: z.array(
    z.object({
      companyEventId: z.string().optional(),
      companyCampaignId: z.string().optional(),
      companyTrainingId: z.string().optional(),
      companyBenefitsId: z.string().optional(),
      companyImpactEventId: z.string().optional(),
      companyCommunityId: z.string().optional(),
      companyCareerId: z.string().optional(),
      companyEmployeeCauseId: z.string().optional(),
      notes: z.string().optional().nullable(),
    })
  ),
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
        companyId,
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
 * Create an email digest edition in DRAFT status (for curation)
 * This creates an empty edition that the user will populate with items
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
        companyId,
      },
    })

    if (!product) {
      return { success: false, error: 'Email digest product not found' }
    }

    // Create empty edition in DRAFT status
    const edition = await prisma.emailDigestEdition.create({
      data: {
        emailDigestId: validated.emailDigestId,
        status: 'DRAFT',
        contentJson: null, // Empty until generated
        originatorId: workMeId,
        companyId,
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
 * Get available CompanyX items for curation
 */
export async function getAvailableCompanyXItems() {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must set a companyId' }
    }

    // Query all CompanyX items for this company
    const [events, campaigns, trainings, benefits, impactEvents, communities, careers, employeeCauses] = await Promise.all([
      prisma.companyEvent.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true, eventDate: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCampaign.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true, windowStart: true, windowEnd: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyTraining.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true, trainingDate: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyBenefits.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true, windowStart: true, windowEnd: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyImpactEvent.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true, effectiveDate: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCommunity.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true, date: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCareer.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyEmployeeCause.findMany({
        where: { companyId },
        select: { id: true, title: true, description: true, summary: true, windowStart: true, windowEnd: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      success: true,
      items: {
        events,
        campaigns,
        trainings,
        benefits,
        impactEvents,
        communities,
        careers,
        employeeCauses,
      },
    }
  } catch (error) {
    console.error('Error fetching available CompanyX items:', error)
    return { success: false, error: 'Failed to fetch available items' }
  }
}

/**
 * Update edition items (curation)
 */
export async function updateEditionItems(data: z.infer<typeof updateEditionItemsSchema>) {
  try {
    const validated = updateEditionItemsSchema.parse(data)
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must set a companyId' }
    }

    // Verify edition exists and belongs to user's company
    const edition = await prisma.emailDigestEdition.findFirst({
      where: {
        id: validated.editionId,
        companyId,
      },
    })

    if (!edition) {
      return { success: false, error: 'Email digest edition not found' }
    }

    // Delete existing items
    await prisma.emailDigestItem.deleteMany({
      where: { editionId: validated.editionId },
    })

    // Create new items
    const items = await Promise.all(
      validated.items.map((item, index) =>
        prisma.emailDigestItem.create({
          data: {
            editionId: validated.editionId,
            companyEventId: item.companyEventId,
            companyCampaignId: item.companyCampaignId,
            companyTrainingId: item.companyTrainingId,
            companyBenefitsId: item.companyBenefitsId,
            companyImpactEventId: item.companyImpactEventId,
            companyCommunityId: item.companyCommunityId,
            companyCareerId: item.companyCareerId,
            companyEmployeeCauseId: item.companyEmployeeCauseId,
            notes: item.notes ?? undefined,
            order: index,
          },
        })
      )
    )

    return { success: true, items }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error updating edition items:', error)
    return { success: false, error: 'Failed to update edition items' }
  }
}

/**
 * Get edition with items for curation/editing
 */
export async function getEditionWithItems(editionId: string) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must set a companyId' }
    }

    const edition = await prisma.emailDigestEdition.findFirst({
      where: {
        id: editionId,
        companyId,
      },
      include: {
        product: true,
        items: {
          include: {
            companyEvent: true,
            companyCampaign: true,
            companyTraining: true,
            companyBenefits: true,
            companyImpactEvent: true,
            companyCommunity: true,
            companyCareer: true,
            companyEmployeeCause: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!edition) {
      return { success: false, error: 'Email digest edition not found' }
    }

    return { success: true, edition }
  } catch (error) {
    console.error('Error fetching edition:', error)
    return { success: false, error: 'Failed to fetch edition' }
  }
}

/**
 * Generate edition content using OpenAI (replaces placeholder)
 */
export async function generateEditionContent(editionId: string) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must set a companyId' }
    }

    // Get edition with items and related CompanyX data
    const edition = await prisma.emailDigestEdition.findFirst({
      where: {
        id: editionId,
        companyId,
      },
      include: {
        product: true,
        items: {
          include: {
            companyEvent: true,
            companyCampaign: true,
            companyTraining: true,
            companyBenefits: true,
            companyImpactEvent: true,
            companyCommunity: true,
            companyCareer: true,
            companyEmployeeCause: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!edition) {
      return { success: false, error: 'Email digest edition not found' }
    }

    if (edition.items.length === 0) {
      return { success: false, error: 'No items selected for this edition. Please add items first.' }
    }

    // Update status to GENERATING
    await prisma.emailDigestEdition.update({
      where: { id: editionId },
      data: { status: 'GENERATING' },
    })

    // Build prompt from selected items
    const promptText = buildPromptFromItems(edition.items)

    // TODO: Replace with actual OpenAI API call
    const generatedContent = await generateEmailDigestContent(promptText, edition.product.title)

    // Update edition with generated content
    await prisma.emailDigestEdition.update({
      where: { id: editionId },
      data: {
        status: 'GENERATED',
        contentJson: generatedContent,
      },
    })

    return { success: true, content: generatedContent }
  } catch (error) {
    console.error('Error generating edition content:', error)
    // Revert status on error
    try {
      await prisma.emailDigestEdition.update({
        where: { id: editionId },
        data: { status: 'DRAFT' },
      })
    } catch {}
    return { success: false, error: 'Failed to generate edition content' }
  }
}

// Helper function to build prompt from selected items
function buildPromptFromItems(items: any[]): string {
  const summaries: string[] = []

  items.forEach((item) => {
    const source =
      item.companyEvent ||
      item.companyCampaign ||
      item.companyTraining ||
      item.companyBenefits ||
      item.companyImpactEvent ||
      item.companyCommunity ||
      item.companyCareer ||
      item.companyEmployeeCause

    if (source) {
      const type = item.companyEvent
        ? 'EVENT'
        : item.companyCampaign
        ? 'CAMPAIGN'
        : item.companyTraining
        ? 'TRAINING'
        : item.companyBenefits
        ? 'BENEFITS'
        : item.companyImpactEvent
        ? 'IMPACT EVENT'
        : item.companyCommunity
        ? 'COMMUNITY'
        : item.companyCareer
        ? 'CAREER'
        : 'EMPLOYEE CAUSE'

      summaries.push(`[${type}] ${source.title}: ${source.summary || source.description || 'No description'}`)
      if (item.notes) {
        summaries.push(`  Note: ${item.notes}`)
      }
    }
  })

  return summaries.join('\n')
}

/**
 * Get email digest product by ID
 */
export async function getEmailDigestProduct(id: string) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must set a companyId' }
    }

    const product = await prisma.workForceEnduringProdEmailDigest.findFirst({
      where: {
        id,
        companyId,
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
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must set a companyId', products: [] }
    }

    const products = await prisma.workForceEnduringProdEmailDigest.findMany({
      where: {
        companyId,
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
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must set a companyId' }
    }

    const edition = await prisma.emailDigestEdition.findFirst({
      where: {
        id: editionId,
        companyId,
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
