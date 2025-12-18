import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// GET /api/workforce/enduring/email-digest/items - List all items
export async function GET(req: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'User must set a companyId' }, { status: 400 })
    }

    const items = await prisma.emailDigestItem.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch items' }, { status: 500 })
  }
}

// POST /api/workforce/enduring/email-digest/items - Create new item
export async function POST(req: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json({ success: false, error: 'Not authenticated or user must set a companyId' }, { status: 400 })
    }

    const body = await req.json()
    const { sourceType, sourceId, formattedContent, status } = body

    console.log('📥 Saving digest item:', { 
      sourceType, 
      sourceId, 
      status,
      formattedContent: formattedContent ? {
        keys: Object.keys(formattedContent),
        hasTitle: !!formattedContent.title,
        hasContent: !!formattedContent.content,
      } : 'MISSING'
    })

    if (!formattedContent) {
      return NextResponse.json({ success: false, error: 'formattedContent is required' }, { status: 400 })
    }

    const item = await prisma.emailDigestItem.create({
      data: {
        sourceType: sourceType || null,
        sourceId: sourceId || null,
        formattedContent,
        status: status || 'DRAFT',
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    console.log('✅ Item saved:', item.id)

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('❌ Error creating item:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create item',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
