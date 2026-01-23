/**
 * Digest Item Generator Service
 * 
 * Morphs CompanyX data into formatted digest items using AI
 * with smart rules based on item type and urgency
 */

import OpenAI from 'openai'

// Initialize OpenAI client - THROWS if not configured (matches pattern in app)
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

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

STYLE GUIDELINES:
- Use AP Style
- Abbreviate months: Jan., Feb., March, April, May, June, July, Aug., Sept., Oct., Nov., Dec.
- Use specific times (e.g., "4 p.m. Monday, Dec. 22")
- Keep paragraphs concise and scannable

FOLLOW THIS EXACT FORMAT (learn from past examples):
1. Title: "*ACTION REQUIRED*: [TOPIC] GUIDANCE" (e.g., "THANKSGIVING TIME & ATTENDANCE GUIDANCE")
2. Content: A complete, formatted item that includes:
   - POC Line: "POC: [Name], [Unit], at [email]" (e.g., "POC: Wesley Davis, SEA 10, at wesley.r.davis4.civ@us.navy.mil")
   - Body: Clear, actionable paragraphs with specific deadlines
     * First paragraph: What employees need to do + deadline
     * Second paragraph: Additional instructions (timecodes, holidays, etc.)
     * Keep it concise and scannable
   - CTA: Link to resources if available (e.g., "join their Microsoft Teams channel here")

⚠️ CRITICAL: Include ALL deadlines prominently in the body paragraphs!

Return ONLY valid JSON with this structure:
{
  "title": "string (for searchability, e.g., '*ACTION REQUIRED*: TIMEKEEPING GUIDANCE FOR HOLIDAY PERIOD')",
  "content": "string (the COMPLETE formatted item - POC line + body paragraphs + CTA all together as one piece of content ready to publish. Use \\n\\n for paragraph breaks)"
}`
  }
  
  // Special prompt for Impact Events
  if (rule === 'HIGH_URGENCY_IMPACT' || rule === 'MEDIUM_URGENCY_IMPACT') {
    return `You are a workforce communications expert formatting impact event notifications for email digests.

STYLE GUIDELINES:
- Use AP Style
- Keep paragraphs concise and scannable
- Use emoji sparingly (only when appropriate)
- Make content actionable and clear
- Focus on WHAT workers need to know and DO

FORMAT REQUIREMENTS FOR IMPACT EVENTS:
* Title: ${ruleConfig.titlePrefix} Clear, urgent title that states the impact
* POC Line: Format as "POC: Name at email@example.com" (EMPHASIZE THIS)
* Body Structure (CRITICAL - follow this order):
  1. First paragraph: WHAT IS THE IMPACT? (What's happening/changing - e.g., "Winter storm expected", "System maintenance", "Policy change")
  2. Second paragraph: WHO IS IMPACTED? (Specific populations/groups affected - e.g., "NAVSEA personnel", "D.C. area employees")
  3. Third paragraph: WHAT MITIGATIONS/GUIDANCE ARE PROVIDED? (What should workers do/know - THIS IS CRITICAL! Extract specific actions, procedures, guidance)
  4. Fourth paragraph (if applicable): WHEN/DEADLINES (Effective dates, deadlines, timeframes)
* CTA: ${ruleConfig.ctaStrength === 'STRONG' ? 'Strong action verb (Complete, Register, Respond, Contact)' : 'Soft invitation (Learn more, Explore)'}

⚠️ CRITICAL FOR IMPACT EVENTS:
- Clearly state WHAT the impact is (what's happening/changing)
- Explicitly state WHAT MITIGATIONS/GUIDANCE workers should follow (what they need to do - this is the most important part!)
- Include WHO is impacted (specific groups, locations, populations)
- Include WHEN it takes effect (dates, deadlines, timeframes)
- Extract all guidance, procedures, and action items from the source material

Return ONLY valid JSON with this structure:
{
  "title": "string (for searchability, e.g., '*IMPORTANT*: WINTER STORM PREPAREDNESS')",
  "content": "string (the COMPLETE formatted item - title, POC line, body paragraphs with impact/mitigation/guidance, CTA all together as one piece of content ready to publish. Use \\n\\n for paragraph breaks)"
}`
  }
  
  return `You are a workforce communications expert creating engaging email digest items.

STYLE GUIDELINES:
- Use AP Style
- Abbreviate months: Jan., Feb., March, April, May, June, July, Aug., Sept., Oct., Nov., Dec.
- Use specific times with a.m./p.m. (e.g., "4 p.m. Monday, Dec. 22")
- Keep paragraphs concise and scannable

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
${'emphasizeWindow' in ruleConfig && ruleConfig.emphasizeWindow ? '📅 Mention window/timeframe (e.g., "ends Dec. 22").' : ''}

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
  
  // SUMMARY FIRST (it's the distilled version!)
  if (sourceData.summary) {
    lines.push(`Summary: ${sourceData.summary}`)
  }
  
  // Then description if available
  if (sourceData.description) {
    lines.push(`Description: ${sourceData.description}`)
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
    lines.push(`\n🎯 IMPACT EVENT - Extract the following:`)
    lines.push(`1. WHAT IS THE IMPACT? (What's happening/changing)`)
    lines.push(`2. WHO IS IMPACTED? (Specific populations/groups)`)
    lines.push(`3. WHAT MITIGATIONS/GUIDANCE ARE PROVIDED? (What should workers do/know)`)
    lines.push(`4. WHEN DOES IT TAKE EFFECT? (Effective dates/deadlines)`)
    lines.push(`\n---`)
    
    if (sourceData.urgency) {
      lines.push(`⚠️ URGENCY LEVEL: ${sourceData.urgency}`)
    }
    if (sourceData.effectiveDate) {
      lines.push(`Effective Date: ${new Date(sourceData.effectiveDate).toLocaleDateString()}`)
    }
    if (sourceData.impactedPopulation) {
      lines.push(`Impacted Population: ${sourceData.impactedPopulation}`)
    }
    if (sourceData.location) {
      lines.push(`Location: ${sourceData.location}`)
    }
    
    // Include full raw text for Impact Events to ensure we capture all details
    if (sourceData.ingestRawText) {
      lines.push(`\n📋 FULL IMPACT EVENT DETAILS (extract impact, mitigations, guidance, deadlines):`)
      lines.push(sourceData.ingestRawText)
    }
    
    // SPECIAL: Timekeeping gets additional extraction guidance
    if (sourceData.ingestRawText && (sourceData.title?.toLowerCase().includes('timekeeping') || sourceData.description?.toLowerCase().includes('timekeeping'))) {
      lines.push(`\n🎯 TIMEKEEPING-SPECIFIC EXTRACTION:`)
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
  
  try {
    // Get OpenAI client - throws if not configured
    const openai = getOpenAI()
    // Build prompts based on rule
    const systemPrompt = buildSystemPrompt(ruleKey)
    let userPrompt = buildUserPrompt(sourceType, sourceData)
    
    // Add human context if provided
    if (humanContext) {
      userPrompt += `\n\n🎯 HUMAN INSTRUCTIONS: ${humanContext}\n(Follow these instructions when formatting the item)`
    }
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // gpt-4o-mini supports JSON mode
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
      throw new Error('No content generated by OpenAI')
    }
    
    console.log('✅ OpenAI response received, parsing JSON...')
    console.log('Raw content:', content.substring(0, 200))
    
    let generated: any
    try {
      generated = JSON.parse(content)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('Content that failed to parse:', content)
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }
    
    console.log('Parsed JSON keys:', Object.keys(generated))
    
    if (!generated.title || !generated.content) {
      console.error('❌ Missing required fields in generated content:', generated)
      throw new Error(`Generated content missing required fields. Has: ${Object.keys(generated).join(', ')}`)
    }
    
    console.log('✅ Generated item:', { title: generated.title.substring(0, 50), contentLength: generated.content.length })
    
    return {
      title: generated.title,
      content: generated.content, // The whole formatted thing!
      metadata: {
        urgency: rule.urgencyLevel as 'HIGH' | 'MEDIUM' | 'LOW',
        ruleApplied: ruleKey,
      },
    }
  } catch (error) {
    console.error('❌ Error generating with OpenAI:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    // Re-throw with better message
    throw new Error(`AI generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// ============================================
// TEMPLATE FALLBACK (No AI)
// ============================================

function generateTemplateItem(
  sourceType: CompanyXType,
  sourceData: any,
  ruleKey: keyof typeof GENERATOR_RULES,
  humanContext?: string
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
  
  // Build body (SUMMARY FIRST!)
  let body = sourceData.summary || sourceData.description || 'No description available.'
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
  
  // ADD HUMAN CONTEXT NOTE if provided
  if (humanContext) {
    contentParts.push('') // blank line
    contentParts.push(`[Note: ${humanContext}]`)
  }
  
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
