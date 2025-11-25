'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect from /mywork/context to /mywork dashboard
 * The list page has been removed - events are now accessed via detail pages
 */
export default function ContextListRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/mywork')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

