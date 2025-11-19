'use server'

import { prisma } from '../prisma'
import { z } from 'zod'

// For now, we'll use a placeholder userId. In production, this should come from session/auth
// TODO: Replace with actual user authentication
const getUserId = (): string => {
  // This should be replaced with actual auth logic
  return 'user-1' // Placeholder
}

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
  whatYouDid: z.string().min(1, 'What you did is required'),
  frequency: z.string().optional().nullable(),
  volume: z.number().int().positive().optional().nullable(),
  organizationalActivityId: z.string().optional().nullable(),
  commsOutputId: z.string().optional().nullable(),
  companyHappeningId: z.string().optional().nullable(),
  processSteps: z.any().optional().nullable(), // JSON array
  impact: z.string().optional().nullable(),
})

export async function createAchievement(data: z.infer<typeof achievementSchema>) {
  try {
    const validated = achievementSchema.parse(data)
    const userId = getUserId()

    const achievement = await prisma.achievement.create({
      data: {
        ...validated,
        userId,
        audienceSize: validated.audienceSize ?? undefined,
        objectiveId: validated.objectiveId ?? undefined,
        frequency: validated.frequency ?? undefined,
        volume: validated.volume ?? undefined,
        organizationalActivityId: validated.organizationalActivityId ?? undefined,
        commsOutputId: validated.commsOutputId ?? undefined,
        companyHappeningId: validated.companyHappeningId ?? undefined,
        processSteps: validated.processSteps ?? undefined,
        impact: validated.impact ?? undefined,
      },
      include: {
        objective: true,
        organizationalActivity: true,
        commsOutput: true,
        happening: true,
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
    const userId = getUserId()

    // Verify ownership
    const existing = await prisma.achievement.findFirst({
      where: { id, userId },
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
        frequency: validated.frequency ?? undefined,
        volume: validated.volume ?? undefined,
        organizationalActivityId: validated.organizationalActivityId ?? undefined,
        commsOutputId: validated.commsOutputId ?? undefined,
        companyHappeningId: validated.companyHappeningId ?? undefined,
        processSteps: validated.processSteps ?? undefined,
        impact: validated.impact ?? undefined,
      },
      include: {
        objective: true,
        organizationalActivity: true,
        commsOutput: true,
        happening: true,
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
    const userId = getUserId()

    const existing = await prisma.achievement.findFirst({
      where: { id, userId },
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
    const userId = getUserId()

    const achievements = await prisma.achievement.findMany({
      where: { userId },
      include: {
        objective: true,
        organizationalActivity: true,
        commsOutput: true,
        happening: true,
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
    const userId = getUserId()

    const achievement = await prisma.achievement.findFirst({
      where: { id, userId },
      include: {
        objective: true,
        organizationalActivity: true,
        commsOutput: true,
        happening: true,
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
