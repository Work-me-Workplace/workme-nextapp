/**
 * GET /api/ecosystem/myContacts
 * 
 * Get all EcosystemPerson contacts for the current user
 * Returns contacts with full person data
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)

    // Get all contacts for this user with person data
    const contacts = await prisma.myEcosystemContact.findMany({
      where: { workMeId: workMe.id },
      include: {
        person: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      contacts,
    })
  } catch (error: any) {
    console.error('❌ GET /api/ecosystem/myContacts error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load contacts' },
      { status: 500 }
    )
  }
}

