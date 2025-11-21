'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { getWorkSupport } from '@/lib/actions/work-support'

console.log('[WorkSupport] detail page rendered')

export default function WorkSupportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workSupportId = params.workSupportId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [workSupport, setWorkSupport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadWorkSupport()
      }
    }
  }, [workSupportId, router])

  async function loadWorkSupport() {
    if (!workSupportId) return
    try {
      const result = await getWorkSupport(workSupportId)
      if (result.success && result.support) {
        setWorkSupport(result.support)
      } else {
        alert('WorkSupport not found')
        router.push('/worksupport')
      }
    } catch (error) {
      console.error('Failed to load work support:', error)
      router.push('/worksupport')
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workSupport) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/worksupport"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to WorkSupport
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">WorkSupport Details</h1>
          <pre className="bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify(workSupport, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

