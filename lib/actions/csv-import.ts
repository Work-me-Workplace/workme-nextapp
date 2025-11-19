'use server'

import { prisma } from '../prisma'
import { createAchievement } from './achievements'

const getUserId = (): string => {
  return 'user-1' // Placeholder - replace with actual auth
}

interface CSVRow {
  [key: string]: string
}

interface FieldMapping {
  title?: string
  category?: string
  audienceName?: string
  audienceSize?: string
  objectiveId?: string
  whatYouDid?: string
  frequency?: string
  volume?: string
  companyMilestoneId?: string
  companyHappeningId?: string
  impact?: string
}

export async function createAchievementsBatch(
  rows: CSVRow[],
  fieldMapping: FieldMapping,
  objectives: Array<{ id: string; name: string }>,
  milestones: Array<{ id: string; name: string }>,
  happenings: Array<{ id: string; name: string }>
) {
  const results = []
  const errors = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      // Map CSV columns to achievement fields
      const achievementData: any = {}

      if (fieldMapping.title && row[fieldMapping.title]) {
        achievementData.title = row[fieldMapping.title].trim()
      }

      if (fieldMapping.category && row[fieldMapping.category]) {
        achievementData.category = row[fieldMapping.category].trim().toUpperCase()
      }

      if (fieldMapping.audienceName && row[fieldMapping.audienceName]) {
        achievementData.audienceName = row[fieldMapping.audienceName].trim()
      }

      if (fieldMapping.audienceSize && row[fieldMapping.audienceSize]) {
        const size = parseInt(row[fieldMapping.audienceSize].trim())
        if (!isNaN(size)) {
          achievementData.audienceSize = size
        }
      }

      if (fieldMapping.objectiveId && row[fieldMapping.objectiveId]) {
        // Try to find objective by name if ID not provided
        const objectiveName = row[fieldMapping.objectiveId].trim()
        const objective = objectives.find((o) => o.name === objectiveName || o.id === objectiveName)
        if (objective) {
          achievementData.objectiveId = objective.id
        }
      }

      if (fieldMapping.whatYouDid && row[fieldMapping.whatYouDid]) {
        achievementData.whatYouDid = row[fieldMapping.whatYouDid].trim()
      }

      if (fieldMapping.frequency && row[fieldMapping.frequency]) {
        achievementData.frequency = row[fieldMapping.frequency].trim()
      }

      if (fieldMapping.volume && row[fieldMapping.volume]) {
        const volume = parseInt(row[fieldMapping.volume].trim())
        if (!isNaN(volume)) {
          achievementData.volume = volume
        }
      }

      if (fieldMapping.companyMilestoneId && row[fieldMapping.companyMilestoneId]) {
        const milestoneName = row[fieldMapping.companyMilestoneId].trim()
        const milestone = milestones.find((m) => m.name === milestoneName || m.id === milestoneName)
        if (milestone) {
          achievementData.companyMilestoneId = milestone.id
        }
      }

      if (fieldMapping.companyHappeningId && row[fieldMapping.companyHappeningId]) {
        const happeningName = row[fieldMapping.companyHappeningId].trim()
        const happening = happenings.find((h) => h.name === happeningName || h.id === happeningName)
        if (happening) {
          achievementData.companyHappeningId = happening.id
        }
      }

      if (fieldMapping.impact && row[fieldMapping.impact]) {
        achievementData.impact = row[fieldMapping.impact].trim()
      }

      // Validate required fields
      if (!achievementData.title || !achievementData.category || !achievementData.whatYouDid) {
        errors.push({
          row: i + 1,
          error: 'Missing required fields: title, category, or whatYouDid',
        })
        continue
      }

      const result = await createAchievement(achievementData)
      if (result.success) {
        results.push({ row: i + 1, success: true })
      } else {
        errors.push({ row: i + 1, error: result.error })
      }
    } catch (error: any) {
      errors.push({ row: i + 1, error: error.message || 'Unknown error' })
    }
  }

  return {
    success: errors.length === 0,
    created: results.length,
    errors,
  }
}

