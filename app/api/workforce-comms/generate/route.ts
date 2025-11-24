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
    const { workMeId, companyId } = await verifyAuth(request)

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

    // Verify draft belongs to user's company
    const product = await prisma.workforceComms.findUnique({
      where: { workforceCommsId: productId },
      select: { companyId: true },
    })

    if (!product || product.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Draft not found or unauthorized' },
        { status: 404 }
      )
    }

    // Fetch work contexts using eventRouterIds (not contextIds)
    const eventRouterIds = Array.isArray(draft.eventRouterIds) 
      ? (draft.eventRouterIds as string[]).filter((id): id is string => typeof id === 'string')
      : []
    const contexts: any[] = []
    
    if (eventRouterIds.length > 0) {
      // Get work event routers for the user's company
      const workEventRouters = await prisma.workEventRouter.findMany({
        where: { 
          id: { in: eventRouterIds },
          companyId, // Multi-tenant security
        },
        orderBy: { createdAt: 'desc' },
      })

      // Enrich with typed context data using factory
      const enrichedContexts = await Promise.all(
        workEventRouters.map(async (router) => {
          const typed = await getTypedContext(router.type, router.eventRefId, companyId)
          return {
            ...router,
            typedData: typed,
            title: typed?.title ?? '',
          }
        })
      )

      contexts.push(...enrichedContexts)
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
        companyId: companyId,
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

