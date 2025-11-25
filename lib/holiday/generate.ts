/**
 * Holiday Generator Logic
 * 
 * Generates holiday content using OpenAI API
 */

import OpenAI from 'openai'

// Initialize OpenAI client
let openaiInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

export interface HolidayMessage {
  title: string
  caption: string
  internalCaption: string
  externalCaption: string
  altText: string
  recommendedAssetUrl?: string
}

export interface Asset {
  id: string
  url: string
  fileName: string
  category: string
  holidaySlug?: string | null
}

/**
 * Generate holiday message content for a given holiday
 */
export async function generateHolidayMessage(
  holidaySlug: string,
  assets: Asset[],
): Promise<HolidayMessage> {
  const openai = getOpenAIClient()
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  // Map holiday slug to display name
  const holidayNames: Record<string, string> = {
    thanksgiving: 'Thanksgiving',
    'veterans-day': 'Veterans Day',
    'memorial-day': 'Memorial Day',
    'new-year': 'New Year',
    'independence-day': 'Independence Day',
    'labor-day': 'Labor Day',
    'christmas': 'Christmas',
    'easter': 'Easter',
    'presidents-day': 'Presidents Day',
    'martin-luther-king-day': 'Martin Luther King Jr. Day',
  }

  const holidayName = holidayNames[holidaySlug] || holidaySlug

  // Build asset context
  const assetContext = assets.length > 0
    ? `\n\nAvailable assets:\n${assets.map(a => `- ${a.fileName} (${a.category}): ${a.url}`).join('\n')}`
    : '\n\nNo specific assets available, but you can suggest general imagery themes.'

  const systemPrompt = `You are a professional social media and internal communications content creator for a government organization (NAVSEA).

Generate holiday messaging content that is:
- Professional and respectful
- Appropriate for both internal workforce and external public audiences
- Inclusive and welcoming
- Aligned with government communication standards
- Engaging but not overly casual

Return ONLY valid JSON in this exact structure:
{
  "title": "Holiday greeting title (e.g., 'Happy Thanksgiving')",
  "caption": "Main social media caption (suitable for all platforms)",
  "internalCaption": "Internal workforce version (can be more detailed, include internal context)",
  "externalCaption": "External public version (more general, public-facing)",
  "altText": "Descriptive ALT text for accessibility (describe the image/visual)",
  "recommendedAssetUrl": "URL of best matching asset from the list, or empty string if none match"
}`

  const userPrompt = `Generate holiday messaging content for ${holidayName}.

Requirements:
- Create a title that's warm and professional
- Write a social media caption (2-3 sentences, engaging)
- Write an internal workforce caption (can include internal context, more detailed)
- Write an external public caption (general public, professional)
- Write descriptive ALT text for the social graphic
- Recommend the best asset from the available list, or leave empty if none are suitable${assetContext}

Make the content appropriate for a government organization celebrating this holiday.`

  console.log('[Holiday Generator] Calling OpenAI', {
    model,
    holidaySlug,
    holidayName,
    assetCount: assets.length,
  })

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
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

    // Parse JSON response
    let holidayMessage: HolidayMessage
    try {
      holidayMessage = JSON.parse(content)
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        holidayMessage = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from OpenAI')
      }
    }

    // Validate required fields
    if (!holidayMessage.title || !holidayMessage.caption) {
      throw new Error('OpenAI response missing required fields')
    }

    // Ensure all fields are strings
    holidayMessage.title = holidayMessage.title || ''
    holidayMessage.caption = holidayMessage.caption || ''
    holidayMessage.internalCaption = holidayMessage.internalCaption || holidayMessage.caption
    holidayMessage.externalCaption = holidayMessage.externalCaption || holidayMessage.caption
    holidayMessage.altText = holidayMessage.altText || `Image for ${holidayName}`
    holidayMessage.recommendedAssetUrl = holidayMessage.recommendedAssetUrl || ''

    console.log('[Holiday Generator] SUCCESS', {
      title: holidayMessage.title,
      hasRecommendedAsset: !!holidayMessage.recommendedAssetUrl,
    })

    return holidayMessage
  } catch (error: any) {
    console.error('[Holiday Generator] ERROR:', error)
    throw new Error(`Failed to generate holiday message: ${error.message}`)
  }
}

