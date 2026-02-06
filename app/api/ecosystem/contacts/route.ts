/**
 * POST /api/ecosystem/contacts
 * 
 * Create or update a MyEcosystemContact relationship
 * Links a WorkMe user to an EcosystemPerson with relationship metadata
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
    const { 
      personId, 
      stance, 
      relationshipType, 
      followForXFeed,
      notes,
      tags,
      priority 
    } = body

    if (!personId) {
      return NextResponse.json(
        { success: false, error: 'personId is required' },
        { status: 400 }
      )
    }

    // Verify person exists
    const person = await prisma.ecosystemPerson.findUnique({
      where: { id: personId },
    })

    if (!person) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      )
    }

    // Create or update contact relationship
    const contact = await prisma.myEcosystemContact.upsert({
      where: {
        workMeId_personId: {
          workMeId: workMe.id,
          personId,
        },
      },
      update: {
        ...(stance !== undefined && { stance }),
        ...(relationshipType !== undefined && { relationshipType }),
        ...(followForXFeed !== undefined && { followForXFeed }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(priority !== undefined && { priority }),
      },
      create: {
        workMeId: workMe.id,
        personId,
        stance: stance || null,
        relationshipType: relationshipType || null,
        followForXFeed: followForXFeed || false,
        notes: notes || null,
        tags: tags || [],
        priority: priority || null,
      },
      include: {
        person: true,
      },
    })

    return NextResponse.json({
      success: true,
      contact,
    })
  } catch (error: any) {
    console.error('[POST /api/ecosystem/contacts] Error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Contact relationship already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create/update contact' },
      { status: 500 }
    )
  }
}
