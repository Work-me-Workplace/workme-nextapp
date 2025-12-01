'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * DEPRECATED: This page has been replaced by the multi-step onboarding flow at /profile
 * 
 * This page now redirects to /profile for workspace setup
 */
export default function SetupUnitPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to profile for new onboarding flow
    router.replace('/profile')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}
