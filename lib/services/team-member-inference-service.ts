/**
 * TeamMemberInferenceService
 * 
 * AI-native service that infers structured team member data from natural language descriptions.
 * Supports Director, Deputy, Peer, and Subordinate profile types.
 */

import OpenAI from 'openai'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export type TeamMemberType = 'Director' | 'Deputy' | 'Peer' | 'Subordinate'

export interface BaseTeamMemberData {
  firstName: string
  lastName: string
  ageEstimate: number | null
  gender: string | null
  attractiveness: number | null // 1-10
  partnerStatus: string | null // None | Partner | Married | Unknown
  numberOfKids: number | null
  miscNotes: string | null
}

export interface DirectorData extends BaseTeamMemberData {
  type: 'Director'
  yearsInRole: number | null
  internalRank: string | null
  teamSizeManaged: number | null
  spanOfControl: string | null // Small | Medium | Large | Unknown
  friendlinessScale: number | null // 1-10
  strictnessScale: number | null // 1-10
  responsivenessScale: number | null // 1-10
  decisivenessScale: number | null // 1-10
  isSupervisor: string | null // Yes | No | Unknown
  hiredMe: string | null // Yes | No | Unknown
  favoritismPerceived: number | null // 1-10
  frictionPerceived: number | null // 1-10
  trustLevel: number | null // 1-10
}

export interface DeputyData extends BaseTeamMemberData {
  type: 'Deputy'
  yearsInRole: number | null
  internalRank: string | null
  supportsBossScale: number | null // 1-10
  decisionAuthorityScale: number | null // 1-10
  managesOthersScale: number | null // 1-10
  advocacyScale: number | null // 1-10
  communicationToneScale: number | null // 1-10
  executionReliability: number | null // 1-10
}

export interface PeerData extends BaseTeamMemberData {
  type: 'Peer'
  collaborationScale: number | null // 1-10
  competitivenessScale: number | null // 1-10
  triesToTakeCreditScale: number | null // 1-10
  triesToTakeYourJob: number | null // 1-10
  eagernessScale: number | null // 1-10
  yesPersonScale: number | null // 1-10
  frictionScale: number | null // 1-10
  trustLevel: number | null // 1-10
}

export interface SubordinateData extends BaseTeamMemberData {
  type: 'Subordinate'
  autonomyScale: number | null // 1-10
  eagernessScale: number | null // 1-10
  learningPaceScale: number | null // 1-10
  reliabilityScale: number | null // 1-10
  communicationScale: number | null // 1-10
  ambitionScale: number | null // 1-10
  stressSensitivityScale: number | null // 1-10
}

export type TeamMemberData = DirectorData | DeputyData | PeerData | SubordinateData

/**
 * Infer team member type and structured data from natural language description
 */
export async function inferTeamMember(
  description: string,
  suggestedType?: TeamMemberType
): Promise<TeamMemberData> {
  const openai = getOpenAI()

  // First, determine the type if not provided
  let memberType: TeamMemberType = suggestedType || 'Director'
  
  if (!suggestedType) {
    const typePrompt = `Based on this description of a workplace relationship, determine if this person is:
- Director (your boss/supervisor)
- Deputy (second-in-command to your director)
- Peer (colleague at same level)
- Subordinate (reports to you)

Description: ${description.substring(0, 500)}

Respond with ONLY one word: Director, Deputy, Peer, or Subordinate`

    try {
      const typeResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing workplace relationships. Respond with only one word: Director, Deputy, Peer, or Subordinate.',
          },
          {
            role: 'user',
            content: typePrompt,
          },
        ],
        temperature: 0.2,
      })

      const inferredType = typeResponse.choices[0].message.content?.trim()
      if (['Director', 'Deputy', 'Peer', 'Subordinate'].includes(inferredType || '')) {
        memberType = inferredType as TeamMemberType
      }
    } catch (error) {
      console.error('Error inferring team member type:', error)
      // Default to Director
    }
  }

  // Now infer the structured data based on type
  const prompt = buildInferencePrompt(description, memberType)

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting structured workplace relationship data from natural language descriptions. Return only valid JSON.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const parsed = JSON.parse(response.choices[0].message.content || '{}')
    return normalizeInferredData(parsed, memberType, description)
  } catch (error) {
    console.error('TeamMemberInferenceService error:', error)
    return getDefaultData(memberType, description)
  }
}

function buildInferencePrompt(description: string, type: TeamMemberType): string {
  const baseFields = {
    firstName: 'First name (or null)',
    lastName: 'Last name (or null)',
    ageEstimate: 'Estimated age as integer (or null)',
    gender: 'Gender (or null)',
    attractiveness: 'Attractiveness scale 1-10 (or null)',
    partnerStatus: 'Partner status: None, Partner, Married, Unknown (or null)',
    numberOfKids: 'Number of children as integer (or null)',
    miscNotes: 'Any additional context notes (or null)',
  }

  let typeSpecificFields: Record<string, string> = {}

  if (type === 'Director') {
    typeSpecificFields = {
      yearsInRole: 'Years in current role as integer (or null)',
      internalRank: 'Internal rank/title (or null)',
      teamSizeManaged: 'Team size managed as integer (or null)',
      spanOfControl: 'Span of control: Small, Medium, Large, Unknown (or null)',
      friendlinessScale: 'Friendliness scale 1-10 (or null)',
      strictnessScale: 'Strictness scale 1-10 (or null)',
      responsivenessScale: 'Responsiveness scale 1-10 (or null)',
      decisivenessScale: 'Decisiveness scale 1-10 (or null)',
      isSupervisor: 'Is this person actually your supervisor: Yes, No, Unknown (or null)',
      hiredMe: 'Did this person hire you: Yes, No, Unknown (or null)',
      favoritismPerceived: 'Perceived favoritism scale 1-10 (or null)',
      frictionPerceived: 'Perceived friction scale 1-10 (or null)',
      trustLevel: 'Trust level scale 1-10 (or null)',
    }
  } else if (type === 'Deputy') {
    typeSpecificFields = {
      yearsInRole: 'Years in current role as integer (or null)',
      internalRank: 'Internal rank/title (or null)',
      supportsBossScale: 'How strongly they align with supervisor 1-10 (or null)',
      decisionAuthorityScale: 'Real influence in decisions 1-10 (or null)',
      managesOthersScale: 'Actual people management weight 1-10 (or null)',
      advocacyScale: 'How much they advocate for you 1-10 (or null)',
      communicationToneScale: 'Warmth/openness 1-10 (or null)',
      executionReliability: 'Follow-through strength 1-10 (or null)',
    }
  } else if (type === 'Peer') {
    typeSpecificFields = {
      collaborationScale: 'Collaboration level 1-10 (or null)',
      competitivenessScale: 'Competitiveness 1-10 (or null)',
      triesToTakeCreditScale: 'Tries to take credit 1-10 (or null)',
      triesToTakeYourJob: 'Tries to take your job 1-10 (or null)',
      eagernessScale: 'Eagerness 1-10 (or null)',
      yesPersonScale: 'Yes-person tendency 1-10 (or null)',
      frictionScale: 'Friction level 1-10 (or null)',
      trustLevel: 'Trust level 1-10 (or null)',
    }
  } else if (type === 'Subordinate') {
    typeSpecificFields = {
      autonomyScale: 'Autonomy level 1-10 (or null)',
      eagernessScale: 'Eagerness 1-10 (or null)',
      learningPaceScale: 'Learning pace 1-10 (or null)',
      reliabilityScale: 'Reliability 1-10 (or null)',
      communicationScale: 'Communication quality 1-10 (or null)',
      ambitionScale: 'Ambition level 1-10 (or null)',
      stressSensitivityScale: 'Stress sensitivity 1-10 (or null)',
    }
  }

  const allFields = { ...baseFields, ...typeSpecificFields }

  return `Extract structured ${type} profile data from this workplace relationship description.

Return JSON with these exact fields (use null for unknown values):
${JSON.stringify(allFields, null, 2)}

Description:
${description.substring(0, 3000)}

Important:
- All scale values (1-10) must be integers between 1 and 10, or null
- All yes/no fields must be "Yes", "No", or "Unknown", or null
- Extract names from the description if mentioned
- Infer reasonable values based on context, but use null if truly unknown`
}

function normalizeInferredData(
  parsed: any,
  type: TeamMemberType,
  originalDescription: string
): TeamMemberData {
  const base: BaseTeamMemberData = {
    firstName: parsed.firstName || null,
    lastName: parsed.lastName || null,
    ageEstimate: typeof parsed.ageEstimate === 'number' ? parsed.ageEstimate : null,
    gender: parsed.gender || null,
    attractiveness: validateScale(parsed.attractiveness),
    partnerStatus: ['None', 'Partner', 'Married', 'Unknown'].includes(parsed.partnerStatus)
      ? parsed.partnerStatus
      : null,
    numberOfKids: typeof parsed.numberOfKids === 'number' ? parsed.numberOfKids : null,
    miscNotes: parsed.miscNotes || originalDescription.substring(0, 1000) || null,
  }

  if (type === 'Director') {
    return {
      ...base,
      type: 'Director',
      yearsInRole: typeof parsed.yearsInRole === 'number' ? parsed.yearsInRole : null,
      internalRank: parsed.internalRank || null,
      teamSizeManaged: typeof parsed.teamSizeManaged === 'number' ? parsed.teamSizeManaged : null,
      spanOfControl: ['Small', 'Medium', 'Large', 'Unknown'].includes(parsed.spanOfControl)
        ? parsed.spanOfControl
        : null,
      friendlinessScale: validateScale(parsed.friendlinessScale),
      strictnessScale: validateScale(parsed.strictnessScale),
      responsivenessScale: validateScale(parsed.responsivenessScale),
      decisivenessScale: validateScale(parsed.decisivenessScale),
      isSupervisor: ['Yes', 'No', 'Unknown'].includes(parsed.isSupervisor)
        ? parsed.isSupervisor
        : null,
      hiredMe: ['Yes', 'No', 'Unknown'].includes(parsed.hiredMe) ? parsed.hiredMe : null,
      favoritismPerceived: validateScale(parsed.favoritismPerceived),
      frictionPerceived: validateScale(parsed.frictionPerceived),
      trustLevel: validateScale(parsed.trustLevel),
    }
  } else if (type === 'Deputy') {
    return {
      ...base,
      type: 'Deputy',
      yearsInRole: typeof parsed.yearsInRole === 'number' ? parsed.yearsInRole : null,
      internalRank: parsed.internalRank || null,
      supportsBossScale: validateScale(parsed.supportsBossScale),
      decisionAuthorityScale: validateScale(parsed.decisionAuthorityScale),
      managesOthersScale: validateScale(parsed.managesOthersScale),
      advocacyScale: validateScale(parsed.advocacyScale),
      communicationToneScale: validateScale(parsed.communicationToneScale),
      executionReliability: validateScale(parsed.executionReliability),
    }
  } else if (type === 'Peer') {
    return {
      ...base,
      type: 'Peer',
      collaborationScale: validateScale(parsed.collaborationScale),
      competitivenessScale: validateScale(parsed.competitivenessScale),
      triesToTakeCreditScale: validateScale(parsed.triesToTakeCreditScale),
      triesToTakeYourJob: validateScale(parsed.triesToTakeYourJob),
      eagernessScale: validateScale(parsed.eagernessScale),
      yesPersonScale: validateScale(parsed.yesPersonScale),
      frictionScale: validateScale(parsed.frictionScale),
      trustLevel: validateScale(parsed.trustLevel),
    }
  } else {
    // Subordinate
    return {
      ...base,
      type: 'Subordinate',
      autonomyScale: validateScale(parsed.autonomyScale),
      eagernessScale: validateScale(parsed.eagernessScale),
      learningPaceScale: validateScale(parsed.learningPaceScale),
      reliabilityScale: validateScale(parsed.reliabilityScale),
      communicationScale: validateScale(parsed.communicationScale),
      ambitionScale: validateScale(parsed.ambitionScale),
      stressSensitivityScale: validateScale(parsed.stressSensitivityScale),
    }
  }
}

function validateScale(value: any): number | null {
  if (typeof value === 'number' && value >= 1 && value <= 10) {
    return Math.round(value)
  }
  return null
}

function getDefaultData(type: TeamMemberType, description: string): TeamMemberData {
  const base: BaseTeamMemberData = {
    firstName: '',
    lastName: '',
    ageEstimate: null,
    gender: null,
    attractiveness: null,
    partnerStatus: null,
    numberOfKids: null,
    miscNotes: description.substring(0, 1000) || null,
  }

  if (type === 'Director') {
    return {
      ...base,
      type: 'Director',
      yearsInRole: null,
      internalRank: null,
      teamSizeManaged: null,
      spanOfControl: null,
      friendlinessScale: null,
      strictnessScale: null,
      responsivenessScale: null,
      decisivenessScale: null,
      isSupervisor: null,
      hiredMe: null,
      favoritismPerceived: null,
      frictionPerceived: null,
      trustLevel: null,
    }
  } else if (type === 'Deputy') {
    return {
      ...base,
      type: 'Deputy',
      yearsInRole: null,
      internalRank: null,
      supportsBossScale: null,
      decisionAuthorityScale: null,
      managesOthersScale: null,
      advocacyScale: null,
      communicationToneScale: null,
      executionReliability: null,
    }
  } else if (type === 'Peer') {
    return {
      ...base,
      type: 'Peer',
      collaborationScale: null,
      competitivenessScale: null,
      triesToTakeCreditScale: null,
      triesToTakeYourJob: null,
      eagernessScale: null,
      yesPersonScale: null,
      frictionScale: null,
      trustLevel: null,
    }
  } else {
    return {
      ...base,
      type: 'Subordinate',
      autonomyScale: null,
      eagernessScale: null,
      learningPaceScale: null,
      reliabilityScale: null,
      communicationScale: null,
      ambitionScale: null,
      stressSensitivityScale: null,
    }
  }
}
