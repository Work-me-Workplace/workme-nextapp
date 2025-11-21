/**
 * DEPRECATED - These models are deprecated and will be removed.
 * Commented out to prevent usage while preserving code for reference.
 */

/*
'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { getWorkMeId } from '../getWorkMeId.server'

const achievementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.enum([
    'INTERNAL_COMMS',
    'WORKFORCE_COMMS',
    'EVENT_SUPPORT',
    'EXECUTIVE_LEADERSHIP',
    'OPERATIONS_SUPPORT',
    'READINESS',
    'ADMIN',
    'COMMUNITY_ENGAGEMENT'
  ]),
  audienceName: z.string().optional(),
  audienceSize: z.number().int().positive().optional().nullable(),
  objectiveId: z.string().optional().nullable(),
  commsOutputId: z.string().optional().nullable(),
  whatYouDid: z.string().min(1, 'What you did is required'),
  frequency: z.string().optional().nullable(),
  volume: z.number().int().positive().optional().nullable(),
  processSteps: z.any().optional().nullable(), // JSON array
  impact: z.string().optional().nullable(),
})

export async function createAchievement(data: z.infer<typeof achievementSchema>) {
  try {
    const validated = achievementSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const achievement = await prisma.achievement.create({
      data: {
        ...validated,
        workMeId,
        audienceSize: validated.audienceSize ?? undefined,
        objectiveId: validated.objectiveId ?? undefined,
        commsOutputId: validated.commsOutputId ?? undefined,
        frequency: validated.frequency ?? undefined,
        volume: validated.volume ?? undefined,
        processSteps: validated.processSteps ?? undefined,
        impact: validated.impact ?? undefined,
      },
      include: {
        objective: true,
        commsOutput: true,
      },
    })

    return { success: true, achievement }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create achievement' }
  }
}

export async function updateAchievement(id: string, data: z.infer<typeof achievementSchema>) {
  try {
    const validated = achievementSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify ownership
    const existing = await prisma.achievement.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return { success: false, error: 'Achievement not found' }
    }

    const achievement = await prisma.achievement.update({
      where: { id },
      data: {
        ...validated,
        audienceSize: validated.audienceSize ?? undefined,
        objectiveId: validated.objectiveId ?? undefined,
        commsOutputId: validated.commsOutputId ?? undefined,
        frequency: validated.frequency ?? undefined,
        volume: validated.volume ?? undefined,
        processSteps: validated.processSteps ?? undefined,
        impact: validated.impact ?? undefined,
      },
      include: {
        objective: true,
        commsOutput: true,
      },
    })

    return { success: true, achievement }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update achievement' }
  }
}

export async function deleteAchievement(id: string) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const existing = await prisma.achievement.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return { success: false, error: 'Achievement not found' }
    }

    await prisma.achievement.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete achievement' }
  }
}

export async function getAchievements() {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated', achievements: [] }
    }

    const achievements = await prisma.achievement.findMany({
      where: { workMeId },
      include: {
        objective: true,
        commsOutput: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return { success: true, achievements }
  } catch (error) {
    return { success: false, error: 'Failed to fetch achievements', achievements: [] }
  }
}

export async function getAchievement(id: string) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const achievement = await prisma.achievement.findFirst({
      where: { id, workMeId },
      include: {
        objective: true,
        commsOutput: true,
      },
    })

    if (!achievement) {
      return { success: false, error: 'Achievement not found' }
    }

    return { success: true, achievement }
  } catch (error) {
    return { success: false, error: 'Failed to fetch achievement' }
  }
}
*/
