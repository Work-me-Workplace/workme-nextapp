import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FieldMapperService } from '@/lib/services/fieldMapper'

/**
 * GET /api/workme/profile
 * 
 * Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const workMeId = request.headers.get('x-workme-id') || 
                     new URL(request.url).searchParams.get('workMeId')

    if (!workMeId) {
      return NextResponse.json(
        { success: false, error: 'workMeId is required' },
        { status: 400 },
      )
    }

    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: {
        id: true,
        firebaseId: true,
        email: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        jobTitle: true,
        specialty: true,
        industry: true,
        jobRole: true,
        salaryRange: true,
        companyUnit: true,
        companyDivision: true,
        createdAt: true,
      },
    })

    if (!workMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      workMe,
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
 * Update basic profile fields
 * Uses verifyAuth + loadWorkMe for identity
 * 
 * Fields: firstName, lastName, jobTitle, jobRole, specialty?, industry?, salaryRange?, photoUrl?
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Auth (NextRequest extends Request, so this works)
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe Identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe
    
    // 3. Get profile data from body
    const body = await request.json()
    const {
      firstName,
      lastName,
      jobTitle,
      jobRole, // Maps to jobRole enum
      specialty,
      industry,
      salaryRange, // Maps to salaryRange enum
      photoUrl,
    } = body

    // 4. Update profile fields (only basic profile, no companyUnit here)
    const updated = await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        jobTitle: jobTitle !== undefined ? jobTitle : undefined,
        jobRole: jobRole !== undefined ? jobRole : undefined,
        specialty: specialty !== undefined ? specialty : undefined,
        industry: industry !== undefined ? industry : undefined,
        salaryRange: salaryRange !== undefined ? salaryRange : undefined,
        photoUrl: photoUrl !== undefined ? photoUrl : undefined,
      },
      select: {
        id: true,
        firebaseId: true,
        email: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        jobTitle: true,
        specialty: true,
        industry: true,
        jobRole: true,
        salaryRange: true,
        companyUnit: true,
        companyDivision: true,
        createdAt: true,
      },
    })

    console.log('✅ Updated WorkMe profile:', workMeId)

    return NextResponse.json({
      success: true,
      workMe: updated,
    })
  } catch (error: any) {
    console.error('❌ WorkMeProfileUpdate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 },
    )
  }
}

