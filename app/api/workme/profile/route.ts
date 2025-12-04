import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workme/profile
 * 
 * Get current authenticated user's clean profile
 * Returns WorkProfile data only (personal identity, no employment data)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - get Firebase user data (includes photoUrl)
    const { firebaseId, photoUrl: firebasePhotoUrl } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Fetch WorkProfile (create if doesn't exist)
    let profile
    try {
      profile = await prisma.workProfile.findUnique({
        where: { userId: workMeId },
      })

      if (!profile) {
        // Auto-create profile with basic data from WorkMe + Firebase photo
        profile = await prisma.workProfile.create({
          data: {
            userId: workMeId,
            firstName: workMe.firstName || null,
            lastName: workMe.lastName || null,
            handle: `user_${workMeId.slice(0, 8)}`, // Auto-generate handle
            profileImage: firebasePhotoUrl || null, // Auto-get from Firebase
          },
        })
      } else if (!profile.profileImage && firebasePhotoUrl) {
        // Update profileImage if missing but Firebase has it
        profile = await prisma.workProfile.update({
          where: { userId: workMeId },
          data: { profileImage: firebasePhotoUrl },
        })
      }
    } catch (error: any) {
      // If table doesn't exist, return basic structure
      if (error.code === 'P2021') {
        return NextResponse.json({
          success: true,
          profile: {
            firstName: null,
            lastName: null,
            headline: null,
            currentRole: null,
            handle: `user_${workMeId.slice(0, 8)}`,
            linkedinUrl: null,
            profileImage: firebasePhotoUrl || null,
          },
        })
      }
      throw error
    }

    // 4. Always sync Firebase photoUrl if available and profile doesn't have it
    if (firebasePhotoUrl && !profile.profileImage) {
      try {
        profile = await prisma.workProfile.update({
          where: { userId: workMeId },
          data: { profileImage: firebasePhotoUrl },
        })
      } catch (err) {
        // Ignore update errors, just use what we have
      }
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error: any) {
    console.error('❌ WorkMeProfileGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get profile' },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/workme/profile
 * 
 * Update clean profile fields (personal identity only)
 * Fields: firstName, lastName, headline, currentRole, handle, linkedinUrl, profileImage
 * 
 * NOTE: Employment data belongs in WorkEntry, not here
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Auth - get Firebase user data (includes photoUrl)
    const { firebaseId, photoUrl: firebasePhotoUrl } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe Identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe
    
    // 3. Get profile data from body
    const body = await request.json()
    const {
      firstName,
      lastName,
      headline,
      currentRole,
      handle,
      linkedinUrl,
      profileImage,
    } = body

    // 4. Use Firebase photoUrl if profileImage not provided
    const finalProfileImage = profileImage !== undefined 
      ? profileImage 
      : firebasePhotoUrl || null

    // 5. Check if handle is unique (if provided and different from current)
    if (handle) {
      try {
        const existingProfile = await prisma.workProfile.findUnique({
          where: { handle },
        })
        
        if (existingProfile && existingProfile.userId !== workMeId) {
          return NextResponse.json(
            { success: false, error: 'Handle already taken' },
            { status: 400 },
          )
        }
      } catch (error: any) {
        // If table doesn't exist, skip handle check
        if (error.code !== 'P2021') {
          throw error
        }
      }
    }

    // 6. Upsert WorkProfile
    try {
      const profile = await prisma.workProfile.upsert({
        where: { userId: workMeId },
        create: {
          userId: workMeId,
          firstName: firstName !== undefined ? firstName : null,
          lastName: lastName !== undefined ? lastName : null,
          headline: headline !== undefined ? headline : null,
          currentRole: currentRole !== undefined ? currentRole : null,
          handle: handle || `user_${workMeId.slice(0, 8)}`, // Auto-generate if not provided
          linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : null,
          profileImage: finalProfileImage, // Use Firebase photo if not provided
        },
        update: {
          firstName: firstName !== undefined ? firstName : undefined,
          lastName: lastName !== undefined ? lastName : undefined,
          headline: headline !== undefined ? headline : undefined,
          currentRole: currentRole !== undefined ? currentRole : undefined,
          handle: handle !== undefined ? handle : undefined,
          linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : undefined,
          profileImage: finalProfileImage !== undefined ? finalProfileImage : undefined,
        },
      })

      console.log('✅ Updated WorkProfile:', workMeId)

      return NextResponse.json({
        success: true,
        profile,
      })
    } catch (error: any) {
      // If table doesn't exist, return success but note migration needed
      if (error.code === 'P2021') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'WorkProfile table does not exist. Please run migrations.',
            code: 'MIGRATION_REQUIRED'
          },
          { status: 500 },
        )
      }
      throw error
    }
  } catch (error: any) {
    console.error('❌ WorkMeProfileUpdate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 },
    )
  }
}
