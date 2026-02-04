/**
 * WorkStuff Career API
 * 
 * GET /api/workstuff/career - List all careers
 * POST /api/workstuff/career - Create new career
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { createCompanyXWithIngest } from '@/lib/services/companyx-mapper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // Load WorkMe identity to get companyId (source of truth - secure, verified)
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set on your account. Please contact support.' },
        { status: 400 }
      )
    }

    const careers = await prisma.companyCareer.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      careers,
    })
  } catch (error: any) {
    console.error('[WorkStuff Career GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch careers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // Load WorkMe identity to get companyId (source of truth - secure, verified)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set on your account. Please contact support.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { data, rawText } = body
    
    // Use authenticated user's companyId (ignore any companyId in body for security)

    // If rawText provided, use ingest flow
    if (rawText) {
      const result = await createCompanyXWithIngest(
        prisma,
        'career',
        rawText,
        workMeId,
        companyId
      )

      return NextResponse.json({
        success: true,
        id: result.id,
        career: result.record,
      })
    }

    // Otherwise create with provided data
    const career = await prisma.companyCareer.create({
      data: {
        ...data,
        companyId,
        workMeId: workMeId,
      },
    })

    return NextResponse.json({
      success: true,
      id: career.id,
      career,
    })
  } catch (error: any) {
    console.error('[WorkStuff Career POST] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create career' },
      { status: 500 }
    )
  }
}
