import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { setSections } from '@/lib/workstuff/sections-store'
import { storeRawBlob } from '@/lib/redis'
import { inferCompanyXType } from '@/lib/services/companyx-topic-inference'
import { randomUUID } from 'crypto'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

    // Step 3: If 0 sections found → create ONE default section (still infer!)
    let finalSections: Array<{ id: string; heading: string; rawText: string; inferredType: string; status: string }>
    
    if (sections.length === 0) {
      // Fallback: Create one default section, but ALWAYS infer type
      const inference = await inferCompanyXType(blob)
      finalSections = [{
        id: randomUUID(),
        heading: '', // Empty heading - UI will show "Section 1"
        rawText: blob,
        inferredType: inference.type, // ALWAYS infer, never use placeholder
        status: 'pending',
      }]
    } else {
      // Step 4: ALWAYS infer type for each section using hybrid inference service
      finalSections = await Promise.all(
        sections.map(async (section) => {
          // ALWAYS run inference - no conditional logic, no skipping
          const inference = await inferCompanyXType(section.rawText)
          return {
            id: randomUUID(),
            heading: section.heading || '', // Empty heading is OK - UI will show "Section N"
            rawText: section.rawText,
            inferredType: inference.type, // ALWAYS a valid CompanyXType enum
            status: 'pending' as const,
          }
        })
      )
    }

    // Step 5: Store in Redis (using centralized serialization)
    await setSections(workMeId, finalSections)

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


