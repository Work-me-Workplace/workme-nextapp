/**
 * API Route: GET /api/comms-outputs/list
 * 
 * Returns all CommsOutputs for the authenticated user's companyUnit
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const { firebaseId } = await verifyAuth(request)

    // 2. Get WorkMe to get companyUnit
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
        companyUnit: true,
      },
    })

    if (!workMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe identity not found' },
        { status: 404 }
      )
    }

    // 3. Fetch CommsOutputs for this user's companyUnit
    const commsOutputs = await prisma.commsOutput.findMany({
      where: {
        companyUnit: workMe.companyUnit || undefined,
        originatorId: workMe.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        wordCount: true,
        dateSent: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      outputs: commsOutputs,
    })
  } catch (error: any) {
    console.error('[API] Failed to list comms outputs:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch comms outputs' },
      { status: 500 }
    )
  }
}




