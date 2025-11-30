import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/parse-event
 * Parse unstructured event text using AI
 * 
 * Body: { text: string } or FormData with text and optional file
 * Returns: { success: true, data: {...parsedEventData} }
 */
export async function POST(request: Request) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    console.log('[API POST /api/ai/parse-event]', {
      workMeId,
      companyUnit,
    })

    const formData = await request.formData()
    const text = formData.get('text') as string | null
    const file = formData.get('file') as File | null

    if (!text && !file) {
      return NextResponse.json(
        { success: false, error: 'Text or file is required' },
        { status: 400 },
      )
    }

    // For now, we'll do a simple text extraction and basic parsing
    // In a full implementation, you would:
    // 1. If file is provided, extract text using OCR (Tesseract, Google Vision, etc.)
    // 2. Send text to OpenAI GPT-4 with a structured prompt
    // 3. Parse the JSON response

    let textToParse = text || ''

    // If file is provided, extract text (simplified - in production use OCR)
    if (file) {
      // TODO: Implement OCR extraction
      // For now, we'll just use the filename as a hint
      textToParse = `Event from file: ${file.name}\n\n${textToParse}`
    }

    if (!textToParse.trim()) {
      return NextResponse.json(
        { success: false, error: 'No text to parse' },
        { status: 400 },
      )
    }

    // Simple AI parsing simulation
    // In production, call OpenAI API here
    const parsedData = await parseEventTextWithAI(textToParse)

    console.log('[API POST /api/ai/parse-event] SUCCESS', {
      workMeId,
      companyUnit,
      parsedFields: Object.keys(parsedData),
    })

    return NextResponse.json({
      success: true,
      data: parsedData,
    })
  } catch (error: any) {
    console.error('❌ POST /api/ai/parse-event error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to parse event',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

/**
 * Parse event text using AI (OpenAI GPT-4)
 * This is a placeholder - implement with actual OpenAI API call
 */
async function parseEventTextWithAI(text: string): Promise<any> {
  // TODO: Implement actual OpenAI API call
  // For now, return a basic structure that can be enhanced
  
  // Simple regex-based extraction as fallback
  const titleMatch = text.match(/title[:\s]+([^\n]+)/i) || 
                     text.match(/event[:\s]+([^\n]+)/i) ||
                     text.split('\n')[0]
  
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
                    text.match(/(\w+\s+\d{1,2},?\s+\d{4})/i)
  
  const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  
  const locationMatch = text.match(/location[:\s]+([^\n]+)/i) ||
                        text.match(/where[:\s]+([^\n]+)/i)
  
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  
  const phoneMatch = text.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i)

  return {
    title: typeof titleMatch === 'string' ? titleMatch.trim() : (titleMatch?.[1]?.trim() || ''),
    description: text.substring(0, 500), // First 500 chars as description
    startDate: dateMatch ? new Date(dateMatch[0]).toISOString() : null,
    startTime: timeMatch ? timeMatch[0] : null,
    location: locationMatch?.[1]?.trim() || locationMatch?.[0]?.trim() || '',
    pocEmail: emailMatch ? emailMatch[0] : '',
    pocPhone: phoneMatch ? phoneMatch[0] : '',
    // Additional fields would be extracted by AI
    eventCategory: '',
    registrationRequired: text.toLowerCase().includes('rsvp') || text.toLowerCase().includes('register') ? 'Yes' : 'No',
    registrationLink: text.match(/https?:\/\/[^\s]+/)?.[0] || '',
    speakers: [],
    foodProvided: text.toLowerCase().includes('food') || text.toLowerCase().includes('catering') ? 'Yes' : 'No',
    foodTypes: '',
    promotionNeeds: [],
  }
}

