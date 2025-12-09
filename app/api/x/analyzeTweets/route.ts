/**
 * POST /api/x/analyzeTweets
 * 
 * Analyze tweets using GPT to infer intelligence about a person
 * Updates EcosystemPerson with inferred fields
 * 
 * Body: {
 *   personId: string
 *   tweets: Array<{id, text, createdAt, ...}>
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)

    const body = await request.json()
    const { personId, tweets } = body

    if (!personId) {
      return NextResponse.json(
        { success: false, error: 'personId is required' },
        { status: 400 }
      )
    }

    if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'tweets array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Verify person exists and is in user's contacts
    const person = await prisma.ecosystemPerson.findUnique({
      where: { id: personId },
    })

    if (!person) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      )
    }

    const contact = await prisma.myEcosystemContact.findUnique({
      where: {
        workMeId_personId: {
          workMeId: workMe.id,
          personId: person.id,
        },
      },
    })

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Person not in your contacts' },
        { status: 403 }
      )
    }

    // Prepare tweet text for GPT analysis
    const tweetTexts = tweets
      .slice(0, 20) // Analyze up to 20 most recent tweets
      .map((t: any) => t.text)
      .join('\n\n---\n\n')

    // Get OpenAI API key
    const openAiKey = process.env.OPENAI_API_KEY
    if (!openAiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API not configured' },
        { status: 500 }
      )
    }

    // Call GPT to analyze tweets
    const prompt = `Analyze the following tweets from ${person.fullName}${person.xHandle ? ` (@${person.xHandle})` : ''} who works in the defense/intelligence ecosystem.

Tweets:
${tweetTexts}

Based on these tweets, provide a JSON response with the following structure:
{
  "beat": "short description of their reporting beat/focus area (e.g., 'Navy Aviation', 'Naval Procurement', 'Defense Acquisition')",
  "topics": ["array", "of", "key", "topics", "they", "cover", "e.g.", "FA-XX", "procurement", "carriers"],
  "affinityIndustry": "Primary industry focus (e.g., 'Defense', 'Naval', 'Aviation', 'Space')",
  "affinityToMyOrg": "Likely affinity level to a defense organization ('High', 'Medium', 'Low')",
  "latestSignalSummary": "2-3 sentence summary of their current focus and latest signals/insights"
}

Be concise and accurate. Return ONLY valid JSON, no other text.`

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an intelligence analyst specializing in defense ecosystem analysis. Extract structured insights from social media content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    })

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text()
      console.error('❌ OpenAI API error:', gptResponse.status, errorText)
      return NextResponse.json(
        { success: false, error: `OpenAI API error: ${gptResponse.status}` },
        { status: 500 }
      )
    }

    const gptData = await gptResponse.json()
    const analysisText = gptData.choices?.[0]?.message?.content

    if (!analysisText) {
      return NextResponse.json(
        { success: false, error: 'No analysis returned from GPT' },
        { status: 500 }
      )
    }

    // Parse GPT response
    let analysis: any
    try {
      analysis = JSON.parse(analysisText)
    } catch (parseError) {
      console.error('❌ Failed to parse GPT response:', analysisText)
      return NextResponse.json(
        { success: false, error: 'Failed to parse GPT analysis' },
        { status: 500 }
      )
    }

    // Update EcosystemPerson with inferred intelligence
    const updatedPerson = await prisma.ecosystemPerson.update({
      where: { id: personId },
      data: {
        beat: analysis.beat || undefined,
        topics: analysis.topics || [],
        affinityIndustry: analysis.affinityIndustry || undefined,
        affinityToMyOrg: analysis.affinityToMyOrg || undefined,
        latestSignalSummary: analysis.latestSignalSummary || undefined,
        updatedSummary: analysis.latestSignalSummary || undefined, // Also update general summary
      },
    })

    return NextResponse.json({
      success: true,
      person: updatedPerson,
      analysis,
    })
  } catch (error: any) {
    console.error('❌ POST /api/x/analyzeTweets error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to analyze tweets' },
      { status: 500 }
    )
  }
}

