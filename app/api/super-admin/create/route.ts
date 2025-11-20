import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FirebaseService } from '@/lib/services/firebase'

/**
 * POST /api/super-admin/create
 * 
 * Create super admin directly (standalone, not tied to WorkMe)
 * Only works if no super admins exist yet
 * 
 * Body:
 * {
 *   firebaseId: string (optional)
 *   email: string (required)
 *   firstName?: string
 *   lastName?: string
 *   photoURL?: string
 *   idToken?: string (for verification)
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      firebaseId,
      email,
      firstName,
      lastName,
      photoURL,
      idToken,
    } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'email is required' },
        { status: 400 },
      )
    }

    // Check if any super admin exists
    const existingSuperAdmin = await prisma.superAdmin.findFirst()

    if (existingSuperAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Super admin already exists. Cannot create another.' 
        },
        { status: 403 },
      )
    }

    // If idToken provided, verify it via Firebase service
    let verifiedFirebaseId = firebaseId
    if (idToken) {
      try {
        const firebaseUser = await FirebaseService.verifyToken(idToken)
        verifiedFirebaseId = firebaseUser.uid
        
        // Verify email matches
        if (firebaseUser.email?.toLowerCase() !== email.toLowerCase()) {
          return NextResponse.json(
            { success: false, error: 'Email does not match Firebase token' },
            { status: 401 },
          )
        }
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: `Token verification failed: ${error.message}` },
          { status: 401 },
        )
      }
    }

    // Create standalone super admin
    const superAdmin = await prisma.superAdmin.create({
      data: {
        firebaseId: verifiedFirebaseId || null,
        email: email.toLowerCase().trim(),
        firstName: firstName || null,
        lastName: lastName || null,
        photoUrl: photoURL || null,
        // No workMeId - standalone super admin
      },
    })

    console.log('✅ Created standalone super admin:', superAdmin.id)

    return NextResponse.json({
      success: true,
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        firebaseId: superAdmin.firebaseId,
      },
      message: 'Super admin created successfully',
    })
  } catch (error: any) {
    console.error('❌ SuperAdminCreate error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}

