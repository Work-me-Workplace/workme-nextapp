/**
 * Client-side dashboard hydration helpers
 * 
 * Phase 2 hydration: Loads all models that depend on WorkMe identity.
 * Called on dashboard after WorkMe is already hydrated.
 */

'use client'

import api from '@/lib/api'

export interface WorkProduct {
  id: string
  type: 'email_digest' | 'digital_signage' | 'flyer_poster' | 'senior_leader_email'
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
  metadata?: any
}

export interface DashboardData {
  companyId: string | null
  companyUnit: string | null
  employees: any[]
  highlights: any[]
  campaigns: any[]
  trainings: any[]
  events: any[]
  communities: any[]
  careers: any[]
  benefits: any[]
  employeeCauses: any[]
  products: WorkProduct[]
}

const STORAGE_KEY = 'dashboard'

/**
 * Get dashboard data from localStorage
 * Returns null if not found or if running on server
 */
export function getDashboard(): DashboardData | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    return JSON.parse(stored)
  } catch (error) {
    console.error('[getDashboard] Failed to parse stored dashboard:', error)
    return null
  }
}

/**
 * Refresh dashboard data from API and update localStorage
 * Requires WorkMe to already be hydrated (Phase 1)
 */
export async function refreshDashboard(): Promise<DashboardData | null> {
  try {
    const response = await api.get('/api/dashboard/hydrate')
    
    if (!response.data.success || !response.data.dashboard) {
      throw new Error(response.data.error || 'Failed to fetch dashboard')
    }

    const dashboard = response.data.dashboard

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboard))
    }

    return dashboard
  } catch (error: any) {
    console.error('[refreshDashboard] Failed to refresh dashboard:', error)
    return null
  }
}

/**
 * Clear dashboard from localStorage
 */
export function clearDashboard(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

