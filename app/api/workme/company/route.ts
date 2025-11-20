import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWorkMeCompany } from '@/lib/config/workmeConfig'

/**
 * PUT /api/workme/company
 * 
 * Link user to a company (or create company in directory if needed)
 * Companies are container-scoped shared entities
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { workMeId, companyName, companyData } = body

    // Get workMeId from body or header
    const id = workMeId || request.headers.get('x-workme-id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'workMeId is required' },
        { status: 400 },
      )
    }

    if (!companyName) {
      return NextResponse.json(
        { success: false, error: 'companyName is required' },
        { status: 400 },
      )
    }

    // Verify WorkMe exists
    const workMe = await prisma.workMe.findUnique({
      where: { id },
    })

    if (!workMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe not found' },
        { status: 404 },
      )
    }

    // Get WorkMeCompany (container)
    const workMeCompany = await getWorkMeCompany()

    // Look up company in directory (by workMeCompanyId + name)
    let company = await prisma.company.findUnique({
      where: {
        workMeCompanyId_name: {
          workMeCompanyId: workMeCompany.id,
          name: companyName.trim(),
        },
      },
    })

    // If company doesn't exist, create it in directory
    if (!company) {
      company = await prisma.company.create({
        data: {
          workMeCompanyId: workMeCompany.id,
          name: companyName.trim(),
          industry: companyData?.industry ?? undefined,
          website: companyData?.website ?? undefined,
          city: companyData?.city ?? undefined,
          state: companyData?.state ?? undefined,
          description: companyData?.description ?? undefined,
          headcount: companyData?.headcount ?? undefined,
          companyType: companyData?.companyType ?? undefined,
          revenueRange: companyData?.revenueRange ?? undefined,
        },
      })
      console.log('✅ Created company in directory:', company.id)
    } else {
      console.log('✅ Found existing company in directory:', company.id)
    }

    // Link user to company
    const updatedWorkMe = await prisma.workMe.update({
      where: { id },
      data: {
        companyId: company.id,
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json({
      success: true,
      workMe: updatedWorkMe,
      company,
    })
  } catch (error: any) {
    console.error('❌ WorkMeCompanyLink error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to link company' },
      { status: 500 },
    )
  }
}

/**
 * GET /api/workme/company
 * 
 * Search companies in directory (for company lookup/selection)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get WorkMeCompany (container)
    const workMeCompany = await getWorkMeCompany()

    const companies = await prisma.company.findMany({
      where: {
        workMeCompanyId: workMeCompany.id,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      companies,
    })
  } catch (error: any) {
    console.error('❌ CompanySearch error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search companies' },
      { status: 500 },
    )
  }
}

