/**
 * POST /api/ecosystem/enrich-and-save
 * 
 * Apollo enrichment flow for ecosystem contacts
 * 
 * Flow: Apollo enrichment → Extract xHandle → Save to EcosystemPerson → Create MyEcosystemContact
 * 
 * Body: {
 *   email?: string
 *   linkedinUrl?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { enrichPerson, parseApolloPersonResponse } from '@/lib/external/apolloClient'

export const dynamic = 'force-dynamic'

/**
 * Extract X handle from Apollo person data
 * Apollo may return twitter_url or twitter_handle field
 */
function extractXHandle(apolloPerson: any): string | null {
  // Try twitter_handle first (if it exists)
  if (apolloPerson.twitter_handle) {
    return apolloPerson.twitter_handle.replace(/^@/, '').trim()
  }
  
  // Extract from twitter_url
  if (apolloPerson.twitter_url) {
    const url = apolloPerson.twitter_url.trim()
    // Match patterns like:
    // - https://twitter.com/navalnews
    // - https://x.com/navalnews
    // - twitter.com/navalnews
    const match = url.match(/(?:twitter\.com|x\.com)\/([^/?]+)/i)
    if (match && match[1]) {
      return match[1].replace(/^@/, '').trim()
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)

    const body = await request.json()
    const { email, linkedinUrl } = body

    if (!email && !linkedinUrl) {
      return NextResponse.json(
        { success: false, error: 'Either email or linkedinUrl is required' },
        { status: 400 }
      )
    }

    // Step 1: Apollo enrichment
    let apolloData
    try {
      apolloData = await enrichPerson({ email, linkedinUrl })
    } catch (error: any) {
      console.error('❌ Apollo enrichment error:', error)
      return NextResponse.json(
        { success: false, error: `Apollo enrichment failed: ${error.message}` },
        { status: 500 }
      )
    }

    if (!apolloData.person) {
      return NextResponse.json(
        { success: false, error: 'No person data found in Apollo response' },
        { status: 404 }
      )
    }

    // Step 2: Parse Apollo data
    const parsed = parseApolloPersonResponse(apolloData)
    
    // Step 3: Extract xHandle from Apollo
    const xHandle = extractXHandle(apolloData.person)
    
    if (!parsed.fullName) {
      return NextResponse.json(
        { success: false, error: 'Could not extract full name from Apollo data' },
        { status: 400 }
      )
    }

    // Step 4: Normalize xHandle (remove @ if present)
    const normalizedHandle = xHandle ? xHandle.replace(/^@/, '') : null

    // Step 5: Upsert EcosystemPerson
    let person = null
    
    // Try to find by xHandle first (if we have it)
    if (normalizedHandle) {
      person = await prisma.ecosystemPerson.findUnique({
        where: { xHandle: normalizedHandle },
      })
    }
    
    // Try by email if we have it
    if (!person && parsed.email) {
      // Note: EcosystemPerson doesn't have email field, so we'd need to search differently
      // For now, create new if not found by handle
    }

    if (person) {
      // Update existing person with Apollo data
      person = await prisma.ecosystemPerson.update({
        where: { id: person.id },
        data: {
          fullName: parsed.fullName.trim(),
          title: parsed.title || undefined,
          ...(normalizedHandle && { xHandle: normalizedHandle }),
          profileImage: parsed.photoUrl || undefined,
          bio: parsed.bio || undefined,
          companyName: parsed.companyName || undefined,
        },
      })
    } else {
      // Create new person
      person = await prisma.ecosystemPerson.create({
        data: {
          fullName: parsed.fullName.trim(),
          title: parsed.title || undefined,
          xHandle: normalizedHandle || undefined,
          profileImage: parsed.photoUrl || undefined,
          bio: parsed.bio || undefined,
          companyName: parsed.companyName || undefined,
        },
      })
    }

    // Step 6: Create or find MyEcosystemContact link
    const contact = await prisma.myEcosystemContact.upsert({
      where: {
        workMeId_personId: {
          workMeId: workMe.id,
          personId: person.id,
        },
      },
      update: {}, // Don't overwrite existing relationship data
      create: {
        workMeId: workMe.id,
        personId: person.id,
        followForXFeed: false, // User can enable later
      },
      include: {
        person: true,
      },
    })

    return NextResponse.json({
      success: true,
      person,
      contact,
      apolloData: {
        hasXHandle: !!xHandle,
        xHandle: normalizedHandle,
        needsXUserIdResolution: !!normalizedHandle && !person.xUserId,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/ecosystem/enrich-and-save error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enrich and save person' },
      { status: 500 }
    )
  }
}
