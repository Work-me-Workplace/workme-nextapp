import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      include: {
        company: true,
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

    // Update profile fields
    const workMe = await prisma.workMe.update({
      where: { id },
      data: {
        jobTitle: profileData.jobTitle ?? undefined,
        specialty: profileData.specialty ?? undefined,
        industry: profileData.industry ?? undefined,
        jobRole: profileData.jobRole ?? undefined,
        annualSalary: profileData.annualSalary ?? undefined,
        salaryRange: profileData.salaryRange ?? undefined,
        workLocation: profileData.workLocation ?? undefined,
        city: profileData.city ?? undefined,
        state: profileData.state ?? undefined,
      },
      include: {
        company: true,
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

