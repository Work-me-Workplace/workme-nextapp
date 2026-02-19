import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/next-job/target-jobs
 * List target jobs (saved reqs) for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const jobs = await prisma.targetJob.findMany({
      where: { workMeId },
      orderBy: { createdAt: 'desc' },
      include: {
        careerContacts: {
          select: { id: true, name: true, email: true, roleInProcess: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      targetJobs: jobs ?? [],
    })
  } catch (error: any) {
    console.error('❌ Get target jobs error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get target jobs', targetJobs: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/next-job/target-jobs
 * Create a target job (saved req)
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const {
      jobTitle,
      companyName,
      rawDescription,
      salaryBand,
      industryOrRole,
      sourceUrl,
      parsedRequirements,
      status,
    } = body

    const job = await prisma.targetJob.create({
      data: {
        workMeId,
        jobTitle: jobTitle ?? null,
        companyName: companyName ?? null,
        rawDescription: rawDescription ?? null,
        salaryBand: salaryBand ?? null,
        industryOrRole: industryOrRole ?? null,
        sourceUrl: sourceUrl ?? null,
        parsedRequirements: parsedRequirements ?? undefined,
        status: status ?? 'interested',
      },
      include: {
        careerContacts: true,
      },
    })

    return NextResponse.json({
      success: true,
      targetJob: job,
    })
  } catch (error: any) {
    console.error('❌ Create target job error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create target job' },
      { status: 500 },
    )
  }
}
