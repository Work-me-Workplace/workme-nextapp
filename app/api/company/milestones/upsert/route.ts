/**
 * POST /api/company/milestones/upsert
 * 
 * Upsert a CompanyMilestone from a CompanyNewsArtifact
 * Parses the news artifact and creates/updates the milestone
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { newsArtifactId, milestoneId } = body

    if (!newsArtifactId) {
      return NextResponse.json(
        { success: false, error: 'newsArtifactId is required' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/company/milestones/upsert]', {
      workMeId,
      companyId,
      newsArtifactId,
      milestoneId,
    })

    // Step 1: Fetch the news artifact
    const artifact = await prisma.companyNewsArtifact.findUnique({
      where: { id: newsArtifactId },
    })

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'News artifact not found' },
        { status: 404 }
      )
    }

    if (artifact.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Step 2: Parse the artifact to extract milestone information
    const openai = getOpenAI()
    const systemPrompt = `You are extracting company milestone information from news articles and press releases. 
Extract structured milestone data that can be used for workforce communications.`

    const userPrompt = `Extract milestone information from this text.

FIELDS TO EXTRACT:
- title (String, required): The milestone title (e.g., "USS Barb (SSN-804) Keel Laying", "Product Launch", "Major Contract Award")
- category (String): e.g., "PLATFORM_UNIT", "BUSINESS", "STRATEGY", "ACHIEVEMENT"
- milestoneType (String): e.g., "KEEL_LAYING", "DELIVERY", "COMMISSIONING", "CONTRACT", "AWARD", "EXPANSION"
- date (ISO date YYYY-MM-DD): The milestone date
- description (String): 2-3 sentences describing the milestone and its significance
- platformUnitId (String, optional): Leave null unless explicitly linking to an existing platform unit
- sourceUrl (String): URL of the original news source

If the article mentions a specific platform unit (ship name, hull number), include that in the title.
Focus on major company achievements, platform milestones, and strategic events.

Return ONLY valid JSON.

Article Headline: ${artifact.headline || 'N/A'}
Source: ${artifact.sourceName || 'N/A'}
URL: ${artifact.sourceUrl || 'N/A'}

Text:
${artifact.rawText.substring(0, 6000)}`

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const parsed = JSON.parse(response.choices[0].message.content || '{}')

    if (!parsed.title) {
      return NextResponse.json(
        { success: false, error: 'Could not extract milestone title from article' },
        { status: 400 }
      )
    }

    // Step 3: Upsert the milestone
    let milestone
    if (milestoneId) {
      // Update existing milestone
      milestone = await prisma.companyMilestone.update({
        where: { id: milestoneId },
        data: {
          title: parsed.title,
          category: parsed.category || null,
          milestoneType: parsed.milestoneType || null,
          date: parsed.date ? new Date(parsed.date) : null,
          description: parsed.description || null,
          sourceUrl: parsed.sourceUrl || artifact.sourceUrl || null,
          newsArtifactId: newsArtifactId,
          platformUnitId: parsed.platformUnitId || null,
        },
        include: {
          newsArtifact: {
            select: {
              id: true,
              headline: true,
              sourceName: true,
              sourceUrl: true,
            },
          },
          platformUnit: {
            select: {
              id: true,
              name: true,
              hullNumber: true,
            },
          },
        },
      })
    } else {
      // Create new milestone
      milestone = await prisma.companyMilestone.create({
        data: {
          companyId,
          title: parsed.title,
          category: parsed.category || null,
          milestoneType: parsed.milestoneType || null,
          date: parsed.date ? new Date(parsed.date) : null,
          description: parsed.description || null,
          sourceUrl: parsed.sourceUrl || artifact.sourceUrl || null,
          newsArtifactId: newsArtifactId,
          platformUnitId: parsed.platformUnitId || null,
        },
        include: {
          newsArtifact: {
            select: {
              id: true,
              headline: true,
              sourceName: true,
              sourceUrl: true,
            },
          },
          platformUnit: {
            select: {
              id: true,
              name: true,
              hullNumber: true,
            },
          },
        },
      })
    }

    console.log(`✅ ${milestoneId ? 'Updated' : 'Created'} milestone ${milestone.id}`)

    return NextResponse.json({
      success: true,
      milestone: {
        id: milestone.id,
        title: milestone.title,
        category: milestone.category,
        milestoneType: milestone.milestoneType,
        date: milestone.date,
        description: milestone.description,
        sourceUrl: milestone.sourceUrl,
        newsArtifact: milestone.newsArtifact,
        platformUnit: milestone.platformUnit,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/milestones/upsert error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upsert milestone' },
      { status: 500 }
    )
  }
}
