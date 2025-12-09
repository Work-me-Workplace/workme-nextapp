'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * DEPRECATED: Old hardcoded X Feed tune page
 * Redirects to new ecosystem search page
 */
export default function TuneXFeedPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to new ecosystem search page
    router.replace('/ecosystem/search')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to new ecosystem search...</p>
      </div>
    </div>
  )
}
