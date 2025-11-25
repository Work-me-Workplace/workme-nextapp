'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect page - /mywork/context/new redirects to /mywork
 * The hub is now at /mywork
 */
export default function NewWorkContextRedirect() {
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
