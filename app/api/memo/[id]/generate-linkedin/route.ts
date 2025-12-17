import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

/**
 * POST /api/memo/[id]/generate-linkedin
 * 
 * Generate a LinkedIn post draft from a memo
 * This is ephemeral - AI output is returned but not persisted
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Await params
    const { id } = await params

    // 4. Parse request body for tone selector
    const body = await request.json().catch(() => ({}))
    const { tone = 'professional' } = body

    // 5. Fetch memo (ensure it belongs to user)
    const memo = await prisma.memo.findFirst({
      where: {
        id,
        workMeId,
      },
    })

    if (!memo) {
      return NextResponse.json(
        { success: false, error: 'Memo not found' },
        { status: 404 }
      )
    }

    // 6. Build tone instructions
    const toneInstructions: Record<string, string> = {
      professional: 'Professional and polished tone. Suitable for senior leaders and broad audience.',
      appreciative: 'Warm and appreciative tone. Express gratitude and acknowledge team contributions.',
      reflective: 'Thoughtful and reflective tone. Share insights and lessons learned.',
      celebratory: 'Enthusiastic and celebratory tone. Highlight wins and positive outcomes.',
    }

    const toneInstruction = toneInstructions[tone] || toneInstructions.professional

    // 7. Generate LinkedIn post with AI
    const openai = getOpenAI()

    const prompt = `Transform this work moment into a professional LinkedIn post.

MEMO DETAILS:
What happened: ${memo.whatHappened}
${memo.whySpecial ? `Why it matters: ${memo.whySpecial}` : ''}
${memo.myRole ? `My role: ${memo.myRole}` : ''}
${memo.impact ? `Impact: ${memo.impact}` : ''}
${memo.thoughts ? `Reflections: ${memo.thoughts}` : ''}
Context: ${memo.contextType}

TONE: ${toneInstruction}

REQUIREMENTS:
- Write in first person
- Professional and authentic
- 2-4 paragraphs
- Focus on insight and impact
- NO hashtags unless explicitly beneficial
- NO emojis unless tone is celebratory
- Lead with the "why" or the impact
- Make it LinkedIn-appropriate (not too casual, not too formal)

Return ONLY the LinkedIn post text, no additional formatting or explanation.`

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at crafting authentic, professional LinkedIn posts that resonate with a professional audience. You help people share their work moments in a way that is genuine, insightful, and valuable to their network.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const generatedContent = response.choices[0].message.content || ''

    return NextResponse.json({
      success: true,
      content: generatedContent.trim(),
      tone,
      memo: {
        id: memo.id,
        whatHappened: memo.whatHappened,
        contextType: memo.contextType,
      },
    })
  } catch (error: any) {
    console.error('❌ GenerateLinkedIn error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate LinkedIn post' },
      { status: 500 }
    )
  }
}
