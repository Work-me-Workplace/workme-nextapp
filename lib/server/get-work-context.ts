"use server"

import { prisma } from "@/lib/prisma"
import { getWorkMeId } from "@/lib/getWorkMeId.server"
import { getTypedContext } from "./context-factory"

/**
 * Get and enrich a WorkContext with typed data
 * Returns null if not found or unauthorized
 */
export async function getWorkContext(
  id: string,
  clientWorkMeId?: string | null
) {
  console.log('[WorkContext GET]', {
    contextId: id,
    clientWorkMeId,
  })

  // Try server-side first, fallback to client-provided value
  let workMeId = await getWorkMeId()
  
  if (!workMeId && clientWorkMeId) {
    // Verify the client-provided workMeId exists in database for security
    const workMe = await prisma.workMe.findUnique({
      where: { id: clientWorkMeId },
      select: { id: true },
    })
    if (workMe) {
      workMeId = clientWorkMeId
      console.log('[WorkContext GET] Using client-provided workMeId', { workMeId })
    }
  }

  if (!workMeId) {
    console.error('[WorkContext GET] ERROR: No workMeId found', {
      contextId: id,
      clientWorkMeId,
    })
    return null
  }

  console.log('[WorkContext GET] Looking up router', {
    contextId: id,
    workMeId,
  })

  // Get router entry with ownership validation
  const router = await prisma.workContext.findFirst({
    where: { 
      id, 
      createdByWorkMeId: workMeId,
    },
    include: {
      outputs: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  if (!router) {
    console.error('[WorkContext GET] ERROR: Router not found', {
      contextId: id,
      workMeId,
    })
    return null
  }

  console.log('[WorkContext GET] Router found', {
    contextId: id,
    routerId: router.id,
    type: router.type,
    typeRefId: router.typeRefId,
    workMeId,
  })

  // Enrich with typed data
  const typed = await getTypedContext(router.type, router.typeRefId)

  const result = {
    ...router,
    typedData: typed,
    title: typed?.title ?? "",
  }

  console.log('[WorkContext GET] SUCCESS', {
    contextId: id,
    routerId: router.id,
    type: router.type,
    title: result.title,
    workMeId,
  })

  return result
}

