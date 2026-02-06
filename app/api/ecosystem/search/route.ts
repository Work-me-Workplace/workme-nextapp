/**
 * GET /api/ecosystem/search
 * 
 * Search for EcosystemPerson records
 * Supports searching by name, X handle, title, domain, beat
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)

    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')?.trim()

    if (!q || q.length === 0) {
      return NextResponse.json({
        success: true,
        persons: [],
      })
    }

    // Search across multiple fields
    const persons = await prisma.ecosystemPerson.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { xHandle: { contains: q.replace('@', ''), mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { domain: { contains: q, mode: 'insensitive' } },
          { beat: { contains: q, mode: 'insensitive' } },
          { companyName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20, // Limit results
      orderBy: [
        { influence: 'desc' }, // Prioritize high influence
        { followers: 'desc' }, // Then by followers
        { createdAt: 'desc' }, // Then by recency
      ],
    })

    return NextResponse.json({
      success: true,
      persons,
    })
  } catch (error: any) {
    console.error('[GET /api/ecosystem/search] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search' },
      { status: 500 }
    )
  }
}
