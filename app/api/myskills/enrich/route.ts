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
 * Uses OpenAI to analyze raw inputs and generate enriched fields
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe
    
    // 3. Fetch MySkills record
    const mySkills = await prisma.mySkills.findUnique({
      where: { workMeId },
    })

    if (!mySkills) {
      return NextResponse.json(
        { success: false, error: 'MySkills record not found. Please save raw data first.' },
        { status: 404 },
      )
    }

    // 4. Check if we have raw data to enrich
    if (!mySkills.mySkillsRaw && !mySkills.myJobResponsibilitiesRaw && !mySkills.myStrengthsRaw) {
      return NextResponse.json(
        { success: false, error: 'No raw data to enrich' },
        { status: 400 },
      )
    }

    // 5. Build AI prompt
    const prompt = `Analyze the following WorkMe user inputs:

1. What they do:
${mySkills.mySkillsRaw || 'Not provided'}

2. Their job responsibilities:
${mySkills.myJobResponsibilitiesRaw || 'Not provided'}

3. Their strengths or specialties:
${mySkills.myStrengthsRaw || 'Not provided'}

Return a JSON object with three fields:
- "mySkillsAI": A concise, professional summary of their core skills and capabilities
- "myJobResponsibilitiesAI": A clear summary of their job responsibilities and key tasks
- "myStrengthsAI": A summary of their strengths and specialties

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
      mySkillsAI,
      myJobResponsibilitiesAI,
      myStrengthsAI,
    } = aiResponse

    // 8. Update MySkills with AI-enriched fields
    const updated = await prisma.mySkills.update({
      where: { workMeId },
      data: {
        mySkillsAI: mySkillsAI || null,
        myJobResponsibilitiesAI: myJobResponsibilitiesAI || null,
        myStrengthsAI: myStrengthsAI || null,
      },
    })

    console.log('✅ Enriched MySkills with AI:', workMeId)

    return NextResponse.json({
      success: true,
      mySkills: updated,
    })
  } catch (error: any) {
    console.error('❌ MySkillsEnrich error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enrich skills' },
      { status: 500 },
    )
  }
}

