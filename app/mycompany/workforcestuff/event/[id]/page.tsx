'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Event detail route: /mycompany/workforcestuff/event/[id]
 *
 * The add flow redirects here after creating an event, but the actual detail
 * and hydration live on the unified workforcestuff [id] page and API.
 * This page redirects so the same component and API are used.
 */
export default function EventDetailRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/mycompany/workforcestuff/${id}`)
    }
  }, [id, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
}
