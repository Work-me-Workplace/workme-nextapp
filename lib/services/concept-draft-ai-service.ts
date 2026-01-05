/**
 * Concept Draft AI Service
 * 
 * Generates ConceptDraft from brain dump input.
 * AI should infer timeframe if obvious, otherwise propose soft defaults.
 * Never invent hard dates.
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

export interface ConceptDraftGenerationInput {
  brainDump: string // Raw idea/brain dump text
  companyContext?: string // Optional company context
}

export interface ConceptDraftGenerationOutput {
  title: string
  summary?: string
  howItWorks?: string
  whoImpacted: string[]
  example?: string
  timeframe?: string // e.g. "FY25", "CY26", "Next 6–12 months"
  potentialStart?: string // e.g. "Post-town hall", "Q2", "After reorg"
}

const SYSTEM_PROMPT = `You are a concept development assistant. Your job is to help structure early-stage ideas into clear, actionable concept drafts.

Key principles:
1. Extract the core idea and structure it clearly
2. For timeframe: Infer if obvious from context, otherwise propose soft defaults like "Next 6–12 months" or "FY25"
3. For potentialStart: Suggest event-based triggers like "Post-town hall" or "After reorg", NOT hard calendar dates
4. Never invent specific dates or deadlines
5. Make all timing suggestions editable and flexible
6. If timing is unclear, use phrases like "To be determined" or "Next 6–12 months"

Output a JSON object with these fields:
- title: A clear, concise title for the concept
- summary: A brief summary of the concept (2-3 sentences)
- howItWorks: How the concept would work in practice (optional)
- whoImpacted: Array of strings describing who would be impacted (e.g. ["All employees", "Leadership team", "New hires"])
- example: A concrete example of the concept in action (optional)
- timeframe: Soft timeframe like "FY25", "CY26", "Next 6–12 months", or null if unclear
- potentialStart: Event-based trigger like "Post-town hall", "Q2", "After reorg", or null if unclear

Remember: These are soft suggestions. The user will edit them. Never lock in hard dates.`

export async function generateConceptDraft(
  input: ConceptDraftGenerationInput
): Promise<ConceptDraftGenerationOutput> {
  const openai = getOpenAI()
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const userPrompt = `Convert this brain dump into a structured concept draft:

${input.brainDump}

${input.companyContext ? `\nCompany Context: ${input.companyContext}` : ''}

Generate a structured concept draft. For timeframe and potentialStart, infer from context if obvious, otherwise propose soft defaults. Never invent hard dates.`

  console.log('[Concept Draft AI] Calling OpenAI', {
    model,
    hasCompanyContext: !!input.companyContext,
    brainDumpLength: input.brainDump.length,
  })

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const content = completion.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('No GPT output received')
  }

  let parsedData: any
  try {
    parsedData = JSON.parse(content)
  } catch (parseError) {
    console.error('[Concept Draft AI] JSON parse error:', parseError)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsedData = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('Invalid JSON response from OpenAI')
    }
  }

  // Validate and normalize
  if (!parsedData.title) {
    throw new Error('OpenAI response missing required field: title')
  }

  return {
    title: parsedData.title.trim(),
    summary: parsedData.summary?.trim() || undefined,
    howItWorks: parsedData.howItWorks?.trim() || undefined,
    whoImpacted: Array.isArray(parsedData.whoImpacted) 
      ? parsedData.whoImpacted.map((w: any) => String(w).trim()).filter(Boolean)
      : [],
    example: parsedData.example?.trim() || undefined,
    timeframe: parsedData.timeframe?.trim() || undefined,
    potentialStart: parsedData.potentialStart?.trim() || undefined,
  }
}

