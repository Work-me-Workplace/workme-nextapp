import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/workme/hydrate
 * 
 * Hydrate WorkMe data after Firebase authentication
 * Called by AuthProvider on auth state change
 * 
 * Returns:
 * - workMe: Full WorkMe record with companyUnit and companyDivision
 */
export async function GET(request: Request) {
  try {
    console.log('[API GET /api/workme/hydrate] Starting hydration...')

    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity - just the basic WorkMe object
    const workMe = await loadWorkMe(firebaseId)

    console.log('[API GET /api/workme/hydrate] Hydration successful:', {
      workMeId: workMe.id,
      firebaseId,
    })

    // Just return the WorkMe object - no WorkEntry/WorkProfile queries
    return NextResponse.json({
      success: true,
      workMe: {
        id: workMe.id,
        firebaseId: workMe.firebaseId,
        email: workMe.email,
        firstName: workMe.firstName,
        lastName: workMe.lastName,
        photoUrl: workMe.photoUrl,
        companyUnit: workMe.companyUnit,
        companyDivision: workMe.companyDivision,
      },
    })
  } catch (error: any) {
    console.error('[API GET /api/workme/hydrate] Error:', {
      error: error.message,
      stack: error.stack,
    })

    // Return 401 for auth errors, 500 for others
    const status = error.message.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to hydrate session',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

