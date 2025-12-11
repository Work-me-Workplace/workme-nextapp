import { NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface PlatformParseResult {
  platform: {
    name: string
    category: string
    platformSeries?: string | null
    description?: string | null
    whySpecial?: string | null
    totalLength?: string | null
    totalBeam?: string | null
    totalDisplacementSubmerged?: string | null
    totalManpowerNeeds?: string | null
    totalTimeToBuild?: string | null
    totalEstimatedCostPerUnit?: string | null
    sensors?: string[]
    defenseBuilders?: string[]
    unitsInSeries?: string[]
    yearsSinceLastInClass?: number | null
    classStartDate?: string | null
  }
  units: Array<{
    hullNumber: string
    name?: string | null
    lifecycleStatus?: string | null
  }>
  milestones: Array<{
    milestoneType: 'CONTRACT_AWARDED' | 'KEEL_LAYING' | 'HULL_COMPLETION' | 'LAUNCH' | 'SEA_TRIALS' | 'DELIVERY' | 'COMMISSIONING'
    description?: string | null
    date?: string | null
    unitHullNumber?: string | null
  }>
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    const openai = getOpenAI()

    const prompt = `Extract structured platform product information from this text (Wikipedia, CRS report, press release, etc.).

Return JSON with this exact structure:
{
  "platform": {
    "name": "Platform name (e.g., 'Virginia-class', 'DDG-1000')",
    "category": "Category (e.g., 'Submarine', 'Surface Ship', 'Aircraft')",
    "platformSeries": "Platform series if mentioned (e.g., 'SSN', 'SSBN', 'DDG') or null",
    "description": "Description of the platform or null",
    "whySpecial": "What makes this platform special or null",
    "totalLength": "Total length if mentioned (e.g., '377 ft (115 m)') or null",
    "totalBeam": "Total beam if mentioned or null",
    "totalDisplacementSubmerged": "Displacement if mentioned (e.g., '8,700 tons') or null",
    "totalManpowerNeeds": "Crew size if mentioned (e.g., '132 crew') or null",
    "totalTimeToBuild": "Build time if mentioned (e.g., '66–84 months') or null",
    "totalEstimatedCostPerUnit": "Cost per unit if mentioned (e.g., '$3.2–3.8 billion') or null",
    "sensors": ["Array of sensor systems mentioned"] or [],
    "defenseBuilders": ["Array of shipyard/builder names mentioned"] or [],
    "unitsInSeries": ["Array of unit names/hull numbers in the series"] or [],
    "yearsSinceLastInClass": "Years since last unit in class was delivered (integer) or null",
    "classStartDate": "ISO date string (YYYY-MM-DD) when the platform class began (lead ship keel laid down) or null"
  },
  "units": [
    {
      "hullNumber": "Hull number (e.g., 'SSN 804', 'DDG 1000')",
      "name": "Unit name if mentioned or null",
      "lifecycleStatus": "Status if mentioned (e.g., 'under construction', 'in service') or null"
    }
  ],
  "milestones": [
    {
      "milestoneType": "One of: CONTRACT_AWARDED, KEEL_LAYING, HULL_COMPLETION, LAUNCH, SEA_TRIALS, DELIVERY, COMMISSIONING",
      "description": "Description or null",
      "date": "ISO date string (YYYY-MM-DD) if mentioned or null",
      "unitHullNumber": "Hull number of the unit this milestone applies to (e.g., 'SSN 804') or null if it applies to the platform"
    }
  ]
}

Text:
${text.substring(0, 4000)}`

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured platform product information from defense and naval documentation. Return only valid JSON. Extract all physical attributes, sensors, builders, and unit information when available.',
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

    // Validate structure
    if (!parsed.platform || !parsed.platform.name || !parsed.platform.category) {
      return NextResponse.json(
        { success: false, error: 'Invalid response structure from AI' },
        { status: 500 }
      )
    }

    const result: PlatformParseResult = {
      platform: {
        name: parsed.platform.name || '',
        category: parsed.platform.category || '',
        platformSeries: parsed.platform.platformSeries || null,
        description: parsed.platform.description || null,
        whySpecial: parsed.platform.whySpecial || null,
        totalLength: parsed.platform.totalLength || null,
        totalBeam: parsed.platform.totalBeam || null,
        totalDisplacementSubmerged: parsed.platform.totalDisplacementSubmerged || null,
        totalManpowerNeeds: parsed.platform.totalManpowerNeeds || null,
        totalTimeToBuild: parsed.platform.totalTimeToBuild || null,
        totalEstimatedCostPerUnit: parsed.platform.totalEstimatedCostPerUnit || null,
        sensors: Array.isArray(parsed.platform.sensors) ? parsed.platform.sensors : [],
        defenseBuilders: Array.isArray(parsed.platform.defenseBuilders) ? parsed.platform.defenseBuilders : [],
        unitsInSeries: Array.isArray(parsed.platform.unitsInSeries) ? parsed.platform.unitsInSeries : [],
        yearsSinceLastInClass: parsed.platform.yearsSinceLastInClass ? parseInt(parsed.platform.yearsSinceLastInClass) : null,
        classStartDate: parsed.platform.classStartDate || null,
      },
      units: Array.isArray(parsed.units) ? parsed.units.map((u: any) => ({
        hullNumber: u.hullNumber || '',
        name: u.name || null,
        lifecycleStatus: u.lifecycleStatus || null,
      })) : [],
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones
        .filter((m: any) => {
          // Only include milestones with valid milestoneType
          const validTypes = ['CONTRACT_AWARDED', 'KEEL_LAYING', 'HULL_COMPLETION', 'LAUNCH', 'SEA_TRIALS', 'DELIVERY', 'COMMISSIONING']
          return m.milestoneType && validTypes.includes(m.milestoneType)
        })
        .map((m: any) => ({
          milestoneType: m.milestoneType,
          description: m.description || null,
          date: m.date || null,
          unitHullNumber: m.unitHullNumber || null,
        })) : [],
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Failed to parse platform with AI:', error)
    
    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse platform' },
      { status: 500 }
    )
  }
}
