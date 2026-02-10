/**
 * PUT /api/article-category/[id]
 * Update an article category
 * 
 * DELETE /api/article-category/[id]
 * Delete an article category
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get category to verify ownership
    const category = await prisma.articleCategory.findUnique({
      where: { id },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Verify it belongs to the user's company
    if (category.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, color } = body

    // If name is being changed, check for duplicates
    if (name && name.trim() !== category.name) {
      const existing = await prisma.articleCategory.findFirst({
        where: {
          companyId,
          name: name.trim(),
          id: { not: id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Category with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update category
    const updated = await prisma.articleCategory.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : category.name,
        description: description !== undefined ? (description?.trim() || null) : category.description,
        color: color !== undefined ? (color?.trim() || null) : category.color,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        color: updated.color,
        updatedAt: updated.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('❌ PUT /api/article-category/[id] error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get category to verify ownership
    const category = await prisma.articleCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Verify it belongs to the user's company
    if (category.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if category has articles
    if (category._count.articles > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete category. It has ${category._count.articles} article(s) assigned. Please reassign or remove articles first.` 
        },
        { status: 400 }
      )
    }

    // Delete category
    await prisma.articleCategory.delete({
      where: { id },
    })

    console.log('[API DELETE /api/article-category/[id]] SUCCESS', {
      categoryId: id,
      companyId,
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error: any) {
    console.error('❌ DELETE /api/article-category/[id] error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete category' },
      { status: 500 }
    )
  }
}
