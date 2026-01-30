import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { enrichCompanyApollo } from '@/lib/external/apolloClient'

export const dynamic = 'force-dynamic'

/**
 * POST /api/employee/ingest
 * 
 * Ingest employee data from Apollo API
 * Returns raw Apollo JSON response for frontend preview
 * 
 * Body: {
 *   companyName: string, // Company name to search
 *   fullName?: string,    // Optional - filter by person name
 * }
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
    const { companyName, fullName } = body

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'companyName is required' },
        { status: 400 }
      )
    }

    // 2. Call Apollo API directly (no Firebase auth needed - just API key)
    let apolloData
    try {
      apolloData = await enrichCompanyApollo(companyName.trim())
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

    // 3. If fullName provided, try to find matching person
    let matchingPerson = null
    if (fullName) {
      const allPeople = [
        ...(apolloData.company?.employees || []),
        ...(apolloData.people || []),
      ]

      const nameParts = fullName.toLowerCase().split(/\s+/)
      matchingPerson = allPeople.find((person) => {
        const personName = (person.name || `${person.first_name || ''} ${person.last_name || ''}`).toLowerCase()
        return nameParts.every((part: string) => personName.includes(part))
      })
    }

    // 4. Return raw Apollo response + matching person if found
    return NextResponse.json({
      success: true,
      rawApolloResponse: apolloData, // Full Apollo JSON
      matchingPerson: matchingPerson || null,
      company: apolloData.company || null,
      people: apolloData.people || [],
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
