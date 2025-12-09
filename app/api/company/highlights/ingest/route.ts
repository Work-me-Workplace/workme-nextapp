import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { parseHighlight } from '@/lib/ai/highlightParser'
import { upsertEmployee } from '@/lib/company/employee/upsertEmployee'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/company/highlights/ingest (MVP1 Architecture)
 * 
 * Ingests raw citation text and extracts structured data with AI.
 * Creates/updates employee and creates highlight.
 * Uses companyId for organizational identity, companyUnit as string label.
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
    
    // 2. Load WorkMe identity (MVP1 - returns companyId directly, no lookups)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId, companyUnit } = workMe

    if (!companyId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User must belong to a company before creating highlights' 
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
      companyId,
      companyUnit,
      textLength: text.length,
    })

    // 3. Parse with AI
    const parsed = await parseHighlight(text)

    // Apply overrides if provided
    const finalParsed = override ? { ...parsed, ...override } : parsed

    // 4. Upsert employee (use parsed unit or workMe's companyUnit)
    const employee = await upsertEmployee({
      fullName: finalParsed.fullName,
      title: finalParsed.title,
      email: null, // Could extract from citation if available
      phone: null,
      photoUrl: photoUrl || null,
      companyId,
      companyUnit: finalParsed.unit || companyUnit || null,
      division: null,
    })

    // 5. Create highlight with companyUnitLabel
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
        companyUnitLabel: companyUnit || finalParsed.unit || null,
        createdByWorkMeId: workMeId,
      },
    })

    // 6. Link highlight to employee (for multi-employee highlights)
    await prisma.companyEmployeeHighlightLink.create({
      data: {
        employeeId: employee.id,
        highlightId: highlight.id,
      },
    })

    // 7. Return full object
    const result = await prisma.companyEmployeeHighlight.findUnique({
      where: { id: highlight.id },
      include: {
        employees: {
          include: {
            employee: true,
          },
        },
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

