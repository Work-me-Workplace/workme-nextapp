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
    }
  }

  if (!workMeId) {
    return null
  }

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
    return null
  }

  // Enrich with typed data
  const typed = await getTypedContext(router.type, router.typeRefId)

  return {
    ...router,
    typedData: typed,
    title: typed?.title ?? "",
  }
}

