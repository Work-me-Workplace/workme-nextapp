'use server'

import { prisma } from '../prisma'
import { z } from 'zod'

const getUserId = (): string => {
  return 'user-1' // Placeholder - replace with actual auth
}

const milestoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  date: z.date().optional().nullable(),
  description: z.string().optional().nullable(),
})

export async function createMilestone(data: z.infer<typeof milestoneSchema>) {
  try {
    const validated = milestoneSchema.parse(data)
    const userId = getUserId()

    const milestone = await prisma.companyMilestone.create({
      data: {
        ...validated,
        userId,
        date: validated.date ?? undefined,
        description: validated.description ?? undefined,
      },
    })

    return { success: true, milestone }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create milestone' }
  }
}

export async function getMilestones() {
  try {
    const userId = getUserId()

    const milestones = await prisma.companyMilestone.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, milestones }
  } catch (error) {
    return { success: false, error: 'Failed to fetch milestones', milestones: [] }
  }
}

