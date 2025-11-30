import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'
import { getTypedContext } from '@/lib/server/context-factory'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// AI Generation endpoint
// This is a placeholder - you'll need to integrate with OpenAI or your AI service
export async function POST(request: NextRequest) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyUnit, companyDivision } = await verifyAuth(request)

    if (!companyUnit) {
      return NextResponse.json(
        { success: false, error: 'User must set a companyUnit' },
        { status: 400 }
      )
    }

    const { draftId, productId } = await request.json()

    if (!draftId || !productId) {
      return NextResponse.json(
        { success: false, error: 'draftId and productId are required' },
        { status: 400 }
      )
    }

    // Fetch draft directly from Prisma (not using server action)
    const draft = await prisma.workforceCommsDraft.findUnique({
      where: { draftId },
      include: {
        product: true,
        lastEdition: true,
      },
    })

    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      )
    }

    // Verify draft belongs to user's company unit
    const product = await prisma.workforceComms.findUnique({
      where: { workforceCommsId: productId },
      select: { companyUnit: true, companyDivision: true },
    })

    if (!product || product.companyUnit !== companyUnit) {
      return NextResponse.json(
        { success: false, error: 'Draft not found or unauthorized' },
        { status: 404 }
      )
    }

    // Fetch work contexts using CompanyWorkLink (eventRouterIds is deprecated)
    // Filter by related CompanyX models' companyUnit since CompanyWorkLink doesn't have companyUnit
    const companyWorkLinks = await prisma.companyWorkLink.findMany({
      where: {
        workCommsProductId: productId,
        OR: [
          { companyEvent: { companyUnit } },
          { companyCampaign: { companyUnit } },
          { companyImpactEvent: { companyUnit } },
          { companyTraining: { companyUnit } },
          { companyCommunity: { companyUnit } },
          { companyBenefits: { companyUnit } },
          { companyCareer: { companyUnit } },
          { companyEmployeeCause: { companyUnit } },
        ],
      },
      include: {
        companyEvent: true,
        companyCampaign: true,
        companyImpactEvent: true,
        companyTraining: true,
        companyCommunity: true,
        companyBenefits: true,
        companyCareer: true,
        companyEmployeeCause: true,
      },
    })

    const contexts: any[] = []
    
    // Extract CompanyX models from links and enrich them
    for (const link of companyWorkLinks) {
      let companyX: any = null
      let type: string | null = null

      if (link.companyEvent) {
        companyX = link.companyEvent
        type = 'event'
      } else if (link.companyCampaign) {
        companyX = link.companyCampaign
        type = 'campaign'
      } else if (link.companyImpactEvent) {
        companyX = link.companyImpactEvent
        type = 'impact_event'
      } else if (link.companyTraining) {
        companyX = link.companyTraining
        type = 'training'
      } else if (link.companyCommunity) {
        companyX = link.companyCommunity
        type = 'community'
      } else if (link.companyBenefits) {
        companyX = link.companyBenefits
        type = 'benefits'
      } else if (link.companyCareer) {
        companyX = link.companyCareer
        type = 'career'
      } else if (link.companyEmployeeCause) {
        companyX = link.companyEmployeeCause
        type = 'employee_cause'
      }

      if (companyX && type) {
        contexts.push({
          ...companyX,
          type,
          typedData: companyX,
          title: companyX.title || 'Unknown',
        })
      }
    }

    // Fallback: If no CompanyWorkLinks found, try using deprecated eventRouterIds
    // This is for backward compatibility during migration
    if (contexts.length === 0 && draft.eventRouterIds) {
      const eventRouterIds = Array.isArray(draft.eventRouterIds) 
        ? (draft.eventRouterIds as string[]).filter((id): id is string => typeof id === 'string')
        : []
      
      if (eventRouterIds.length > 0) {
        console.warn('[API POST /api/workforce-comms/generate] Using deprecated eventRouterIds field. Please migrate to CompanyWorkLink.')
        // Note: Without WorkEventRouter, we can't resolve these IDs
        // This is a migration issue that needs to be handled
      }
    }

    // Build prompt for AI
    const prompt = buildPrompt(draft, contexts)

    // TODO: Replace with actual OpenAI API call
    // For now, return a placeholder response
    const generatedContent = await generateEmailContent(prompt)

    // Create edition directly using Prisma (not using server action)
    const edition = await prisma.workforceCommsEdition.create({
      data: {
      workforceCommsId: productId,
      subject: generatedContent.subject,
      body: generatedContent.body,
      sentAt: null,
        originatorId: workMeId,
        companyUnit: companyUnit,
        companyDivision: companyDivision,
      },
    })

    return NextResponse.json({
      success: true,
      edition,
    })
  } catch (error) {
    console.error('Error generating edition:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate edition' },
      { status: 500 }
    )
  }
}

function buildPrompt(draft: any, contexts: any[]): string {
  let prompt = `Generate a workforce communication email based on the following:\n\n`

  // Product info
  prompt += `Product: ${draft.product.name}\n`
  if (draft.product.description) {
    prompt += `Description: ${draft.product.description}\n`
  }
  prompt += `\n`

  // Work contexts
  if (contexts.length > 0) {
    prompt += `Work Contexts:\n`
    contexts.forEach((ctx) => {
      prompt += `- ${ctx.title} (${ctx.type})\n`
      if (ctx.typedData?.description) {
        prompt += `  ${ctx.typedData.description}\n`
      }
    })
    prompt += `\n`
  }

  // Last edition
  if (draft.lastEdition) {
    prompt += `Previous Edition:\n`
    prompt += `Subject: ${draft.lastEdition.subject}\n`
    prompt += `Body: ${draft.lastEdition.body.substring(0, 500)}...\n`
    prompt += `\n`
  }

  // What changed
  if (draft.whatChanged) {
    prompt += `What Changed: ${draft.whatChanged}\n`
    prompt += `\n`
  }

  // Priority notes
  if (draft.priorityNotes) {
    prompt += `Priority Notes: ${draft.priorityNotes}\n`
    prompt += `\n`
  }

  // Author notes
  if (draft.authorNotes) {
    prompt += `Author Instructions: ${draft.authorNotes}\n`
    prompt += `\n`
  }

  prompt += `Generate a professional email with subject and body. Make it clear, actionable, and appropriate for workforce communication.`

  return prompt
}

// Placeholder function - replace with actual OpenAI API call
async function generateEmailContent(prompt: string): Promise<{ subject: string; body: string }> {
  // TODO: Implement actual OpenAI API integration
  // For now, return a placeholder
  
  return {
    subject: `[Generated] Workforce Communication - ${new Date().toLocaleDateString()}`,
    body: `This is a placeholder generated email.\n\nPrompt:\n${prompt.substring(0, 200)}...\n\nTODO: Integrate with OpenAI API to generate actual content.`,
  }
}

