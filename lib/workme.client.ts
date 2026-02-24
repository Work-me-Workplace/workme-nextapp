/**
 * Client-side WorkMe identity helpers
 * 
 * Provides getWorkMe() and refreshWorkMe() for accessing stored WorkMe identity.
 * Full WorkMe object is stored in localStorage after initial hydration.
 */

'use client'

import api from '@/lib/api'

export interface WorkMe {
  id: string
  firebaseId: string | null
  email: string
  createdAt: Date
  headline: string | null
  handle: string | null
  title: string | null
  linkedinUrl: string | null
  companyId: string | null // Authoritative organizational FK
  companyUnit: string | null // Optional string label
  division: string | null // Optional string label
  workMeCompanyId: string | null
  workMeCompany: {
    id: string
    name: string
  } | null
  photoUrl: string | null
  displayName: string | null
  workProfile: any | null
  workSkills: any | null
  workEntries: any[]
  workGoals: any[]
  workplaces: any[]
  ecosystemCompanies: any[]
  ecosystemContacts: any[]
  workOpsOutlook: any | null
  companyProducts: any[]
  externalCompanyPressures: any[]
}

const STORAGE_KEY = 'workme'

/**
 * Get WorkMe object from localStorage
 * Returns null if not found or if running on server
 */
export function getWorkMe(): WorkMe | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const workMe = JSON.parse(stored)
    // Convert date strings back to Date objects
    if (workMe.createdAt) {
      workMe.createdAt = new Date(workMe.createdAt)
    }
    return workMe
  } catch (error) {
    console.error('[getWorkMe] Failed to parse stored WorkMe:', error)
    return null
  }
}

/**
 * Refresh WorkMe from API and update localStorage
 * Use this when you need to sync with server (e.g., after profile updates)
 */
export async function refreshWorkMe(): Promise<WorkMe | null> {
  try {
    const response = await api.get('/api/workme/me')
    
    if (!response.data.success || !response.data.workMe) {
      throw new Error(response.data.error || 'Failed to fetch WorkMe')
    }

    const workMe = response.data.workMe

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workMe))
      
      // Store companyId separately for easy access
      if (workMe.companyId) {
        localStorage.setItem('companyId', workMe.companyId)
      } else {
        // Clear companyId if it was removed
        localStorage.removeItem('companyId')
      }
      
      // Clean up legacy companyUnit from localStorage (no longer used)
      localStorage.removeItem('companyUnit')
    }

    return workMe
  } catch (error: any) {
    console.error('[refreshWorkMe] Failed to refresh WorkMe:', error)
    return null
  }
}

/**
 * Clear WorkMe from localStorage
 * Useful for logout
 */
export function clearWorkMe(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

