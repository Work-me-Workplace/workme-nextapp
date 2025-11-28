import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { storeRawBlob, storeProposedCompanyX } from '@/lib/redis'
import OpenAI from 'openai'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

/**
 * LAYER 1: SUPREME PARSER (One-Shot Ingest)
 * 
 * Accepts raw blob → Topic Classification → High-Level CompanyX Extraction
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth.workMeId || !auth.companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { workMeId, companyId } = auth

    const { rawBlob } = await request.json()

    if (!rawBlob || typeof rawBlob !== 'string') {
      return NextResponse.json(
        { success: false, error: 'rawBlob is required' },
        { status: 400 }
      )
    }

    // Step 1: Store raw blob in Redis
    await storeRawBlob(workMeId, rawBlob)

    // Step 2: Topic Classification
    const classificationPrompt = `You are analyzing workforce communication content. Classify the following content into one of these types:
- event (company events, gatherings, meetings)
- training (training programs, courses, learning)
- campaign (company campaigns, initiatives)
- impact_event (disruptions, changes affecting workforce)
- benefits (benefits enrollment, open season)
- community (community engagement, volunteer opportunities)
- career (career development, promotions, opportunities)
- employee_cause (employee causes, drives, collections)

Content:
${rawBlob.substring(0, 2000)}

Return JSON with:
{
  "proposedType": "one of the types above",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`

    const openai = getOpenAI()
    const classificationResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at classifying workforce communication content. Return only valid JSON.',
        },
        {
          role: 'user',
          content: classificationPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const classification = JSON.parse(classificationResponse.choices[0].message.content || '{}')
    const proposedType = classification.proposedType || 'event'
    const confidence = classification.confidence || 0.5

    // Step 3: High-Level CompanyX Extraction
    const extractionPrompt = `Extract structured data for a ${proposedType} from the following content.

Content:
${rawBlob}

Return JSON with all relevant fields for a ${proposedType}. Include:
- title (required)
- description
- Any date/time fields (startDate, endDate, eventDate, trainingDate, windowStart, windowEnd, etc.)
- Any location fields
- Any links (registrationLink, link, signUpLink, etc.)
- Any other relevant fields based on the type

Return as:
{
  "${proposedType}": {
    "title": "...",
    "description": "...",
    ...other fields
  },
  "metadata": {
    "extractedAt": "${new Date().toISOString()}",
    "sourceLength": ${rawBlob.length}
  }
}`

    const extractionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured data from workforce communications. Return only valid JSON.',
        },
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const extracted = JSON.parse(extractionResponse.choices[0].message.content || '{}')

    // Step 4: Store proposed CompanyX in Redis
    const proposedData = {
      type: proposedType,
      confidence,
      reasoning: classification.reasoning,
      extractedData: extracted[proposedType] || extracted,
      metadata: extracted.metadata || {},
    }

    await storeProposedCompanyX(workMeId, proposedData)

    return NextResponse.json({
      success: true,
      proposed: proposedData,
    })
  } catch (error: any) {
    console.error('[Supreme Parser] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse content' },
      { status: 500 }
    )
  }
}

