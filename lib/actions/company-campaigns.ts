'use server'

import { prisma } from '../prisma'
import { z } from 'zod'

const getUserId = (): string => {
  return 'user-1' // Placeholder - replace with actual auth
}

const companyCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
})

export async function createCompanyCampaign(data: z.infer<typeof companyCampaignSchema>) {
  try {
    const validated = companyCampaignSchema.parse(data)
    const userId = getUserId()

    const campaign = await prisma.companyCampaign.create({
      data: {
        ...validated,
        userId,
        description: validated.description ?? undefined,
        startDate: validated.startDate ?? undefined,
        endDate: validated.endDate ?? undefined,
      },
    })

    return { success: true, campaign }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create company campaign' }
  }
}

export async function updateCompanyCampaign(id: string, data: z.infer<typeof companyCampaignSchema>) {
  try {
    const validated = companyCampaignSchema.parse(data)
    const userId = getUserId()

    const existing = await prisma.companyCampaign.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return { success: false, error: 'Company campaign not found' }
    }

    const campaign = await prisma.companyCampaign.update({
      where: { id },
      data: {
        ...validated,
        description: validated.description ?? undefined,
        startDate: validated.startDate ?? undefined,
        endDate: validated.endDate ?? undefined,
      },
    })

    return { success: true, campaign }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update company campaign' }
  }
}

export async function deleteCompanyCampaign(id: string) {
  try {
    const userId = getUserId()

    const existing = await prisma.companyCampaign.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return { success: false, error: 'Company campaign not found' }
    }

    await prisma.companyCampaign.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete company campaign' }
  }
}

export async function getCompanyCampaigns() {
  try {
    const userId = getUserId()

    const campaigns = await prisma.companyCampaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, campaigns }
  } catch (error) {
    return { success: false, error: 'Failed to fetch company campaigns', campaigns: [] }
  }
}

export async function getCompanyCampaign(id: string) {
  try {
    const userId = getUserId()

    const campaign = await prisma.companyCampaign.findFirst({
      where: { id, userId },
    })

    if (!campaign) {
      return { success: false, error: 'Company campaign not found' }
    }

    return { success: true, campaign }
  } catch (error) {
    return { success: false, error: 'Failed to fetch company campaign' }
  }
}

