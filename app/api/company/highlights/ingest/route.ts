import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { parseHighlight } from '@/lib/ai/highlightParser'
import { upsertEmployee } from '@/lib/company/employee/upsertEmployee'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/company/highlights/ingest
 * 
 * Ingests raw citation text and extracts structured data with AI.
 * Creates/updates employee and creates highlight with junction tables.
 * 
 * Body: {
 *   text: string,
 *   photoUrl?: string,
 *   override?: { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!companyUnit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User must set a companyUnit before creating highlights' 
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { text, photoUrl, override } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'text is required and must be a non-empty string' 
        },
        { status: 400 },
      )
    }

    console.log('[API POST /api/company/highlights/ingest]', {
      workMeId,
      companyUnit,
      textLength: text.length,
    })

    // 3. Parse with AI
    const parsed = await parseHighlight(text)

    // Apply overrides if provided
    const finalParsed = override ? { ...parsed, ...override } : parsed

    // 4. Get user's companyId from their companyUnitMemberships
    // companyUnit is a string (e.g., "SEA 05"), so we need to find the CompanyUnit by name
    const userMembership = await prisma.companyUnitMembers.findFirst({
      where: { workMeId },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
            companyId: true,
          },
        },
      },
    })

    // If no membership found, try to find CompanyUnit by the companyUnit string
    let companyId = userMembership?.unit?.companyId || null
    
    if (!companyId && companyUnit) {
      const companyUnitRecord = await prisma.companyUnit.findFirst({
        where: {
          name: {
            equals: companyUnit,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          companyId: true,
        },
      })
      companyId = companyUnitRecord?.companyId || null
    }

    if (!companyId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User must belong to a company unit with a company' 
        },
        { status: 400 },
      )
    }

    // 5. Upsert employee
    const employee = await upsertEmployee({
      fullName: finalParsed.fullName,
      title: finalParsed.title,
      email: null, // Could extract from citation if available
      phone: null,
      photoUrl: photoUrl || null,
      unitRaw: finalParsed.unit,
      companyId,
      companyUnitId: null, // Will be normalized by upsertEmployee
      divisionId: null,
    })

    // 6. Create highlight
    const highlight = await prisma.companyEmployeeHighlight.create({
      data: {
        citationText: finalParsed.citationText,
        achievement: finalParsed.achievement,
        narrative: finalParsed.narrative,
        classification: finalParsed.classification,
        awardName: finalParsed.awardName,
        awardingAgency: finalParsed.awardingAgency,
        awardYear: finalParsed.awardYear,
        supervisorQuote: finalParsed.supervisorQuote,
        photoUrl: photoUrl || null,
        createdByWorkMeId: workMeId,
      },
    })

    // 7. Link highlight to employee
    await prisma.companyEmployeeHighlightLink.create({
      data: {
        employeeId: employee.id,
        highlightId: highlight.id,
      },
    })

    // 8. Link highlight to companyUnit for tenantization
    await prisma.companyEmployeeHighlightUnit.create({
      data: {
        highlightId: highlight.id,
        companyUnit: companyUnit,
      },
    })

    // 9. Return full object
    const result = await prisma.companyEmployeeHighlight.findUnique({
      where: { id: highlight.id },
      include: {
        employees: {
          include: {
            employee: true,
          },
        },
        units: true,
      },
    })

    console.log('[API POST /api/company/highlights/ingest] SUCCESS', {
      highlightId: highlight.id,
      employeeId: employee.id,
    })

    return NextResponse.json({
      success: true,
      highlight: result,
      employee,
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/highlights/ingest error:', error)

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to ingest highlight',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

