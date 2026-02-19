import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/next-job/preferences
 * Get "what I want" (next role preference) for current user. One per user.
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const pref = await prisma.nextRolePreference.findUnique({
      where: { workMeId },
    })

    return NextResponse.json({
      success: true,
      preference: pref ?? null,
    })
  } catch (error: any) {
    console.error('❌ Get next role preference error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get preference', preference: null },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/next-job/preferences
 * Upsert "what I want". Body: industry?, companyType?, note?
 */
export async function PATCH(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { industry, companyType, note } = body

    const pref = await prisma.nextRolePreference.upsert({
      where: { workMeId },
      create: {
        workMeId,
        industry: industry ?? null,
        companyType: companyType ?? null,
        note: note ?? null,
      },
      update: {
        industry: industry !== undefined ? (industry ?? null) : undefined,
        companyType: companyType !== undefined ? (companyType ?? null) : undefined,
        note: note !== undefined ? (note ?? null) : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      preference: pref,
    })
  } catch (error: any) {
    console.error('❌ Update next role preference error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save preference' },
      { status: 500 },
    )
  }
}
