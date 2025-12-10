/**
 * Highlight Classification Configuration
 * 
 * Maps enum values to user-friendly labels and descriptions
 */

export enum HighlightClassification {
  EXCELLENCE = 'EXCELLENCE',
  LEADERSHIP = 'LEADERSHIP',
  INNOVATION = 'INNOVATION',
  SERVICE = 'SERVICE',
  IMPACT = 'IMPACT',
}

export interface ClassificationConfig {
  label: string
  description: string
  color: string
}

export const classificationConfig: Record<HighlightClassification, ClassificationConfig> = {
  [HighlightClassification.EXCELLENCE]: {
    label: 'Excellence',
    description: 'Achievement / Award',
    color: 'bg-green-100 text-green-800',
  },
  [HighlightClassification.LEADERSHIP]: {
    label: 'Leadership',
    description: 'Promotion, new leadership role',
    color: 'bg-blue-100 text-blue-800',
  },
  [HighlightClassification.INNOVATION]: {
    label: 'Innovation',
    description: 'Patent, technical breakthrough',
    color: 'bg-purple-100 text-purple-800',
  },
  [HighlightClassification.SERVICE]: {
    label: 'Service',
    description: 'Volunteer recognition',
    color: 'bg-orange-100 text-orange-800',
  },
  [HighlightClassification.IMPACT]: {
    label: 'Impact',
    description: 'Mission impact, high-visibility accomplishment',
    color: 'bg-indigo-100 text-indigo-800',
  },
}

/**
 * Get classification config by enum value
 */
export function getClassificationConfig(
  classification: HighlightClassification | string | null | undefined
): ClassificationConfig | null {
  if (!classification) return null
  
  const enumValue = classification as HighlightClassification
  return classificationConfig[enumValue] || null
}

/**
 * Get color class for classification
 */
export function getClassificationColor(
  classification: HighlightClassification | string | null | undefined
): string {
  const config = getClassificationConfig(classification)
  return config?.color || 'bg-gray-100 text-gray-800'
}

/**
 * Map string values to enum (for AI parsing and legacy data)
 */
export function mapStringToClassification(value: string | null | undefined): HighlightClassification | null {
  if (!value) return null
  
  const lower = value.toLowerCase()
  
  // Map common variations to enum values
  if (lower.includes('excellence') || lower.includes('achievement') || lower.includes('award')) {
    return HighlightClassification.EXCELLENCE
  }
  if (lower.includes('leadership') || lower.includes('promotion')) {
    return HighlightClassification.LEADERSHIP
  }
  if (lower.includes('innovation') || lower.includes('patent') || lower.includes('breakthrough')) {
    return HighlightClassification.INNOVATION
  }
  if (lower.includes('service') || lower.includes('volunteer')) {
    return HighlightClassification.SERVICE
  }
  if (lower.includes('impact') || lower.includes('mission')) {
    return HighlightClassification.IMPACT
  }
  
  return null
}
