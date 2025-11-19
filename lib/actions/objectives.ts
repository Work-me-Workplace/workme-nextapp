'use server'

import { prisma } from '../prisma'
import { z } from 'zod'

const getUserId = (): string => {
  return 'user-1' // Placeholder - replace with actual auth
}

const objectiveSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
})

export async function createObjective(data: z.infer<typeof objectiveSchema>) {
  try {
    const validated = objectiveSchema.parse(data)
    const userId = getUserId()

    const objective = await prisma.objective.create({
      data: {
        ...validated,
        userId,
        description: validated.description ?? undefined,
      },
    })

    return { success: true, objective }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create objective' }
  }
}

export async function getObjectives() {
  try {
    const userId = getUserId()

    const objectives = await prisma.objective.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, objectives }
  } catch (error) {
    return { success: false, error: 'Failed to fetch objectives', objectives: [] }
  }
}

