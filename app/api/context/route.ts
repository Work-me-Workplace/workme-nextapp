import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'

// Force dynamic rendering (API routes are dynamic by default, but explicit for safety)
export const dynamic = 'force-dynamic'

/**
 * GET /api/context
 * List all WorkContexts for the authenticated user
 * Uses new factory pattern for enrichment
 */
export async function GET(request: Request) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyId } = await verifyAuth(request)

    console.log('[API GET /api/context]', {
      workMeId,
      companyId,
    })

    // Get all WorkContexts for user's company (multi-tenant scoping)
    const workContexts = await prisma.workContext.findMany({
      where: { 
        companyId, // Multi-tenant: filter by company
      },
      orderBy: { createdAt: 'desc' },
      include: {
        outputs: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    // Enrich with typed data using factory (filtered by companyId)
    const { getTypedContext } = await import('@/lib/server/context-factory')
    
    const enrichedContexts = await Promise.all(
      workContexts.map(async (ctx) => {
        const typed = await getTypedContext(ctx.type, ctx.typeRefId, companyId)
        return {
          ...ctx,
          typedData: typed,
          title: typed?.title ?? '',
        }
      })
    )

    console.log('[API GET /api/context] SUCCESS', {
      workMeId,
      companyId,
      count: enrichedContexts.length,
      contexts: enrichedContexts.map(c => ({
        routerId: c.id,
        type: c.type,
        title: c.title,
      })),
    })

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

