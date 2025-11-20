import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FirebaseService } from '@/lib/services/firebase'

/**
 * POST /api/workme/create
 * 
 * Find or create WorkMe user from Firebase auth
 * Uses Firebase service for token verification
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
      idToken, // Optional: for token verification
    } = body

    if (!firebaseId) {
      return NextResponse.json(
        { success: false, error: 'firebaseId is required' },
        { status: 400 },
      )
    }

    // If idToken provided, verify it via Firebase service
    if (idToken) {
      try {
        const firebaseUser = await FirebaseService.verifyToken(idToken)
        // Verify firebaseId matches token
        if (firebaseUser.uid !== firebaseId) {
          return NextResponse.json(
            { success: false, error: 'firebaseId does not match token' },
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

    // Find or create WorkMe
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
            firstName: firstName || workMe.firstName,
            lastName: lastName || workMe.lastName,
            photoUrl: photoURL || workMe.photoUrl,
          },
        })
        console.log('✅ Updated existing WorkMe with firebaseId:', workMe.id)
      } else {
        // Create new WorkMe
        workMe = await prisma.workMe.create({
          data: {
            firebaseId,
            email: email?.toLowerCase().trim() || '',
            firstName: firstName || null,
            lastName: lastName || null,
            photoUrl: photoURL || null,
          },
        })
        isNewUser = true
        console.log('✅ Created new WorkMe:', workMe.id)
      }
    } else {
      console.log('✅ Found existing WorkMe:', workMe.id)
    }

    // If this is the first user (Adam - the first man), make them super admin
    if (isNewUser) {
      const existingSuperAdmin = await prisma.superAdmin.findFirst()
      
      if (!existingSuperAdmin) {
        // This is the first user - make them super admin
        const superAdmin = await prisma.superAdmin.create({
          data: {
            workMeId: workMe.id,
          },
        })
        console.log('✅ Created first super admin (Adam):', superAdmin.id)
        
        return NextResponse.json({
          success: true,
          workMe,
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
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
