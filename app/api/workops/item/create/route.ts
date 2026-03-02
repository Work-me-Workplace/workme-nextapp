import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { getOrCreateOutlook } from '@/lib/server/workops/outlook'
import { createWorkOpsItem } from '@/lib/server/workops/items'
import { WorkOpsItemType, WorkOpsUrgency, WorkOpsSource, WorkOpsDerivedFrom, WorkOpsCategory } from '@prisma/client'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().optional().nullable(),
  itemType: z.nativeEnum(WorkOpsItemType),
  urgency: z.nativeEnum(WorkOpsUrgency).optional().nullable(),
  source: z.nativeEnum(WorkOpsSource).optional().nullable(),
  derivedFrom: z.nativeEnum(WorkOpsDerivedFrom).optional().nullable(),
  category: z.nativeEnum(WorkOpsCategory).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assignedBy: z.string().optional().nullable(),
})

/**
 * POST /api/workops/item/create
 * Create a new WorkOpsItem
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Get or create outlook
    const outlook = await getOrCreateOutlook(workMeId)

    // 4. Parse and validate request body
    const body = await request.json()
    const validated = createItemSchema.parse(body)

    // 5. Create WorkOpsItem
    const item = await createWorkOpsItem({
      outlookId: outlook.id,
      title: validated.title,
      body: validated.body || null,
      itemType: validated.itemType,
      urgency: validated.urgency || null,
      source: validated.source || null,
      derivedFrom: validated.derivedFrom || null,
      category: validated.category || null,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      assignedBy: validated.assignedBy || null,
    })

    console.log('[API POST /api/workops/item/create] SUCCESS', {
      itemId: item.id,
    })

    return NextResponse.json({
      success: true,
      item,
    })
  } catch (error: any) {
    console.error('❌ POST /api/workops/item/create error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 },
      )
    }

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create WorkOpsItem',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

