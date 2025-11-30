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
 * Upsert the rest of the user profile
 * Requires workMeId in request body or header
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { workMeId, ...profileData } = body

    // Get workMeId from body or header
    const id = workMeId || request.headers.get('x-workme-id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'workMeId is required' },
        { status: 400 },
      )
    }

    // Verify WorkMe exists
    const existing = await prisma.workMe.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'WorkMe not found' },
        { status: 404 },
      )
    }

    // Map and validate profile data using FieldMapperService
    const mappedData = FieldMapperService.mapWorkMeProfile(profileData)

    // Update profile fields
    const workMe = await prisma.workMe.update({
      where: { id },
      data: mappedData,
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

    return NextResponse.json({
      success: true,
      workMe,
    })
  } catch (error: any) {
    console.error('❌ WorkMeProfileUpdate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 },
    )
  }
}

