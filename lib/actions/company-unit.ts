'use server'

import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

/**
 * Load current user's company unit information
 * 
 * Server action for client-side components that need identity
 * Returns workMeId, companyUnit, and companyDivision
 */
export async function loadMyCompanyUnit() {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)

    return {
      success: true as const,
      workMeId: workMe.id,
      companyUnit: workMe.companyUnit,
      companyDivision: workMe.companyDivision,
    }
  } catch (error: any) {
    console.error('[loadMyCompanyUnit] Error:', error)
    return {
      success: false as const,
      error: error.message || 'Failed to load company unit',
      workMeId: null,
      companyUnit: null,
      companyDivision: null,
    }
  }
}

