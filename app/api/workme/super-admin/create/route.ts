import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/workme/super-admin/create
 * 
 * Create super admin for first user (Adam - the first man)
 * Only works if no super admins exist yet
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workMeId } = body

    if (!workMeId) {
      return NextResponse.json(
        { success: false, error: 'workMeId is required' },
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

    // Verify WorkMe exists
    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
    })

    if (!workMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe not found' },
        { status: 404 },
      )
    }

    // Create standalone super admin (first user - Adam)
    // WorkProfile no longer has firstName/lastName/photoUrl - those come from Firebase
    const superAdmin = await prisma.superAdmin.create({
      data: {
        firebaseId: workMe.firebaseId,
        email: workMe.email,
        firstName: null, // Will be set separately if needed
        lastName: null,
        photoUrl: null, // Will be set from Firebase if needed
        workMeId, // Optional link (may migrate away)
      },
      include: {
        workMe: true,
      },
    })

    console.log('✅ Created first super admin (Adam):', superAdmin.id)

    return NextResponse.json({
      success: true,
      superAdmin,
      message: 'First super admin created successfully',
    })
  } catch (error: any) {
    console.error('❌ SuperAdminCreate error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}

