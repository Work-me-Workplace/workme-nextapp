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
    payloadNotes?: string | null
    intendedTotalUnits?: number | null
    knownShipsInClass?: string[]
    currentProgressEstimate?: number | null
    programStatus?: string | null
    nextDeliveryExpected?: string | null
    lastDeliveryDate?: string | null
    totalLength?: string | null
    totalBeam?: string | null
    totalDisplacementSubmerged?: string | null
    totalManpowerNeeds?: string | null
    totalTimeToBuild?: string | null
    totalEstimatedCostPerUnit?: string | null
    sensors?: string[]
    defenseBuilders?: string[]
    unitsInSeries?: string[]
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

CRITICAL: You MUST return ALL fields below. If a field is not mentioned in the text, set it to null (for strings/numbers) or [] (for arrays). DO NOT omit any fields.

Return JSON with this exact structure - EVERY field must be present:
{
  "platform": {
    "name": "Platform name (e.g., 'Virginia-class', 'DDG-1000') - REQUIRED",
    "category": "Category (e.g., 'Submarine', 'Surface Ship', 'Aircraft') - REQUIRED",
    "platformSeries": "Platform series code if mentioned (e.g., 'SSN', 'SSBN', 'DDG', 'CVN') or null",
    "description": "General description of the platform or null",
    "whySpecial": "What makes this platform special, unique capabilities, or null",
    "payloadNotes": "Payload information including weapons, missiles, capabilities (e.g., 'VPM adds 28 Tomahawk missiles', '12 VLS cells', 'Torpedo tubes') or null - LOOK CAREFULLY FOR PAYLOAD/WEAPONS/MISSILES",
    "intendedTotalUnits": "Total number of units planned/procured (integer, e.g., 66, 12) or null",
    "knownShipsInClass": ["Array of ship names or hull numbers mentioned in text (e.g., 'USS Virginia', 'SSN 774')"] or [],
    "currentProgressEstimate": "Overall program maturity percentage (0-100 integer) or null",
    "programStatus": "Program status if mentioned (e.g., 'On Track', 'Delayed', 'Rebaseline Expected', 'Production', 'Development') or null",
    "nextDeliveryExpected": "ISO date string (YYYY-MM-DD) for next expected delivery or null",
    "lastDeliveryDate": "ISO date string (YYYY-MM-DD) for most recent delivery or null",
    "totalLength": "Total length if mentioned (e.g., '377 ft (115 m)', '560 feet') or null",
    "totalBeam": "Beam/width if mentioned (e.g., '34 ft', '78 feet') or null",
    "totalDisplacementSubmerged": "Displacement if mentioned (e.g., '8,700 tons', '7,800 tons submerged') or null",
    "totalManpowerNeeds": "Crew size if mentioned (e.g., '132 crew', '155 sailors', '134 officers and enlisted') or null",
    "totalTimeToBuild": "Build time if mentioned (e.g., '66–84 months', '5-7 years') or null",
    "totalEstimatedCostPerUnit": "Cost per unit if mentioned (e.g., '$3.2–3.8 billion', '$2.8B per unit') or null",
    "sensors": ["Array of sensor systems mentioned (e.g., 'AN/BQQ-10 sonar', 'AN/BVS-1 photonics mast', 'radar systems')"] or [],
    "defenseBuilders": ["Array of shipyard/builder/contractor names mentioned (e.g., 'HII Newport News', 'Electric Boat', 'General Dynamics')"] or [],
    "unitsInSeries": ["Array of all unit names/hull numbers in the series if listed (e.g., 'SSN 774', 'SSN 775', 'SSN 776')"] or [],
    "classStartDate": "ISO date string (YYYY-MM-DD) when the platform class began (lead ship keel laid down date) or null"
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

IMPORTANT REMINDERS:
- Return ALL fields listed above. If not found in text, use null for strings/numbers/dates, [] for arrays
- Look carefully for payload/weapons/missiles information - it may be mentioned as "armament", "weapons systems", "missile capacity", etc.
- Extract physical specifications (length, beam, displacement, crew) if anywhere in the text
- Include all builders/shipyards mentioned
- Extract all sensor systems mentioned
- For dates, use ISO format (YYYY-MM-DD) only
- For arrays, return empty array [] if nothing found, not null

Text:
${text.substring(0, 4000)}`

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured platform product information from defense and naval documentation. Return only valid JSON. You MUST include ALL fields in the response - set to null if not found, [] for empty arrays. Pay special attention to payload/weapons/missiles information, physical specifications, sensors, builders, and all program details. Extract everything available.',
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
        payloadNotes: parsed.platform.payloadNotes || null,
        intendedTotalUnits: parsed.platform.intendedTotalUnits ? parseInt(parsed.platform.intendedTotalUnits) : null,
        knownShipsInClass: Array.isArray(parsed.platform.knownShipsInClass) ? parsed.platform.knownShipsInClass : [],
        currentProgressEstimate: parsed.platform.currentProgressEstimate ? parseInt(parsed.platform.currentProgressEstimate) : null,
        programStatus: parsed.platform.programStatus || null,
        nextDeliveryExpected: parsed.platform.nextDeliveryExpected || null,
        lastDeliveryDate: parsed.platform.lastDeliveryDate || null,
        totalLength: parsed.platform.totalLength || null,
        totalBeam: parsed.platform.totalBeam || null,
        totalDisplacementSubmerged: parsed.platform.totalDisplacementSubmerged || null,
        totalManpowerNeeds: parsed.platform.totalManpowerNeeds || null,
        totalTimeToBuild: parsed.platform.totalTimeToBuild || null,
        totalEstimatedCostPerUnit: parsed.platform.totalEstimatedCostPerUnit || null,
        sensors: Array.isArray(parsed.platform.sensors) ? parsed.platform.sensors : [],
        defenseBuilders: Array.isArray(parsed.platform.defenseBuilders) ? parsed.platform.defenseBuilders : [],
        unitsInSeries: Array.isArray(parsed.platform.unitsInSeries) ? parsed.platform.unitsInSeries : [],
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
