'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { getWorkMeId } from '../getWorkMeId.server'

// ============================================
// ZOD SCHEMAS
// ============================================

const workforceCommsProductSchema = z.object({
  type: z.string().default('email'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
})

const workforceCommsDraftSchema = z.object({
  workforceCommsId: z.string().uuid(),
  contextIds: z.array(z.string()).optional().nullable(),
  lastEditionId: z.string().uuid().optional().nullable(),
  authorNotes: z.string().optional().nullable(),
  whatChanged: z.string().optional().nullable(),
  priorityNotes: z.string().optional().nullable(),
  status: z.enum(['drafting', 'readyForGeneration', 'needsReview', 'generating']).default('drafting'),
})

const workforceCommsEditionSchema = z.object({
  workforceCommsId: z.string().uuid(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  sentAt: z.date().optional().nullable(),
})

// ============================================
// PRODUCT LAYER (WorkforceComms)
// ============================================

export async function getWorkforceCommsProducts() {
  try {
    const products = await prisma.workforceComms.findMany({
      include: {
        editions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest edition for preview
        },
        drafts: {
          orderBy: { updatedAt: 'desc' },
          take: 1, // Get latest draft for preview
        },
        _count: {
          select: {
            editions: true,
            drafts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return { success: true, products }
  } catch (error) {
    console.error('Error fetching workforce comms products:', error)
    return { success: false, error: 'Failed to fetch products', products: [] }
  }
}

export async function getWorkforceCommsProduct(id: string) {
  try {
    const product = await prisma.workforceComms.findUnique({
      where: { workforceCommsId: id },
      include: {
        editions: {
          orderBy: { createdAt: 'desc' },
        },
        drafts: {
          orderBy: { updatedAt: 'desc' },
          include: {
            lastEdition: true,
          },
        },
      },
    })

    if (!product) {
      return { success: false, error: 'Product not found' }
    }

    return { success: true, product }
  } catch (error) {
    console.error('Error fetching workforce comms product:', error)
    return { success: false, error: 'Failed to fetch product' }
  }
}

export async function createWorkforceCommsProduct(data: z.infer<typeof workforceCommsProductSchema>) {
  try {
    const validated = workforceCommsProductSchema.parse(data)

    const product = await prisma.workforceComms.create({
      data: {
        type: validated.type || 'email',
        name: validated.name,
        description: validated.description ?? undefined,
      },
    })

    return { success: true, product }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error creating workforce comms product:', error)
    return { success: false, error: 'Failed to create product' }
  }
}

// ============================================
// DRAFT LAYER (WorkforceCommsDraft)
// ============================================

export async function getWorkforceCommsDrafts(productId: string) {
  try {
    const drafts = await prisma.workforceCommsDraft.findMany({
      where: { workforceCommsId: productId },
      include: {
        lastEdition: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return { success: true, drafts }
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return { success: false, error: 'Failed to fetch drafts', drafts: [] }
  }
}

export async function getWorkforceCommsDraft(draftId: string) {
  try {
    const draft = await prisma.workforceCommsDraft.findUnique({
      where: { draftId },
      include: {
        product: true,
        lastEdition: true,
      },
    })

    if (!draft) {
      return { success: false, error: 'Draft not found' }
    }

    return { success: true, draft }
  } catch (error) {
    console.error('Error fetching draft:', error)
    return { success: false, error: 'Failed to fetch draft' }
  }
}

export async function createWorkforceCommsDraft(data: z.infer<typeof workforceCommsDraftSchema>) {
  try {
    const validated = workforceCommsDraftSchema.parse(data)

    // Verify product exists
    const product = await prisma.workforceComms.findUnique({
      where: { workforceCommsId: validated.workforceCommsId },
    })

    if (!product) {
      return { success: false, error: 'Product not found' }
    }

    // Get latest edition if not specified
    let lastEditionId = validated.lastEditionId
    if (!lastEditionId) {
      const latestEdition = await prisma.workforceCommsEdition.findFirst({
        where: { workforceCommsId: validated.workforceCommsId },
        orderBy: { createdAt: 'desc' },
      })
      if (latestEdition) {
        lastEditionId = latestEdition.editionId
      }
    }

    const draft = await prisma.workforceCommsDraft.create({
      data: {
        workforceCommsId: validated.workforceCommsId,
        contextIds: validated.contextIds ? validated.contextIds : undefined,
        lastEditionId: lastEditionId || null,
        authorNotes: validated.authorNotes ?? undefined,
        whatChanged: validated.whatChanged ?? undefined,
        priorityNotes: validated.priorityNotes ?? undefined,
        status: validated.status || 'drafting',
      },
      include: {
        product: true,
        lastEdition: true,
      },
    })

    return { success: true, draft }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error creating draft:', error)
    return { success: false, error: 'Failed to create draft' }
  }
}

export async function updateWorkforceCommsDraft(
  draftId: string,
  data: Partial<z.infer<typeof workforceCommsDraftSchema>>
) {
  try {
    const draft = await prisma.workforceCommsDraft.update({
      where: { draftId },
      data: {
        contextIds: data.contextIds !== undefined ? (data.contextIds || null) : undefined,
        lastEditionId: data.lastEditionId !== undefined ? (data.lastEditionId || undefined) : undefined,
        authorNotes: data.authorNotes !== undefined ? (data.authorNotes ?? undefined) : undefined,
        whatChanged: data.whatChanged !== undefined ? (data.whatChanged ?? undefined) : undefined,
        priorityNotes: data.priorityNotes !== undefined ? (data.priorityNotes ?? undefined) : undefined,
        status: data.status,
      },
      include: {
        product: true,
        lastEdition: true,
      },
    })

    return { success: true, draft }
  } catch (error) {
    console.error('Error updating draft:', error)
    return { success: false, error: 'Failed to update draft' }
  }
}

// ============================================
// EDITION LAYER (WorkforceCommsEdition)
// ============================================

export async function getWorkforceCommsEditions(productId: string) {
  try {
    const editions = await prisma.workforceCommsEdition.findMany({
      where: { workforceCommsId: productId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, editions }
  } catch (error) {
    console.error('Error fetching editions:', error)
    return { success: false, error: 'Failed to fetch editions', editions: [] }
  }
}

export async function getWorkforceCommsEdition(editionId: string) {
  try {
    const edition = await prisma.workforceCommsEdition.findUnique({
      where: { editionId },
      include: {
        product: true,
      },
    })

    if (!edition) {
      return { success: false, error: 'Edition not found' }
    }

    return { success: true, edition }
  } catch (error) {
    console.error('Error fetching edition:', error)
    return { success: false, error: 'Failed to fetch edition' }
  }
}

export async function createWorkforceCommsEdition(data: z.infer<typeof workforceCommsEditionSchema>) {
  try {
    const validated = workforceCommsEditionSchema.parse(data)

    // Verify product exists
    const product = await prisma.workforceComms.findUnique({
      where: { workforceCommsId: validated.workforceCommsId },
    })

    if (!product) {
      return { success: false, error: 'Product not found' }
    }

    const edition = await prisma.workforceCommsEdition.create({
      data: {
        workforceCommsId: validated.workforceCommsId,
        subject: validated.subject,
        body: validated.body,
        sentAt: validated.sentAt ?? undefined,
      },
      include: {
        product: true,
      },
    })

    return { success: true, edition }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error creating edition:', error)
    return { success: false, error: 'Failed to create edition' }
  }
}

export async function markEditionAsSent(editionId: string) {
  try {
    const edition = await prisma.workforceCommsEdition.update({
      where: { editionId },
      data: {
        sentAt: new Date(),
      },
    })

    return { success: true, edition }
  } catch (error) {
    console.error('Error marking edition as sent:', error)
    return { success: false, error: 'Failed to mark edition as sent' }
  }
}

