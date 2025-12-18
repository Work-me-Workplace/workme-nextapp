import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/team
 * Get all team members for the authenticated user
 */
export async function GET(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // Get or create MyTeamContainer
    let container = await prisma.myTeamContainer.findUnique({
      where: { workMeId },
      include: {
        directors: true,
        deputies: true,
        peers: true,
        subordinates: true,
      },
    })

    if (!container) {
      // Create container if it doesn't exist
      container = await prisma.myTeamContainer.create({
        data: {
          workMeId,
        },
        include: {
          directors: true,
          deputies: true,
          peers: true,
          subordinates: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        directors: container.directors,
        deputies: container.deputies,
        peers: container.peers,
        subordinates: container.subordinates,
      },
    })
  } catch (error: any) {
    console.error('❌ GET /api/team error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch team members',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/team
 * Create a new team member
 * 
 * Body: { type: 'Director' | 'Deputy' | 'Peer' | 'Subordinate', data: {...} }
 */
export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { type, data } = body

    if (!type || !['Director', 'Deputy', 'Peer', 'Subordinate'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid team member type' },
        { status: 400 }
      )
    }

    // Get or create container
    let container = await prisma.myTeamContainer.findUnique({
      where: { workMeId },
    })

    if (!container) {
      container = await prisma.myTeamContainer.create({
        data: { workMeId },
      })
    }

    // Create the appropriate profile
    let created
    if (type === 'Director') {
      created = await prisma.myTeamDirectorProfile.create({
        data: {
          containerId: container.id,
          ...data,
        },
      })
    } else if (type === 'Deputy') {
      created = await prisma.myTeamDeputyProfile.create({
        data: {
          containerId: container.id,
          ...data,
        },
      })
    } else if (type === 'Peer') {
      created = await prisma.myTeamPeerProfile.create({
        data: {
          containerId: container.id,
          ...data,
        },
      })
    } else {
      created = await prisma.myTeamSubordinateProfile.create({
        data: {
          containerId: container.id,
          ...data,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: created,
    })
  } catch (error: any) {
    console.error('❌ POST /api/team error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create team member',
      },
      { status: 500 }
    )
  }
}







