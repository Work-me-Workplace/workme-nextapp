/**
 * Digest Item Generator Service
 * 
 * Morphs CompanyX data into formatted digest items using AI
 * with smart rules based on item type and urgency
 */

import OpenAI from 'openai'

// Initialize OpenAI (will use env var OPENAI_API_KEY)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// ============================================
// RULE SET - How different items get treated
// ============================================

export const GENERATOR_RULES = {
  // Must-do items get special treatment
  MANDATORY_TRAINING: {
    titlePrefix: '*ACTION REQUIRED*:',
    urgencyLevel: 'HIGH',
    emphasizeDeadline: true,
    ctaStrength: 'STRONG', // "Complete by X" vs "Learn more"
  },
  
  TIMEKEEPING_ACTION: {
    titlePrefix: '*ACTION REQUIRED*:',
    urgencyLevel: 'HIGH',
    emphasizePOC: true,
    emphasizeDeadline: true,
    ctaStrength: 'STRONG',
    format: 'timekeeping', // Special formatting for time & attendance
    // Extract from raw text:
    // 1. Leave codes (e.g., "LH" for holiday leave)
    // 2. Employee deadline (e.g., "1600 Monday, Dec 22")
    // 3. Supervisor deadline (e.g., "1500 Tuesday Dec 23")
    // 4. Pay period info (e.g., "PP Dec 16 - Dec 27")
    // 5. Holiday dates
    extractFields: ['leaveCodes', 'employeeDeadline', 'supervisorDeadline', 'payPeriod', 'holidayDate'],
    bodyStructure: [
      'PARAGRAPH 1: What holiday/event and directing action (early submission)',
      'PARAGRAPH 2: Employee deadline with specific date/time',
      'PARAGRAPH 3: Supervisor deadline with specific date/time',
      'PARAGRAPH 4 (if applicable): Secondary guidance for following pay period',
    ],
  },
  
  HIGH_URGENCY_IMPACT: {
    titlePrefix: '*IMPORTANT*:',
    urgencyLevel: 'HIGH',
    emphasizePOC: true,
    ctaStrength: 'STRONG',
  },
  
  MEDIUM_URGENCY_IMPACT: {
    titlePrefix: '*REMINDER*:',
    urgencyLevel: 'MEDIUM',
    emphasizePOC: true,
    ctaStrength: 'MEDIUM',
  },
  
  REGULAR_EVENT: {
    titlePrefix: '',
    urgencyLevel: 'LOW',
    emphasizeDate: true,
    ctaStrength: 'SOFT',
  },
  
  CAMPAIGN: {
    titlePrefix: '',
    urgencyLevel: 'MEDIUM',
    emphasizeWindow: true,
    ctaStrength: 'MEDIUM',
  },
  
  BENEFIT: {
    titlePrefix: '',
    urgencyLevel: 'LOW',
    emphasizeValue: true,
    ctaStrength: 'SOFT',
  },
}

// ============================================
// TYPES
// ============================================

export type CompanyXType =
  | 'CompanyEvent'
  | 'CompanyCampaign'
  | 'CompanyTraining'
  | 'CompanyBenefits'
  | 'CompanyImpactEvent'
  | 'CompanyCommunity'
  | 'CompanyCareer'
  | 'CompanyEmployeeCause'

export interface GenerateItemInput {
  sourceType: CompanyXType
  sourceData: any // ALREADY PARSED from CompanyX models (title, description, pocEmail, etc.)
  humanContext?: string // User's instructions: "emphasize deadline", "urgent", "casual tone"
  context?: {
    pastItems?: any[] // Learn from past formatting
    companyStyle?: 'formal' | 'casual' // Company communication style
  }
}

export interface GeneratedItemOutput {
  title: string // For searchability
  content: string // The ENTIRE formatted item (ready to drop into an edition)
  metadata?: {
    urgency: 'HIGH' | 'MEDIUM' | 'LOW'
    ruleApplied: string
    sourceType?: string
    sourceId?: string
  }
}

// ============================================
// RULE APPLICATION
// ============================================

function determineRule(sourceType: CompanyXType, sourceData: any): keyof typeof GENERATOR_RULES {
  // Check title/description for timekeeping keywords
  const titleLower = (sourceData.title || '').toLowerCase()
  const descLower = (sourceData.description || '').toLowerCase()
  const timekeepingKeywords = ['timekeeping', 'time and attendance', 'time & attendance', 'timesheet', 'payroll']
  
  if (timekeepingKeywords.some(kw => titleLower.includes(kw) || descLower.includes(kw))) {
    return 'TIMEKEEPING_ACTION'
  }
  
  // Training rules
  if (sourceType === 'CompanyTraining') {
    if (sourceData.mandatory === true) {
      return 'MANDATORY_TRAINING'
    }
  }
  
  // Impact Event rules
  if (sourceType === 'CompanyImpactEvent') {
    // Check for timekeeping in impact events too
    if (timekeepingKeywords.some(kw => titleLower.includes(kw) || descLower.includes(kw))) {
      return 'TIMEKEEPING_ACTION'
    }
    
    if (sourceData.urgency === 'HIGH' || sourceData.urgency === 'URGENT') {
      return 'HIGH_URGENCY_IMPACT'
    }
    if (sourceData.urgency === 'MEDIUM') {
      return 'MEDIUM_URGENCY_IMPACT'
    }
  }
  
  // Campaign rules
  if (sourceType === 'CompanyCampaign') {
    return 'CAMPAIGN'
  }
  
  // Benefit rules
  if (sourceType === 'CompanyBenefits') {
    return 'BENEFIT'
  }
  
  // Default to regular event
  return 'REGULAR_EVENT'
}

// ============================================
// PROMPT BUILDERS (Based on rules)
// ============================================

function buildSystemPrompt(rule: keyof typeof GENERATOR_RULES): string {
  const ruleConfig = GENERATOR_RULES[rule]
  
  // Special timekeeping format
  if (rule === 'TIMEKEEPING_ACTION') {
    return `You are a workforce communications expert formatting timekeeping/payroll guidance.

FOLLOW THIS EXACT FORMAT (learn from past examples):
- Title: "*ACTION REQUIRED*: [TOPIC] GUIDANCE" (e.g., "THANKSGIVING TIME & ATTENDANCE GUIDANCE")
- POC: "POC: [Name], [Unit], at [email]" (e.g., "POC: Wesley Davis, SEA 10, at wesley.r.davis4.civ@us.navy.mil")
- Body: Clear, actionable paragraphs with specific deadlines
  * First paragraph: What employees need to do + deadline
  * Second paragraph: Additional instructions (timecodes, holidays, etc.)
  * Keep it concise and scannable
- CTA: Link to resources if available (e.g., "join their Microsoft Teams channel here")

⚠️ CRITICAL: Include ALL deadlines prominently!

Return ONLY valid JSON:
{
  "title": "string",
  "poc": "string",
  "body": "string (use \\n\\n for paragraph breaks)",
  "cta": "string (optional)",
  "ctaUrl": "string (optional)"
}`
  }
  
  return `You are a workforce communications expert creating engaging email digest items.

Your task:
- Format content for a professional workforce email digest
- Maintain a clear, actionable tone
- Use the following structure strictly:
  * Title: ${ruleConfig.titlePrefix ? `Start with "${ruleConfig.titlePrefix}"` : 'Clear headline'}
  * POC Line: Format as "POC: Name at email@example.com" ${'emphasizePOC' in ruleConfig && ruleConfig.emphasizePOC ? '(EMPHASIZE THIS)' : ''}
  * Body: 2-3 sentences, ${ruleConfig.urgencyLevel === 'HIGH' ? 'urgent and direct' : 'informative'}
  * CTA: ${ruleConfig.ctaStrength === 'STRONG' ? 'Strong action verb (Complete, Register, Respond)' : 'Soft invitation (Learn more, Explore)'}

${'emphasizeDeadline' in ruleConfig && ruleConfig.emphasizeDeadline ? '⚠️ CRITICAL: Emphasize deadlines prominently!' : ''}
${'emphasizeDate' in ruleConfig && ruleConfig.emphasizeDate ? '📅 Include date/time information clearly.' : ''}
${'emphasizeWindow' in ruleConfig && ruleConfig.emphasizeWindow ? '📅 Mention window/timeframe (e.g., "ends Dec 22").' : ''}

Return ONLY valid JSON with this structure:
{
  "title": "string (for searchability)",
  "content": "string (the COMPLETE formatted item - title, POC, body, CTA all together as one piece of content ready to publish)"
}`
}

function buildUserPrompt(sourceType: CompanyXType, sourceData: any): string {
  const lines: string[] = []
  
  // Build prompt from source data
  lines.push(`Format this ${sourceType} into a digest item:\n`)
  lines.push(`Title: ${sourceData.title || 'Untitled'}`)
  
  if (sourceData.description) {
    lines.push(`Description: ${sourceData.description}`)
  }
  
  if (sourceData.summary) {
    lines.push(`Summary: ${sourceData.summary}`)
  }
  
  // Type-specific fields
  if (sourceType === 'CompanyTraining') {
    if (sourceData.mandatory) {
      lines.push(`⚠️ THIS IS MANDATORY TRAINING`)
    }
    if (sourceData.trainingDate) {
      lines.push(`Training Date: ${new Date(sourceData.trainingDate).toLocaleDateString()}`)
    }
    if (sourceData.dueDate) {
      lines.push(`⚠️ DUE DATE: ${new Date(sourceData.dueDate).toLocaleDateString()}`)
    }
  }
  
  if (sourceType === 'CompanyImpactEvent') {
    if (sourceData.urgency) {
      lines.push(`⚠️ URGENCY LEVEL: ${sourceData.urgency}`)
    }
    if (sourceData.effectiveDate) {
      lines.push(`Effective Date: ${new Date(sourceData.effectiveDate).toLocaleDateString()}`)
    }
    if (sourceData.impactedPopulation) {
      lines.push(`Impacted: ${sourceData.impactedPopulation}`)
    }
    
    // SPECIAL: Timekeeping gets full raw text
    if (sourceData.ingestRawText && (sourceData.title?.toLowerCase().includes('timekeeping') || sourceData.description?.toLowerCase().includes('timekeeping'))) {
      lines.push(`\n📋 FULL TIMEKEEPING GUIDANCE (extract deadlines, leave codes, pay periods):`)
      lines.push(sourceData.ingestRawText)
      lines.push(`\n🎯 EXTRACT AND FORMAT:`)
      lines.push(`1. Leave codes (e.g., LH for holiday)`)
      lines.push(`2. Employee deadline (date + time)`)
      lines.push(`3. Supervisor deadline (date + time)`)
      lines.push(`4. Pay period(s) affected`)
      lines.push(`5. Holiday date(s)`)
      lines.push(`\n📝 BODY STRUCTURE:`)
      lines.push(`Paragraph 1: What holiday and why early submission is required`)
      lines.push(`Paragraph 2: Employee must enter time by [DATE/TIME]`)
      lines.push(`Paragraph 3: Supervisors must approve by [DATE/TIME]`)
      lines.push(`Paragraph 4 (if applicable): Guidance for next pay period`)
    }
  }
  
  if (sourceType === 'CompanyEvent') {
    if (sourceData.eventDate) {
      lines.push(`Event Date: ${new Date(sourceData.eventDate).toLocaleDateString()}`)
    }
    if (sourceData.location) {
      lines.push(`Location: ${sourceData.location}`)
    }
    if (sourceData.registrationRequired) {
      lines.push(`Registration Required`)
    }
  }
  
  if (sourceType === 'CompanyCampaign') {
    if (sourceData.windowStart && sourceData.windowEnd) {
      lines.push(`Campaign Window: ${new Date(sourceData.windowStart).toLocaleDateString()} - ${new Date(sourceData.windowEnd).toLocaleDateString()}`)
    }
  }
  
  // POC info (if available)
  if (sourceData.pocFirstName || sourceData.pocLastName || sourceData.pocEmail) {
    const pocName = [sourceData.pocFirstName, sourceData.pocLastName].filter(Boolean).join(' ')
    const pocEmail = sourceData.pocEmail || 'contact@example.com'
    lines.push(`POC: ${pocName || 'Contact'} at ${pocEmail}`)
  }
  
  return lines.join('\n')
}

// ============================================
// MAIN GENERATOR FUNCTION
// ============================================

export async function generateDigestItem(
  input: GenerateItemInput
): Promise<GeneratedItemOutput> {
  const { sourceType, sourceData, humanContext, context } = input
  
  // Determine which rule to apply
  const ruleKey = determineRule(sourceType, sourceData)
  const rule = GENERATOR_RULES[ruleKey]
  
  // If no OpenAI, return formatted template
  if (!openai) {
    console.warn('OpenAI not configured, using template fallback')
    return generateTemplateItem(sourceType, sourceData, ruleKey)
  }
  
  try {
    // Build prompts based on rule
    const systemPrompt = buildSystemPrompt(ruleKey)
    let userPrompt = buildUserPrompt(sourceType, sourceData)
    
    // Add human context if provided
    if (humanContext) {
      userPrompt += `\n\n🎯 HUMAN INSTRUCTIONS: ${humanContext}\n(Follow these instructions when formatting the item)`
    }
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
    
    // Parse response
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content generated')
    }
    
    const generated = JSON.parse(content)
    
    return {
      title: generated.title,
      content: generated.content, // The whole formatted thing!
      metadata: {
        urgency: rule.urgencyLevel as 'HIGH' | 'MEDIUM' | 'LOW',
        ruleApplied: ruleKey,
      },
    }
  } catch (error) {
    console.error('Error generating with OpenAI:', error)
    // Fallback to template
    return generateTemplateItem(sourceType, sourceData, ruleKey)
  }
}

// ============================================
// TEMPLATE FALLBACK (No AI)
// ============================================

function generateTemplateItem(
  sourceType: CompanyXType,
  sourceData: any,
  ruleKey: keyof typeof GENERATOR_RULES
): GeneratedItemOutput {
  const rule = GENERATOR_RULES[ruleKey]
  
  // Build title
  let title = sourceData.title || 'Untitled'
  if (rule.titlePrefix) {
    title = `${rule.titlePrefix} ${title.toUpperCase()}`
  }
  
  // Add date to title if relevant
  if (sourceType === 'CompanyEvent' && sourceData.eventDate) {
    const date = new Date(sourceData.eventDate)
    title += ` – ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
  
  // Build POC line
  let poc = ''
  if (sourceData.pocFirstName || sourceData.pocLastName || sourceData.pocEmail) {
    const pocName = [sourceData.pocFirstName, sourceData.pocLastName].filter(Boolean).join(' ') || 'Contact'
    const pocEmail = sourceData.pocEmail || 'contact@example.com'
    poc = `POC: ${pocName} at ${pocEmail}`
  }
  
  // Build body
  let body = sourceData.description || sourceData.summary || 'No description available.'
  if (body.length > 300) {
    body = body.substring(0, 297) + '...'
  }
  
  // Build CTA
  let cta = ''
  let ctaUrl = sourceData.registrationLink || sourceData.link || ''
  if (rule.ctaStrength === 'STRONG') {
    if (sourceType === 'CompanyTraining' && sourceData.dueDate) {
      cta = `Complete by ${new Date(sourceData.dueDate).toLocaleDateString()}`
    } else {
      cta = 'Register now'
    }
  } else if (rule.ctaStrength === 'MEDIUM') {
    cta = 'Learn more'
  }
  
  // BUILD THE ENTIRE CONTENT AS ONE PIECE
  const contentParts: string[] = []
  contentParts.push(title) // Title with prefix
  contentParts.push('') // blank line
  
  if (poc) {
    contentParts.push(poc)
    contentParts.push('') // blank line
  }
  
  contentParts.push(body)
  
  if (cta && ctaUrl) {
    contentParts.push('') // blank line
    contentParts.push(`${cta}: ${ctaUrl}`)
  }
  
  return {
    title, // For searchability
    content: contentParts.join('\n'), // The whole formatted item!
    metadata: {
      urgency: rule.urgencyLevel as 'HIGH' | 'MEDIUM' | 'LOW',
      ruleApplied: ruleKey,
    },
  }
}

// ============================================
// BATCH GENERATION (Date Range Hydration)
// ============================================

export async function generateItemsFromDateRange(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<{ sourceType: CompanyXType; sourceData: any; generated: GeneratedItemOutput }[]> {
  // TODO: Query CompanyX items within date range
  // This will be implemented when wiring up to the UI
  throw new Error('Not implemented yet - wire up in next step')
}
