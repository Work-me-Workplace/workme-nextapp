/**
 * Auto-Carryover Service
 * 
 * Automatically carries forward uncompleted tasks from previous days to a target day
 */

import { prisma } from '@/lib/prisma'
import { createDailyAssignment } from './daily-assignments'

/**
 * Automatically carry forward uncompleted tasks from previous days to the target day
 * 
 * @param outlookId - The outlook ID
 * @param targetDay - The day to carry tasks forward to (defaults to today)
 * @returns Object with count of tasks carried over and any errors
 */
export async function autoCarryoverUncompletedTasks(
  outlookId: string,
  targetDay: Date
) {
  console.log('[autoCarryoverUncompletedTasks]', {
    outlookId,
    targetDay: targetDay.toISOString(),
  })

  // Normalize target day to start of day
  const startOfTargetDay = new Date(targetDay)
  startOfTargetDay.setHours(0, 0, 0, 0)

  // Find all uncompleted tasks that were assigned to days before the target day
  const uncompletedAssignments = await prisma.workOpsDailyAssignment.findMany({
    where: {
      outlookId,
      day: { lt: startOfTargetDay },
      item: {
        status: { not: 'done' },
      },
    },
    include: {
      item: true,
    },
    orderBy: [
      { day: 'desc' },
      { createdAt: 'asc' },
    ],
  })

  // Dedupe by item ID (keep most recent assignment)
  const byItemId = new Map<string, (typeof uncompletedAssignments)[0]>()
  for (const assignment of uncompletedAssignments) {
    if (!byItemId.has(assignment.itemId)) {
      byItemId.set(assignment.itemId, assignment)
    }
  }

  const uniqueItems = Array.from(byItemId.values())

  // Check which items are already assigned to the target day
  const endOfTargetDay = new Date(targetDay)
  endOfTargetDay.setHours(23, 59, 59, 999)

  const existingAssignments = await prisma.workOpsDailyAssignment.findMany({
    where: {
      outlookId,
      day: {
        gte: startOfTargetDay,
        lte: endOfTargetDay,
      },
    },
    select: {
      itemId: true,
    },
  })

  const existingItemIds = new Set(existingAssignments.map((a) => a.itemId))

  // Filter out items already assigned to target day
  const itemsToCarryOver = uniqueItems.filter(
    (a) => !existingItemIds.has(a.itemId)
  )

  console.log('[autoCarryoverUncompletedTasks]', {
    totalUncompleted: uniqueItems.length,
    alreadyAssigned: existingItemIds.size,
    toCarryOver: itemsToCarryOver.length,
  })

  // Create daily assignments for each item
  const results = {
    carriedOver: 0,
    failed: [] as string[],
    errors: [] as string[],
  }

  for (const assignment of itemsToCarryOver) {
    try {
      await createDailyAssignment({
        outlookId,
        itemId: assignment.itemId,
        day: startOfTargetDay,
      })
      results.carriedOver++
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error'
      results.failed.push(assignment.item.title)
      results.errors.push(`${assignment.item.title}: ${errorMsg}`)
      console.error(
        '[autoCarryoverUncompletedTasks] Failed to carry over item:',
        assignment.itemId,
        errorMsg
      )
    }
  }

  console.log('[autoCarryoverUncompletedTasks] SUCCESS', {
    carriedOver: results.carriedOver,
    failed: results.failed.length,
  })

  return results
}
