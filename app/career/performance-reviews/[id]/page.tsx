'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'

export default function PerformanceReviewIdRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [status, setStatus] = useState<'loading' | 'plan' | 'review' | 'notfound'>('loading')

  useEffect(() => {
    if (typeof window === 'undefined' || !id) return
    const wid = getWorkMeIdFromStorage()
    if (!wid) {
      router.push('/signin')
      return
    }

    let cancelled = false

    async function resolve() {
      try {
        const planRes = await api.get(`/api/performance-plans/${id}`)
        if (cancelled) return
        if (planRes.data?.success && planRes.data?.performancePlan) {
          setStatus('plan')
          router.replace(`/career/performance-reviews/plans/${id}`)
          return
        }
      } catch {
        // not a plan, try review
      }

      try {
        const reviewRes = await api.get(`/api/performance-reviews/${id}`)
        if (cancelled) return
        if (reviewRes.data?.success && reviewRes.data?.performanceReview) {
          setStatus('review')
          router.replace(`/career/performance-reviews/reviews/${id}`)
          return
        }
      } catch {
        // not a review
      }

      if (!cancelled) setStatus('notfound')
    }

    resolve()
    return () => { cancelled = true }
  }, [id, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (status === 'notfound') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Not found.</p>
          <Link href="/career/performance-reviews" className="text-blue-600 hover:underline mt-2 inline-block">Back to Performance reviews</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
}
