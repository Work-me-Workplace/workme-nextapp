"use server"

import { prisma } from "@/lib/prisma"
import { getTypedContext } from "./context-factory"

/**
 * Get and enrich a WorkEventRouter with typed data
 * Filters by companyId for multi-tenant security
 * Returns null if not found or unauthorized
 * 
 * @param id - The WorkEventRouter router ID
 * @param companyId - The company ID to scope the query (required for multi-tenant)
 */
export async function getWorkEventRouter(
  id: string,
  companyId: string
) {
  console.log('[WorkEventRouter GET]', {
    routerId: id,
    companyId,
  })

  if (!companyId) {
    console.error('[WorkEventRouter GET] ERROR: No companyId - user must belong to a company', {
      routerId: id,
    })
    return null
  }

  console.log('[WorkEventRouter GET] Looking up router', {
    routerId: id,
    companyId,
  })

  // Get router entry with company scoping (multi-tenant security)
  const router = await prisma.workEventRouter.findFirst({
    where: { 
      id,
      companyId, // Multi-tenant: ensure same company
    },
    include: {
      outputs: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  if (!router) {
    console.error('[WorkEventRouter GET] ERROR: Router not found', {
      routerId: id,
      companyId,
    })
    return null
  }

  console.log('[WorkEventRouter GET] Router found', {
    routerId: router.id,
    type: router.type,
    eventRefId: router.eventRefId,
    companyId,
  })

  // Enrich with typed data (filtered by companyId)
  const typed = await getTypedContext(router.type, router.eventRefId, companyId)

  const result = {
    ...router,
    typedData: typed,
    title: typed?.title ?? "",
  }

  console.log('[WorkEventRouter GET] SUCCESS', {
    routerId: id,
    routerId: router.id,
    type: router.type,
    title: result.title,
    companyId,
  })

  return result
}

// Legacy alias for backward compatibility during migration
export const getWorkContext = getWorkEventRouter

