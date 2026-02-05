/**
 * WorkOps Daily Assignments Service
 * 
 * Database service functions for WorkOpsDailyAssignment model
 */

import { prisma } from '@/lib/prisma'

export interface CreateDailyAssignmentData {
  outlookId: string
  itemId: string
  day: Date
  dayIndex?: number | null
}

/**
 * Get daily assignments for a specific day
 */
export async function getDailyAssignments(outlookId: string, day: Date) {
  // Normalize day to start of day (midnight)
  const startOfDay = new Date(day)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(day)
  endOfDay.setHours(23, 59, 59, 999)

  const assignments = await prisma.workOpsDailyAssignment.findMany({
    where: {
      outlookId,
      day: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      item: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return assignments
}

/**
 * Get daily assignments for a date range
 */
export async function getDailyAssignmentsRange(
  outlookId: string,
  startDate: Date,
  endDate: Date
) {
  const startOfStartDay = new Date(startDate)
  startOfStartDay.setHours(0, 0, 0, 0)
  
  const endOfEndDay = new Date(endDate)
  endOfEndDay.setHours(23, 59, 59, 999)

  const assignments = await prisma.workOpsDailyAssignment.findMany({
    where: {
      outlookId,
      day: {
        gte: startOfStartDay,
        lte: endOfEndDay,
      },
    },
    include: {
      item: true,
    },
    orderBy: {
      day: 'asc',
      createdAt: 'asc',
    },
  })

  return assignments
}

/**
 * Create a daily assignment
 */
export async function createDailyAssignment(data: CreateDailyAssignmentData) {
  // Normalize day to start of day (midnight)
  const day = new Date(data.day)
  day.setHours(0, 0, 0, 0)

  console.log('[createDailyAssignment]', {
    outlookId: data.outlookId,
    itemId: data.itemId,
    day: day.toISOString(),
  })

  // Check if assignment already exists
  const existing = await prisma.workOpsDailyAssignment.findUnique({
    where: {
      itemId_day: {
        itemId: data.itemId,
        day: day,
      },
    },
    include: {
      item: true,
    },
  })

  if (existing) {
    return existing
  }

  const assignment = await prisma.workOpsDailyAssignment.create({
    data: {
      outlookId: data.outlookId,
      itemId: data.itemId,
      day: day,
      dayIndex: data.dayIndex || null,
    },
    include: {
      item: true,
    },
  })

  console.log('[createDailyAssignment] SUCCESS', { assignmentId: assignment.id })

  return assignment
}

/**
 * Delete a daily assignment
 */
export async function deleteDailyAssignment(assignmentId: string) {
  console.log('[deleteDailyAssignment]', { assignmentId })

  const assignment = await prisma.workOpsDailyAssignment.delete({
    where: { id: assignmentId },
  })

  console.log('[deleteDailyAssignment] SUCCESS', { assignmentId })

  return assignment
}

/**
 * Delete a daily assignment by itemId and day
 */
export async function deleteDailyAssignmentByItemAndDay(
  itemId: string,
  day: Date
) {
  // Normalize day to start of day (midnight)
  const normalizedDay = new Date(day)
  normalizedDay.setHours(0, 0, 0, 0)

  console.log('[deleteDailyAssignmentByItemAndDay]', {
    itemId,
    day: normalizedDay.toISOString(),
  })

  const assignment = await prisma.workOpsDailyAssignment.delete({
    where: {
      itemId_day: {
        itemId,
        day: normalizedDay,
      },
    },
  })

  console.log('[deleteDailyAssignmentByItemAndDay] SUCCESS', {
    assignmentId: assignment.id,
  })

  return assignment
}

/**
 * Get all unassigned items (items not assigned to any day)
 */
export async function getUnassignedItems(outlookId: string) {
  const allItems = await prisma.workOpsItem.findMany({
    where: { outlookId },
    include: {
      dailyAssignments: true,
    },
  })

  const unassignedItems = allItems.filter(
    (item) => item.dailyAssignments.length === 0
  )

  return unassignedItems
}
