import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company-registry/create
 * 
 * Create company registry entry (CompanyRegistry) - for Company HQ
 * Search-before-create pattern like RaceRegistry
 * 
 * Body: { name: string }
 * 
 * Behavior:
 * - Search first by name (case-insensitive exact match)
 * - If exists, return existing
 * - If not, create new
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company HQ name is required' },
        { status: 400 },
      )
    }

    const normalizedName = name.trim()

    // REGISTRY PATTERN: Search first, if exists, return it. If not, create it.
    const existing = await prisma.companyRegistry.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      console.log('✅ CompanyRegistry (HQ) found in registry:', existing.id)
      return NextResponse.json({
        success: true,
        company: {
          id: existing.id,
          name: existing.name,
        },
        message: 'Company HQ found in registry',
      })
    }

    // Create new company registry entry
    const company = await prisma.companyRegistry.create({
      data: {
        name: normalizedName,
      },
    })

    console.log('✅ CompanyRegistry (HQ) created:', company.id)

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
      },
    })
  } catch (error: any) {
    console.error('❌ CompanyRegistryCreate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create company HQ' },
      { status: 500 },
    )
  }
}

