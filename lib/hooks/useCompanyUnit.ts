'use client'

import { useState, useEffect } from 'react'

/**
 * useCompanyUnit Hook
 * 
 * Gets companyUnit from localStorage
 * Returns null if not set
 */
export function useCompanyUnit(): string | null {
  const [companyUnit, setCompanyUnit] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('companyUnit')
    setCompanyUnit(stored)

    // Listen for storage changes (e.g., when AuthProvider updates it)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'companyUnit') {
        setCompanyUnit(e.newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom events (same-origin updates)
    const handleCustomStorageChange = () => {
      const updated = localStorage.getItem('companyUnit')
      setCompanyUnit(updated)
    }

    // Listen for custom event that AuthProvider can dispatch
    window.addEventListener('companyUnitUpdated', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('companyUnitUpdated', handleCustomStorageChange)
    }
  }, [])

  return companyUnit
}

