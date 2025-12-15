/**
 * POST /api/company/product-family/evidence
 * 
 * Attach publicly verified evidence to a ProductFamily
 * 
 * Flow:
 * 1. User selects evidence from Note Lookup results
 * 2. User selects/creates ProductFamily
 * 3. Optionally selects ProductPlatform
 * 4. System persists evidence under ProductFamily
 * 
 * STRICT: No auto-classification, no auto-save without user confirmation
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import type {
  EvidenceAttachmentRequest,
  EvidenceAttachmentResponse,
  EvidenceAttachmentError,
} from '@/lib/types/signal'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    console.log('[API POST /api/company/product-family/evidence]', {
      workMeId,
      companyId,
    })

    const body: EvidenceAttachmentRequest = await request.json()
    const {
      evidence,
      productFamilyId,
      productFamilyName,
      productFamilyDescription,
      productPlatformId,
      companyId: requestCompanyId,
      classifications,
    } = body

    // 3. Validate evidence array
    if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
      return NextResponse.json<EvidenceAttachmentError>(
        { success: false, error: 'evidence array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate each evidence item
    for (const item of evidence) {
      if (!item.title || !item.url) {
        return NextResponse.json<EvidenceAttachmentError>(
          { success: false, error: 'Each evidence item must have title and url' },
          { status: 400 }
        )
      }
    }

    // 4. Resolve ProductFamily (create if needed, or use existing)
    let finalProductFamilyId: string
    const finalCompanyId = requestCompanyId || companyId || null

    if (productFamilyId) {
      // Verify ProductFamily exists
      const existingFamily = await prisma.productFamily.findUnique({
        where: { id: productFamilyId },
      })

      if (!existingFamily) {
        return NextResponse.json<EvidenceAttachmentError>(
          { success: false, error: 'ProductFamily not found' },
          { status: 404 }
        )
      }

      finalProductFamilyId = productFamilyId
    } else if (productFamilyName) {
      // Create new ProductFamily
      const newFamily = await prisma.productFamily.create({
        data: {
          name: productFamilyName,
          description: productFamilyDescription || null,
          companyId: finalCompanyId,
          status: 'CONCEPT', // Default status
        },
      })

      finalProductFamilyId = newFamily.id
      console.log('[API POST /api/company/product-family/evidence] Created ProductFamily', {
        productFamilyId: finalProductFamilyId,
        name: productFamilyName,
      })
    } else {
      return NextResponse.json<EvidenceAttachmentError>(
        { success: false, error: 'Either productFamilyId or productFamilyName is required' },
        { status: 400 }
      )
    }

    // 5. Validate ProductPlatform if provided
    if (productPlatformId) {
      const platform = await prisma.companyPlatformProduct.findUnique({
        where: { id: productPlatformId },
      })

      if (!platform) {
        return NextResponse.json<EvidenceAttachmentError>(
          { success: false, error: 'ProductPlatform not found' },
          { status: 404 }
        )
      }
    }

    // 6. Persist ExternalEvidence records
    const evidenceIds: string[] = []

    for (const item of evidence) {
      // Parse publishedAt date if provided
      let publishedAt: Date | null = null
      if (item.date) {
        publishedAt = new Date(item.date)
        if (isNaN(publishedAt.getTime())) {
          publishedAt = null // Invalid date, set to null
        }
      }

      const evidenceRecord = await prisma.externalEvidence.create({
        data: {
          productFamilyId: finalProductFamilyId,
          productPlatformId: productPlatformId || null,
          title: item.title,
          url: item.url,
          publisher: item.source || null,
          publishedAt,
          snippet: item.snippet || null,
          capturedAt: new Date(),
        },
      })

      evidenceIds.push(evidenceRecord.id)

      // 7. Store classifications ONLY if confirmed by user
      if (classifications && classifications.length > 0) {
        for (const classification of classifications) {
          if (classification.confirmed) {
            await prisma.evidenceClassification.create({
              data: {
                evidenceId: evidenceRecord.id,
                classificationType: classification.type,
                confirmedByUser: true,
              },
            })
          }
        }
      }
    }

    const response: EvidenceAttachmentResponse = {
      success: true,
      productFamilyId: finalProductFamilyId,
      evidenceIds,
      message: `Successfully attached ${evidenceIds.length} evidence record(s) to ProductFamily`,
    }

    console.log('[API POST /api/company/product-family/evidence] SUCCESS', {
      workMeId,
      productFamilyId: finalProductFamilyId,
      evidenceCount: evidenceIds.length,
    })

    return NextResponse.json<EvidenceAttachmentResponse>(response)
  } catch (error: any) {
    console.error('❌ POST /api/company/product-family/evidence error:', error)
    
    // Handle auth errors
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json<EvidenceAttachmentError>(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json<EvidenceAttachmentError>(
      {
        success: false,
        error: error.message || 'Failed to attach evidence',
      },
      { status: 500 }
    )
  }
}