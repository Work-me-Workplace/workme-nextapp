/**
 * POST /api/concept-draft/generate
 * 
 * Generate a ConceptDraft from brain dump input using AI
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { generateConceptDraft } from '@/lib/services/concept-draft-ai-service'

export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    
    const body = await request.json()
    const { brainDump, companyContext } = body

    if (!brainDump || !brainDump.trim()) {
      return NextResponse.json(
        { success: false, error: 'brainDump is required' },
        { status: 400 }
      )
    }

    const result = await generateConceptDraft({
      brainDump: brainDump.trim(),
      companyContext: companyContext?.trim(),
    })

    return NextResponse.json({
      success: true,
      conceptDraft: result,
    })
  } catch (error: any) {
    console.error('❌ Concept Draft Generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate concept draft' },
      { status: 500 }
    )
  }
}

