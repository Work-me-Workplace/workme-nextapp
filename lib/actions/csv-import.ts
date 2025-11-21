'use server'

import { prisma } from '../prisma'
// DEPRECATED: achievements actions are deprecated
// import { createAchievement } from './achievements'

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
  objective?: string
  commsOutput?: string
  whatYouDid?: string
  frequency?: string
  volume?: string
  processSteps?: string
  impact?: string
}

export async function createAchievementsBatch(
  rows: CSVRow[],
  fieldMapping: FieldMapping,
  objectives: Array<{ id: string; title: string }>,
  commsOutputs: Array<{ id: string; title: string }>
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

      if (fieldMapping.objective && row[fieldMapping.objective]) {
        const objectiveTitle = row[fieldMapping.objective].trim()
        const objective = objectives.find((o) => o.title === objectiveTitle || o.id === objectiveTitle)
        if (objective) {
          achievementData.objectiveId = objective.id
        }
      }

      if (fieldMapping.commsOutput && row[fieldMapping.commsOutput]) {
        const commsTitle = row[fieldMapping.commsOutput].trim()
        const comms = commsOutputs.find((c) => c.title === commsTitle || c.id === commsTitle)
        if (comms) {
          achievementData.commsOutputId = comms.id
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

      if (fieldMapping.processSteps && row[fieldMapping.processSteps]) {
        try {
          // Try to parse as JSON array
          const steps = JSON.parse(row[fieldMapping.processSteps].trim())
          if (Array.isArray(steps)) {
            achievementData.processSteps = steps
          }
        } catch {
          // If not valid JSON, treat as comma-separated string
          const steps = row[fieldMapping.processSteps].trim().split(',').map(s => s.trim())
          achievementData.processSteps = steps
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

      // DEPRECATED: Achievement creation is deprecated
      // const result = await createAchievement(achievementData)
      // if (result.success) {
      //   results.push({ row: i + 1, success: true })
      // } else {
      //   errors.push({ row: i + 1, error: result.error })
      // }
      errors.push({ row: i + 1, error: 'Achievement creation is deprecated' })
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
