import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'
import { getSections } from '@/lib/workstuff/redis'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Save Training model to Prisma
 * 
 * Upserts CompanyTraining model
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)

    if (!auth.workMeId || !auth.companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { workMeId, companyId } = auth
    const { sectionId, training } = await request.json()

    if (!sectionId || !training || !training.title) {
      return NextResponse.json(
        { success: false, error: 'sectionId and training (with title) are required' },
        { status: 400 }
      )
    }

    // Get section for reference
    const sections = await getSections(workMeId)
    const section = sections.find((s: any) => s.id === sectionId)

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      )
    }

    // Create CompanyTraining (no upsert - always create new)
    const companyTraining = await prisma.companyTraining.create({
      data: {
        title: training.title,
        description: training.description || null,
        trainingDate: training.startDate ? new Date(training.startDate) : null,
        deadline: training.endDate ? new Date(training.endDate) : null,
        link: training.links && training.links.length > 0 ? training.links[0] : null,
        pocFirstName: training.poc?.name ? training.poc.name.split(' ')[0] : null,
        pocLastName: training.poc?.name ? training.poc.name.split(' ').slice(1).join(' ') : null,
        pocEmail: training.poc?.email || null,
        pocPhone: training.poc?.phone || null,
        // Store additional data in metadata via JSON field (if schema supports it)
        // For now, just use the basic fields
        companyId,
        originatorId: workMeId,
      },
    })

    return NextResponse.json({
      success: true,
      training: companyTraining,
    })
  } catch (error: any) {
    console.error('[Save Training] Error:', error)
    

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save training' },
      { status: 500 }
    )
  }
}

