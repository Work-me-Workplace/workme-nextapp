import { NextResponse } from 'next/server'

/**
 * POST /api/super-admin/create
 * 
 * DEPRECATED: SuperAdmin model has been removed from schema
 */
export async function POST(request: Request) {
  return NextResponse.json(
    { 
      success: false, 
      error: 'SuperAdmin model has been removed. This endpoint is deprecated.' 
    },
    { status: 410 } // 410 Gone
  )
}
