/**
 * POST /api/x/resolve-user-id
 * 
 * Resolve X user ID from handle
 * 
 * Flow: EcosystemPerson.xHandle → X API lookup → Store xUserId
 * 
 * Body: {
 *   personId?: string  // If provided, resolve for this person
 *   handle?: string     // If provided, resolve for this handle (creates/updates person)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)

    const body = await request.json()
    const { personId, handle } = body

    if (!personId && !handle) {
      return NextResponse.json(
        { success: false, error: 'Either personId or handle is required' },
        { status: 400 }
      )
    }

    // Get X API credentials
    const bearerToken = process.env.X_BEARER_TOKEN
    if (!bearerToken) {
      return NextResponse.json(
        { success: false, error: 'X API not configured' },
        { status: 500 }
      )
    }

    let person = null
    let handleToResolve: string | null = null

    // Get person and handle
    if (personId) {
      person = await prisma.ecosystemPerson.findUnique({
        where: { id: personId },
      })

      if (!person) {
        return NextResponse.json(
          { success: false, error: 'Person not found' },
          { status: 404 }
        )
      }

      // Verify this person is in user's contacts
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

      handleToResolve = person.xHandle
    } else if (handle) {
      const cleanHandle = handle.replace(/^@/, '').trim()
      handleToResolve = cleanHandle

      // Try to find existing person by handle
      person = await prisma.ecosystemPerson.findUnique({
        where: { xHandle: cleanHandle },
      })

      // If not found, create new person
      if (!person) {
        person = await prisma.ecosystemPerson.create({
          data: {
            fullName: cleanHandle, // Temporary, will be updated
            xHandle: cleanHandle,
          },
        })

        // Create contact link
        await prisma.myEcosystemContact.create({
          data: {
            workMeId: workMe.id,
            personId: person.id,
          },
        })
      }
    }

    if (!handleToResolve) {
      return NextResponse.json(
        { success: false, error: 'No handle found to resolve' },
        { status: 400 }
      )
    }

    // If already has xUserId, return early
    if (person.xUserId) {
      return NextResponse.json({
        success: true,
        person,
        message: 'xUserId already resolved',
      })
    }

    // Call X API to resolve user ID
    try {
      const userResponse = await fetch(
        `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handleToResolve)}?user.fields=id,name`,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        console.error(`❌ X API resolve error (${userResponse.status}):`, errorText)
        
        if (userResponse.status === 403) {
          return NextResponse.json(
            { success: false, error: 'X API access level insufficient for user lookup' },
            { status: 403 }
          )
        }

        return NextResponse.json(
          { success: false, error: `X API error: ${userResponse.status}` },
          { status: userResponse.status }
        )
      }

      const userData = await userResponse.json()
      const xUserId = userData.data?.id

      if (!xUserId) {
        return NextResponse.json(
          { success: false, error: 'Could not resolve user ID from X API' },
          { status: 404 }
        )
      }

      // Update person with xUserId
      const updatedPerson = await prisma.ecosystemPerson.update({
        where: { id: person.id },
        data: {
          xUserId,
          // Also update name if we got it from API
          ...(userData.data?.name && { fullName: userData.data.name }),
        },
      })

      return NextResponse.json({
        success: true,
        person: updatedPerson,
        xUserId,
        message: 'xUserId resolved successfully',
      })
    } catch (apiError: any) {
      console.error('❌ X API resolve error:', apiError)
      return NextResponse.json(
        { success: false, error: `X API error: ${apiError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ POST /api/x/resolve-user-id error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resolve user ID' },
      { status: 500 }
    )
  }
}
