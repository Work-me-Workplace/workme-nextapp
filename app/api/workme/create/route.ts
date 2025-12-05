import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'

/**
 * POST /api/workme/create
 * 
 * Find or create WorkMe user from Firebase auth
 * Uses verifyAuth for token verification
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify Firebase auth (NextRequest extends Request, so this works)
    const { firebaseId, email, displayName, photoUrl } = await verifyAuth(request as Request)

    // 2. Parse name from displayName
    const nameParts = displayName?.split(' ') || []
    const firstName = nameParts[0] || null
    const lastName = nameParts.slice(1).join(' ') || null

    // 3. Look up WorkMe by firebaseId
    let workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
    })

    let isNewUser = false

    if (!workMe) {
      // Also check by email in case firebaseId wasn't set
      workMe = await prisma.workMe.findUnique({
        where: { email: email?.toLowerCase().trim() || '' },
      })

      if (workMe) {
        // Update existing record with firebaseId
        workMe = await prisma.workMe.update({
          where: { id: workMe.id },
          data: {
            firebaseId,
          },
        })
        console.log('✅ Updated existing WorkMe with firebaseId:', workMe.id)
      } else {
        // Create new WorkMe (identity only - no profile fields)
        workMe = await prisma.workMe.create({
          data: {
            firebaseId,
            email: email?.toLowerCase().trim() || '',
          },
        })
        isNewUser = true
        console.log('✅ Created new WorkMe:', workMe.id)
      }
    } else {
      console.log('✅ Found existing WorkMe:', workMe.id)
    }

    // 4. If this is the first user (Adam - the first man), make them super admin
    if (isNewUser) {
      const existingSuperAdmin = await prisma.superAdmin.findFirst()
      
      if (!existingSuperAdmin) {
        // This is the first user - create standalone super admin
        // photoUrl comes from Firebase, not from WorkProfile
        const superAdmin = await prisma.superAdmin.create({
          data: {
            firebaseId: workMe.firebaseId,
            email: workMe.email,
            firstName: null, // Will be set separately if needed
            lastName: null,
            photoUrl: photoUrl || null, // From Firebase
            workMeId: workMe.id, // Link to WorkMe (optional, may migrate away)
          },
        })
        console.log('✅ Created first super admin (Adam):', superAdmin.id)
        
        return NextResponse.json({
          success: true,
          workMe,
          superAdmin: {
            id: superAdmin.id,
            email: superAdmin.email,
          },
          isSuperAdmin: true,
          message: 'First user created and granted super admin status',
        })
      }
    }

    return NextResponse.json({
      success: true,
      workMe,
    })
  } catch (error: any) {
    console.error('❌ WorkMeCreate error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create WorkMe',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
