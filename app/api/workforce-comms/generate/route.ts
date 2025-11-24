import { NextRequest, NextResponse } from 'next/server'
import { getWorkforceCommsDraft } from '@/lib/actions/workforce-comms'
import { getWorkContexts } from '@/lib/actions/work-context'
import { getTypedContext } from '@/lib/actions/typed-contexts'
import { createWorkforceCommsEdition } from '@/lib/actions/workforce-comms'

// AI Generation endpoint
// This is a placeholder - you'll need to integrate with OpenAI or your AI service
export async function POST(request: NextRequest) {
  try {
    const { draftId, productId } = await request.json()

    if (!draftId || !productId) {
      return NextResponse.json(
        { success: false, error: 'draftId and productId are required' },
        { status: 400 }
      )
    }

    // Fetch draft
    const draftResult = await getWorkforceCommsDraft(draftId)
    if (!draftResult.success || !draftResult.draft) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      )
    }

    const draft = draftResult.draft

    // Fetch work contexts
    // Note: contextIds may not exist on draft type, so we safely access it
    const contextIds = Array.isArray((draft as any).contextIds) ? (draft as any).contextIds : []
    const contexts: any[] = []
    
    if (contextIds.length > 0) {
      const contextsResult = await getWorkContexts()
      if (contextsResult.success && contextsResult.workContexts) {
        const matching = contextsResult.workContexts.filter((c: any) => 
          contextIds.includes(c.id)
        )
        contexts.push(...matching)
      }
    }

    // Build prompt for AI
    const prompt = buildPrompt(draft, contexts)

    // TODO: Replace with actual OpenAI API call
    // For now, return a placeholder response
    const generatedContent = await generateEmailContent(prompt)

    // Create edition
    const editionResult = await createWorkforceCommsEdition({
      workforceCommsId: productId,
      subject: generatedContent.subject,
      body: generatedContent.body,
      sentAt: null,
    })

    if (!editionResult.success || !editionResult.edition) {
      return NextResponse.json(
        { success: false, error: 'Failed to create edition' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      edition: editionResult.edition,
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

