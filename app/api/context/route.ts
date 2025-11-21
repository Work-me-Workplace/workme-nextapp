import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWorkMeId } from '@/lib/getWorkMeId.server'

/**
 * GET /api/context
 * List all WorkContexts for the authenticated user
 * Uses new factory pattern for enrichment
 */
export async function GET(request: Request) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      )
    }

    // Get all WorkContexts for user
    const workContexts = await prisma.workContext.findMany({
      where: { createdByWorkMeId: workMeId },
      orderBy: { createdAt: 'desc' },
      include: {
        outputs: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    // Enrich with typed data using factory
    const { getTypedContext } = await import('@/lib/server/context-factory')
    
    const enrichedContexts = await Promise.all(
      workContexts.map(async (ctx) => {
        const typed = await getTypedContext(ctx.type, ctx.typeRefId)
        return {
          ...ctx,
          typedData: typed,
          title: typed?.title ?? '',
        }
      })
    )

    return NextResponse.json({
      success: true,
      workContexts: enrichedContexts,
    })
  } catch (error: any) {
    console.error('❌ GET /api/context error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch contexts',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

