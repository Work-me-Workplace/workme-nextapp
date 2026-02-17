/**
 * POST /api/mywork/sharepoint-entry/render
 *
 * Builds a SharePoint Events entry from a workforcestuff item (training, event, or community).
 * No new model: data comes from CompanyTraining / CompanyEvent / CompanyCommunity.
 * Optional: use OpenAI to format the "When" string for the prompt.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

/** SharePoint Events entry shape: Title, When (string), Where, Category, Link */
export interface SharePointEventEntry {
  title: string
  when: string
  where: string
  category: 'Training' | 'Community Event'
  link: string
}

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function formatWhenString(dateIso: string | null, startTime: string | null, endTime: string | null): string {
  const parts: string[] = []
  if (dateIso) {
    try {
      const d = new Date(dateIso)
      parts.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }))
    } catch {
      parts.push(dateIso)
    }
  }
  if (startTime || endTime) {
    const timePart = [startTime, endTime].filter(Boolean).join(' – ')
    if (timePart) parts.push(timePart)
  }
  return parts.length ? parts.join(', ') : ''
}

export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const companyId = workMe.companyId

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { sourceId, sourceType, formatWithAi } = body as {
      sourceId: string
      sourceType: string
      formatWithAi?: boolean
    }

    if (!sourceId || !sourceType) {
      return NextResponse.json(
        { success: false, error: 'sourceId and sourceType are required' },
        { status: 400 }
      )
    }

    const allowed = ['training', 'event', 'community']
    if (!allowed.includes(sourceType)) {
      return NextResponse.json(
        { success: false, error: 'SharePoint Entry is only for training, event, or community' },
        { status: 400 }
      )
    }

    let entry: SharePointEventEntry

    if (sourceType === 'training') {
      const row = await prisma.companyTraining.findFirst({
        where: { id: sourceId, companyId },
      })
      if (!row) {
        return NextResponse.json(
          { success: false, error: 'Training not found' },
          { status: 404 }
        )
      }
      const dateIso = row.trainingDate?.toISOString() ?? null
      let regLinks: { url?: string }[] = []
      if (row.registrationLinks) {
        try {
          const parsed = typeof row.registrationLinks === 'string' ? JSON.parse(row.registrationLinks) : row.registrationLinks
          regLinks = Array.isArray(parsed) ? parsed : []
        } catch {
          regLinks = []
        }
      }
      const link =
        (row.link && row.link.trim()) || (regLinks[0]?.url && regLinks[0].url.trim()) || ''
      entry = {
        title: row.title ?? 'Untitled Training',
        when: formatWhenString(dateIso, row.startTime ?? null, row.endTime ?? null),
        where: row.location ?? '',
        category: 'Training',
        link: link,
      }
    } else if (sourceType === 'event') {
      const row = await prisma.companyEvent.findFirst({
        where: { id: sourceId, companyId },
      })
      if (!row) {
        return NextResponse.json(
          { success: false, error: 'Event not found' },
          { status: 404 }
        )
      }
      const dateIso = row.eventDate?.toISOString() ?? null
      entry = {
        title: row.title ?? 'Untitled Event',
        when: formatWhenString(dateIso, row.startTime ?? null, row.endTime ?? null),
        where: row.location ?? '',
        category: row.eventCategory === 'COMMUNITY' ? 'Community Event' : 'Community Event',
        link: row.registrationLink ?? '',
      }
    } else {
      const row = await prisma.companyCommunity.findFirst({
        where: { id: sourceId, companyId },
      })
      if (!row) {
        return NextResponse.json(
          { success: false, error: 'Community event not found' },
          { status: 404 }
        )
      }
      const dateIso = row.date?.toISOString() ?? null
      entry = {
        title: row.title ?? 'Untitled Community Event',
        when: formatWhenString(dateIso, row.startTime ?? null, row.endTime ?? null),
        where: row.location ?? '',
        category: 'Community Event',
        link: row.signUpLink ?? '',
      }
    }

    let whenDisplay: string = entry.when
    let promptText: string | undefined

    if (formatWithAi && entry.when) {
      const openai = getOpenAI()
      if (openai) {
        try {
          const res = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You format date/time for a SharePoint Events listing. Return a single short line, e.g. "Monday, Feb 17, 2026, 9:00 AM – 11:00 AM" or "Self-paced, complete by March 1, 2026". No other text.',
              },
              {
                role: 'user',
                content: `Format this for a SharePoint event "When" field: ${entry.when}`,
              },
            ],
            temperature: 0.2,
            max_tokens: 80,
          })
          const content = res.choices[0]?.message?.content?.trim()
          if (content) whenDisplay = content
        } catch (e) {
          console.warn('SharePoint entry OpenAI format when failed:', e)
        }
      }
    }

    // Build a single prompt-ready line for pasting into SharePoint
    promptText = [
      `Title: ${entry.title}`,
      `When: ${whenDisplay}`,
      `Where: ${entry.where || '—'}`,
      `Category: ${entry.category}`,
      entry.link ? `Link: ${entry.link}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    return NextResponse.json({
      success: true,
      entry: {
        ...entry,
        when: whenDisplay,
      },
      whenDisplay,
      promptText,
    })
  } catch (error: any) {
    console.error('SharePoint entry render error:', error)
    return NextResponse.json(
      { success: false, error: error.message ?? 'Failed to render SharePoint entry' },
      { status: 500 }
    )
  }
}
