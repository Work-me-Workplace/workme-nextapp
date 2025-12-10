/**
 * DEPRECATED: Create page consolidated into /mywork/products
 * 
 * This page redirects to the unified products page which includes
 * both product listing and creation functionality.
 */

'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve query parameters when redirecting
    const params = searchParams.toString()
    const redirectUrl = params ? `/mywork/products?${params}` : '/mywork/products'
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

