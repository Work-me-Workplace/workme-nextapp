"use server"

import { prisma } from "@/lib/prisma"
import { getTypedContext } from "./context-factory"

/**
 * Get and enrich a WorkContext with typed data
 * Filters by companyId for multi-tenant security
 * Returns null if not found or unauthorized
 * 
 * @param id - The WorkContext router ID
 * @param companyId - The company ID to scope the query (required for multi-tenant)
 */
export async function getWorkContext(
  id: string,
  companyId: string
) {
  console.log('[WorkContext GET]', {
    contextId: id,
    companyId,
  })

  if (!companyId) {
    console.error('[WorkContext GET] ERROR: No companyId - user must belong to a company', {
      contextId: id,
    })
    return null
  }

  console.log('[WorkContext GET] Looking up router', {
    contextId: id,
    companyId,
  })

  // Get router entry with company scoping (multi-tenant security)
  const router = await prisma.workContext.findFirst({
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
    console.error('[WorkContext GET] ERROR: Router not found', {
      contextId: id,
      companyId,
    })
    return null
  }

  console.log('[WorkContext GET] Router found', {
    contextId: id,
    routerId: router.id,
    type: router.type,
    typeRefId: router.typeRefId,
    companyId,
  })

  // Enrich with typed data (filtered by companyId)
  const typed = await getTypedContext(router.type, router.typeRefId, companyId)

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
    companyId,
  })

  return result
}

