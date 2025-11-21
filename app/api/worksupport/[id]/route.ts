import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[WorkSupport API] GET [id] hit: ${params.id}`)
  
  try {
    const { workMeId, companyId } = await verifyAuth(request)
    
    if (!workMeId || !companyId) {
      return NextResponse.json(
        { error: 'Not authenticated or user must belong to a company' },
        { status: 401 }
      )
    }

    const workSupport = await prisma.workSupport.findFirst({
      where: {
        id: params.id,
        companyId,
      },
      include: {
        context: true,
        outputs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!workSupport) {
      return NextResponse.json(
        { error: 'WorkSupport not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      ok: true,
      workSupport 
    })
  } catch (error) {
    console.error('[WorkSupport API] GET [id] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work support' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[WorkSupport API] PUT [id] hit: ${params.id}`)
  
  try {
    const { workMeId, companyId } = await verifyAuth(request)
    
    if (!workMeId || !companyId) {
      return NextResponse.json(
        { error: 'Not authenticated or user must belong to a company' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('[WorkSupport API] PUT payload:', body)

    // Update via server action for now
    return NextResponse.json({ 
      ok: true,
      message: 'WorkSupport update handled via server action'
    })
  } catch (error) {
    console.error('[WorkSupport API] PUT [id] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update work support' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[WorkSupport API] DELETE [id] hit: ${params.id}`)
  
  try {
    const { workMeId, companyId } = await verifyAuth(request)
    
    if (!workMeId || !companyId) {
      return NextResponse.json(
        { error: 'Not authenticated or user must belong to a company' },
        { status: 401 }
      )
    }

    // Delete via server action for now
    return NextResponse.json({ 
      ok: true,
      message: 'WorkSupport deletion handled via server action'
    })
  } catch (error) {
    console.error('[WorkSupport API] DELETE [id] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete work support' },
      { status: 500 }
    )
  }
}

