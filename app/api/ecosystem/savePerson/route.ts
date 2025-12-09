/**
 * POST /api/ecosystem/savePerson
 * 
 * Save an EcosystemPerson and create MyEcosystemContact link
 * 
 * Body: {
 *   fullName: string
 *   xHandle?: string
 *   xUserId?: string
 *   profileImage?: string
 *   bio?: string
 *   followers?: number
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
    const { fullName, xHandle, xUserId, profileImage, bio, followers } = body

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'fullName is required' },
        { status: 400 }
      )
    }

    // Normalize xHandle (remove @ if present)
    const normalizedHandle = xHandle?.replace(/^@/, '') || null

    // Upsert EcosystemPerson
    // Use xHandle or xUserId as unique identifier
    const person = await prisma.ecosystemPerson.upsert({
      where: {
        ...(normalizedHandle ? { xHandle: normalizedHandle } : { xUserId: xUserId || '' }),
      },
      update: {
        fullName: fullName.trim(),
        xHandle: normalizedHandle,
        xUserId: xUserId || undefined,
        profileImage: profileImage || undefined,
        bio: bio || undefined,
        followers: followers || undefined,
      },
      create: {
        fullName: fullName.trim(),
        xHandle: normalizedHandle,
        xUserId: xUserId || undefined,
        profileImage: profileImage || undefined,
        bio: bio || undefined,
        followers: followers || undefined,
      },
    })

    // Create or find MyEcosystemContact link
    const contact = await prisma.myEcosystemContact.upsert({
      where: {
        workMeId_personId: {
          workMeId: workMe.id,
          personId: person.id,
        },
      },
      update: {},
      create: {
        workMeId: workMe.id,
        personId: person.id,
      },
    })

    return NextResponse.json({
      success: true,
      personId: person.id,
      needsHydration: !person.lastHydratedAt, // Needs hydration if never hydrated
      person,
    })
  } catch (error: any) {
    console.error('❌ POST /api/ecosystem/savePerson error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save person' },
      { status: 500 }
    )
  }
}

