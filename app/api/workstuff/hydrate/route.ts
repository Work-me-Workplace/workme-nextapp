import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getSections, storeHydratedModel } from '@/lib/redis'
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
 * STEP 3: Hydrate Training Models Only
 * 
 * If type === "training": generate Training model fields
 * Else: mark as "coming_soon"
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

    const { workMeId } = auth
    const { sectionId } = await request.json()

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'sectionId is required' },
        { status: 400 }
      )
    }

    // Get section
    const sections = await getSections(workMeId)
    const section = sections.find((s: any) => s.id === sectionId)

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      )
    }

    // Only hydrate training
    if (section.type !== 'training') {
      return NextResponse.json({
        success: true,
        section: {
          ...section,
          modelStatus: 'coming_soon',
        },
        message: 'Model coming soon for this type',
      })
    }

    // Hydrate training model
    const openai = getOpenAI()
    const trainingModel = await generateTrainingModel(openai, section.rawText)

    // Store hydrated model
    await storeHydratedModel(workMeId, sectionId, {
      companyX: trainingModel,
      status: 'hydrated',
    })

    return NextResponse.json({
      success: true,
      model: trainingModel,
      sectionId,
    })
  } catch (error: any) {
    console.error('[Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate model' },
      { status: 500 }
    )
  }
}

/**
 * Generate Training model from raw text
 */
async function generateTrainingModel(openai: OpenAI, rawText: string): Promise<any> {
  const prompt = `Extract structured training information from this text and return as JSON:

Text:
${rawText.substring(0, 2000)}

Return JSON with these fields:
{
  "title": "Training title or name",
  "description": "Full description of the training",
  "startDate": "ISO date string or null",
  "endDate": "ISO date string or null",
  "poc": {
    "name": "Point of contact name or null",
    "email": "Email address or null",
    "phone": "Phone number or null"
  },
  "links": ["array of URLs or empty array"],
  "metadata": {
    "location": "location if mentioned",
    "format": "in-person, virtual, hybrid, or null",
    "duration": "duration if mentioned",
    "cost": "cost if mentioned",
    "prerequisites": "prerequisites if mentioned"
  }
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured training information. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const model = JSON.parse(response.choices[0].message.content || '{}')
    
    // Ensure required fields exist
    return {
      title: model.title || 'Untitled Training',
      description: model.description || '',
      startDate: model.startDate || null,
      endDate: model.endDate || null,
      poc: model.poc || { name: null, email: null, phone: null },
      links: model.links || [],
      metadata: model.metadata || {},
    }
  } catch (error) {
    console.error('Training model generation error:', error)
    // Return default structure on error
    return {
      title: 'Untitled Training',
      description: rawText.substring(0, 500),
      startDate: null,
      endDate: null,
      poc: { name: null, email: null, phone: null },
      links: [],
      metadata: {},
    }
  }
}

