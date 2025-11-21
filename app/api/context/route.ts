import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWorkMeId } from '@/lib/getWorkMeId.server'
import { getWorkContext, getWorkContexts } from '@/lib/actions/work-context'

/**
 * GET /api/context
 * List all WorkContexts for the authenticated user
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

    const result = await getWorkContexts()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      workContexts: result.workContexts || [],
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

