/**
 * GET /api/utils/news-artifact/[id]
 * 
 * Get a CompanyNewsArtifact by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
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

    // Get artifact
    const artifact = await prisma.companyNewsArtifact.findUnique({
      where: { id },
    })

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'News artifact not found' },
        { status: 404 }
      )
    }

    // Verify it belongs to the user's company
    if (artifact.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: artifact.id,
        headline: artifact.headline,
        rawText: artifact.rawText,
        sourceUrl: artifact.sourceUrl,
        sourceName: artifact.sourceName,
        artifactType: artifact.artifactType,
        createdAt: artifact.createdAt,
      },
    })
  } catch (error: any) {
    console.error('❌ GET /api/utils/news-artifact/[id] error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get news artifact' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/utils/news-artifact/[id]
 * 
 * Delete a CompanyNewsArtifact by ID
 */
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

    // Get artifact to verify ownership
    const artifact = await prisma.companyNewsArtifact.findUnique({
      where: { id },
    })

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'News artifact not found' },
        { status: 404 }
      )
    }

    // Verify it belongs to the user's company
    if (artifact.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the artifact
    // Note: Prisma will handle cascade deletes based on schema relations
    await prisma.companyNewsArtifact.delete({
      where: { id },
    })

    console.log('[API DELETE /api/utils/news-artifact/[id]] SUCCESS', {
      artifactId: id,
      workMeId,
      companyId,
    })

    return NextResponse.json({
      success: true,
      message: 'News artifact deleted successfully',
    })
  } catch (error: any) {
    console.error('❌ DELETE /api/utils/news-artifact/[id] error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete news artifact' },
      { status: 500 }
    )
  }
}





