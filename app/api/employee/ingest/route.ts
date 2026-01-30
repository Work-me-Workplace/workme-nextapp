import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { enrichPerson } from '@/lib/external/apolloClient'

export const dynamic = 'force-dynamic'

/**
 * POST /api/employee/ingest
 * 
 * Ingest employee data from Apollo API
 * Returns raw Apollo JSON response for frontend preview
 * 
 * Body: {
 *   email?: string,        // Email address (required if no linkedinUrl)
 *   linkedinUrl?: string,  // LinkedIn URL (required if no email)
 * }
 * 
 * NOTE: Apollo requires email OR linkedinUrl - cannot search by name alone
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth (Firebase token via axios interceptor)
    await verifyAuth(request as Request)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { email, linkedinUrl } = body

    // Validate: must have email OR linkedinUrl
    if (!email && !linkedinUrl) {
      return NextResponse.json(
        { success: false, error: 'Either email or linkedinUrl is required' },
        { status: 400 }
      )
    }

    if (email && !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // 2. Call Apollo API directly (no Firebase auth needed - just API key)
    let apolloData
    try {
      apolloData = await enrichPerson({ email, linkedinUrl })
    } catch (error: any) {
      console.error('❌ Apollo API error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: `Apollo API failed: ${error.message}`,
          details: error.message
        },
        { status: 500 }
      )
    }

    // 3. Return raw Apollo response
    return NextResponse.json({
      success: true,
      rawApolloResponse: apolloData, // Full Apollo JSON
      person: apolloData.person || null,
      message: 'Apollo data ingested successfully. Review and save to persist.',
    })
  } catch (error: any) {
    console.error('❌ POST /api/employee/ingest error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to ingest employee data from Apollo',
      },
      { status: 500 }
    )
  }
}
