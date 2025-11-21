import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

console.log('[WorkSupport API] route.ts loaded')

export async function GET(request: NextRequest) {
  console.log('[WorkSupport API] GET hit')
  
  try {
    const { workMeId, companyId } = await verifyAuth(request)
    
    if (!workMeId || !companyId) {
      return NextResponse.json(
        { error: 'Not authenticated or user must belong to a company' },
        { status: 401 }
      )
    }

    // List all WorkSupport records for the user's company
    const workSupports = await prisma.workSupport.findMany({
      where: {
        companyId,
      },
      include: {
        context: true,
        outputs: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`[WorkSupport API] Found ${workSupports.length} work supports`)

    return NextResponse.json({ 
      ok: true,
      workSupports 
    })
  } catch (error) {
    console.error('[WorkSupport API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work supports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('[WorkSupport API] POST hit')
  
  try {
    const { workMeId, companyId } = await verifyAuth(request)
    
    if (!workMeId || !companyId) {
      return NextResponse.json(
        { error: 'Not authenticated or user must belong to a company' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('[WorkSupport API] POST payload:', body)

    // Create WorkSupport via server action for now
    // Full implementation would go here
    return NextResponse.json({ 
      ok: true,
      message: 'WorkSupport creation handled via server action'
    })
  } catch (error) {
    console.error('[WorkSupport API] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to create work support' },
      { status: 500 }
    )
  }
}

