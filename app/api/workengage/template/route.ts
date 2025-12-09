import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import * as workEngage from '@/lib/workengage'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workengage/template
 * 
 * Get all templates
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    await verifyAuth(request as Request)

    // 2. Get templates
    const templates = await workEngage.getTemplates()

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error: any) {
    console.error('[workengage/template] ERROR:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get templates' 
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/workengage/template
 * 
 * Create a new template
 * 
 * Body: {
 *   name: string,
 *   body: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    await verifyAuth(request as Request)

    const requestBody = await request.json()
    const { name, body } = requestBody

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'name is required' 
        },
        { status: 400 },
      )
    }

    if (!body || body.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'body is required' 
        },
        { status: 400 },
      )
    }

    // 2. Create template
    const template = await workEngage.createTemplate({ name, body })

    return NextResponse.json({
      success: true,
      data: template,
    })
  } catch (error: any) {
    console.error('[workengage/template] ERROR:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create template' 
      },
      { status: 500 },
    )
  }
}

