/**
 * POST /api/article-category/create
 * 
 * Create a new article category
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Check if category with same name already exists for this company
    const existing = await prisma.articleCategory.findFirst({
      where: {
        companyId,
        name: name.trim(),
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    // Create category
    const category = await prisma.articleCategory.create({
      data: {
        companyId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color?.trim() || null,
      },
    })

    console.log('[API POST /api/article-category/create] SUCCESS', {
      categoryId: category.id,
      name: category.name,
      companyId,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        createdAt: category.createdAt,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/article-category/create error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create category' },
      { status: 500 }
    )
  }
}
