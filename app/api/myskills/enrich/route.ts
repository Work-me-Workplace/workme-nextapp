import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/myskills/enrich
 * 
 * AI enrichment of raw skills data
 * Uses OpenAI to analyze raw inputs and generate enriched summaries
 * 
 * NOTE: The new WorkSkills model doesn't have AI fields, so we'll store
 * the enriched data in the specialties field or return it in the response.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe
    
    // 3. Fetch WorkSkills record
    const workSkills = await prisma.workSkills.findUnique({
      where: { workMeId },
    }).catch((err: any) => {
      if (err.code === 'P2021') {
        return null // Table doesn't exist
      }
      throw err
    })

    if (!workSkills) {
      return NextResponse.json(
        { success: false, error: 'WorkSkills record not found. Please save raw data first.' },
        { status: 404 },
      )
    }

    // 4. Check if we have raw data to enrich
    if (!workSkills.skillsRaw && !workSkills.strengthsRaw && !workSkills.specialties) {
      return NextResponse.json(
        { success: false, error: 'No raw data to enrich' },
        { status: 400 },
      )
    }

    // 5. Build AI prompt
    const prompt = `Analyze the following WorkMe user inputs:

1. Their skills:
${workSkills.skillsRaw || 'Not provided'}

2. Their strengths:
${workSkills.strengthsRaw || 'Not provided'}

3. Their specialties/job responsibilities:
${workSkills.specialties || 'Not provided'}

Return a JSON object with three fields:
- "skillsSummary": A concise, professional summary of their core skills and capabilities
- "strengthsSummary": A summary of their strengths and what makes them unique
- "specialtiesSummary": A clear summary of their specialties and key areas of expertise

Format the response as valid JSON only, no markdown, no code blocks.`

    // 6. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional career intelligence analyst. Analyze user inputs and provide concise, professional summaries in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    // 7. Parse AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}')
    const {
      skillsSummary,
      strengthsSummary,
      specialtiesSummary,
    } = aiResponse

    // 8. Since WorkSkills doesn't have AI fields, we'll return the enriched data
    // Optionally, we could store it in a JSON field or separate table
    // For now, return it in the response
    console.log('✅ Enriched WorkSkills with AI:', workMeId)

    return NextResponse.json({
      success: true,
      workSkills: {
        ...workSkills,
        // Include AI summaries in response (not stored in DB)
        aiEnrichment: {
          skillsSummary: skillsSummary || null,
          strengthsSummary: strengthsSummary || null,
          specialtiesSummary: specialtiesSummary || null,
        },
      },
      // Backward compatibility
      mySkills: {
        ...workSkills,
        mySkillsAI: skillsSummary || null,
        myStrengthsAI: strengthsSummary || null,
        myJobResponsibilitiesAI: specialtiesSummary || null,
      },
    })
  } catch (error: any) {
    console.error('❌ WorkSkillsEnrich error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enrich skills' },
      { status: 500 },
    )
  }
}
