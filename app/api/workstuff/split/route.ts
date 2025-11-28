import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { setSections } from '@/lib/workstuff/sections-store'
import { inferCompanyXType } from '@/lib/services/companyx-topic-inference'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STEP 1: Section Split + Inference
 * 
 * Splits blob into sections using:
 * - ALL CAPS lines
 * - +++++ separators
 * - blank line boundaries
 * 
 * Infers CompanyX type for each section
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
    const { rawBlob } = await request.json()

    if (!rawBlob || typeof rawBlob !== 'string') {
      return NextResponse.json(
        { success: false, error: 'rawBlob is required' },
        { status: 400 }
      )
    }

    // Split into sections
    const sections = splitIntoSections(rawBlob)

    // Infer type for each section using hybrid inference service
    const sectionsWithTypes = await Promise.all(
      sections.map(async (section, index) => {
        const inference = await inferCompanyXType(section.rawText)
        return {
          id: `section_${index}_${Date.now()}`,
          rawText: section.rawText,
          heading: section.heading,
          inferredType: inference.type,
          status: 'pending' as const,
        }
      })
    )

    // Store in Redis (using centralized serialization)
    await setSections(workMeId, sectionsWithTypes)

    return NextResponse.json({
      success: true,
      sections: sectionsWithTypes,
    })
  } catch (error: any) {
    console.error('[Section Split] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to split sections' },
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
  let currentHeading = '' // Empty heading - UI will show "Section N"
  
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
        currentHeading = '' // Empty heading - UI will show "Section N"
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
        currentHeading = nextLine || '' // Empty if no heading
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
  
  // Filter out empty sections
  return sections.filter(s => s.rawText.trim().length > 10)
}


