/**
 * WorkStuff Training API
 * 
 * GET /api/workstuff/training - List all trainings
 * POST /api/workstuff/training - Create new training
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

    const trainings = await prisma.companyTraining.findMany({
      where: { companyId },
      orderBy: { trainingDate: 'asc' },
    })

    return NextResponse.json({
      success: true,
      trainings,
    })
  } catch (error: any) {
    console.error('[WorkStuff Training GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch trainings' },
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
        'training',
        rawText,
        workMeId,
        companyId
      )

      return NextResponse.json({
        success: true,
        id: result.id,
        training: result.record,
      })
    }

    // Otherwise create with provided data
    const training = await prisma.companyTraining.create({
      data: {
        ...data,
        companyId,
        workMeId: workMeId,
      },
    })

    return NextResponse.json({
      success: true,
      id: training.id,
      training,
    })
  } catch (error: any) {
    console.error('[WorkStuff Training POST] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create training' },
      { status: 500 }
    )
  }
}
