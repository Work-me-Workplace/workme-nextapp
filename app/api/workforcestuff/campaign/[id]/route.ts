/**
 * Campaign Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params
    const item = await prisma.companyCampaign.findFirst({
      where: { id, companyId },
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: item })
  } catch (error: any) {
    console.error('[Campaign Detail] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}
