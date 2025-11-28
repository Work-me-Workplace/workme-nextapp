import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { storeSections, storeRawBlob } from '@/lib/redis'
import OpenAI from 'openai'
import { randomUUID } from 'crypto'

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
 * Infer Sections - Single Action
 * 
 * Takes raw blob → Splits into sections → Infers types → Stores in Redis → Returns sections
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
    const { blob } = await request.json()

    if (!blob || typeof blob !== 'string') {
      return NextResponse.json(
        { success: false, error: 'blob is required' },
        { status: 400 }
      )
    }

    // Step 1: Store raw blob
    await storeRawBlob(workMeId, blob)

    // Step 2: Split into sections
    const sections = splitIntoSections(blob)

    // Step 3: If 0 sections found → create ONE default section
    let finalSections: Array<{ id: string; heading: string; rawText: string; inferredType: string; status: string }>
    
    if (sections.length === 0) {
      // Fallback: Create one default section
      finalSections = [{
        id: randomUUID(),
        heading: 'General',
        rawText: blob,
        inferredType: 'training', // default fallback
        status: 'pending',
      }]
    } else {
      // Step 4: Infer type for each section
      const openai = getOpenAI()
      finalSections = await Promise.all(
        sections.map(async (section) => {
          const inferredType = await inferSectionType(openai, section.rawText)
          return {
            id: randomUUID(),
            heading: section.heading,
            rawText: section.rawText,
            inferredType,
            status: 'pending' as const,
          }
        })
      )
    }

    // Step 5: Store in Redis
    await storeSections(workMeId, finalSections)

    return NextResponse.json({
      success: true,
      sections: finalSections,
    })
  } catch (error: any) {
    console.error('[Infer Sections] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to infer sections' },
      { status: 500 }
    )
  }
}

/**
 * Split blob into sections using multiple strategies
 */
function splitIntoSections(blob: string): Array<{ rawText: string; heading: string }> {
  const sections: Array<{ rawText: string; heading: string }> = []
  const lines = blob.split('\n')
  
  let currentSection: string[] = []
  let currentHeading = 'Untitled Section'
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Check for section separators
    const isSeparator = trimmed.match(/^\+{3,}$/) // +++++ separator
    const isAllCaps = trimmed.length > 3 && trimmed === trimmed.toUpperCase() && /^[A-Z\s\d\-:]+$/.test(trimmed) // ALL CAPS heading
    const isBlankLine = trimmed === ''
    
    // If we hit a separator or ALL CAPS line, save current section and start new one
    if ((isSeparator || isAllCaps) && currentSection.length > 0) {
      sections.push({
        rawText: currentSection.join('\n'),
        heading: currentHeading,
      })
      currentSection = []
      if (isAllCaps) {
        currentHeading = trimmed
        currentSection.push(line) // Include the heading in the section
      } else {
        currentHeading = 'Untitled Section'
      }
    } else if (isBlankLine && currentSection.length > 0 && i < lines.length - 1) {
      // Blank line might be a boundary - check if next line looks like a heading
      const nextLine = lines[i + 1]?.trim() || ''
      const nextIsHeading = nextLine.length > 3 && nextLine === nextLine.toUpperCase() && /^[A-Z\s\d\-:]+$/.test(nextLine)
      
      if (nextIsHeading && currentSection.length > 5) {
        // Save current section if it has content
        sections.push({
          rawText: currentSection.join('\n'),
          heading: currentHeading,
        })
        currentSection = []
        currentHeading = nextLine
      } else {
        currentSection.push(line) // Keep blank line in current section
      }
    } else {
      currentSection.push(line)
    }
  }
  
  // Add final section
  if (currentSection.length > 0) {
    sections.push({
      rawText: currentSection.join('\n'),
      heading: currentHeading,
    })
  }
  
  // Filter out empty sections (keep sections with at least 10 chars)
  return sections.filter(s => s.rawText.trim().length > 10)
}

/**
 * Infer CompanyX type for a section using GPT
 */
async function inferSectionType(openai: OpenAI, sectionText: string): Promise<string> {
  const prompt = `Analyze this workforce communication section and classify it into ONE of these types:
- training (training programs, courses, learning, workshops, certifications)
- event (company events, gatherings, meetings, celebrations)
- campaign (company campaigns, initiatives, drives)
- impact_event (disruptions, changes affecting workforce, announcements)
- benefits (benefits enrollment, open season, health benefits)
- community (community engagement, volunteer opportunities)
- career (career development, promotions, opportunities, job postings)
- employee_cause (employee causes, drives, collections, fundraisers)

Section text:
${sectionText.substring(0, 1000)}

Return ONLY the type name (e.g., "training", "event", etc.) - no explanation, no JSON, just the type.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at classifying workforce communication content. Return only the type name.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 20,
    })

    const type = response.choices[0].message.content?.trim().toLowerCase() || 'training'
    
    // Validate type
    const validTypes = ['training', 'event', 'campaign', 'impact_event', 'benefits', 'community', 'career', 'employee_cause']
    return validTypes.includes(type) ? type : 'training' // Default to training
  } catch (error) {
    console.error('Type inference error:', error)
    return 'training' // Default fallback
  }
}

