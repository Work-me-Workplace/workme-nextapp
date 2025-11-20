'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContext } from '@/lib/actions/work-context'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function WorkSupportPage() {
  const router = useRouter()
  const params = useParams()
  const contextId = params.contextId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [workContext, setWorkContext] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadContext()
      }
    }
  }, [contextId, router])

  async function loadContext() {
    if (!contextId) return
    setLoading(true)
    try {
      const result = await getWorkContext(contextId)
      if (result.success && result.workContext) {
        setWorkContext(result.workContext)
      } else {
        alert('WorkContext not found')
        router.push('/mywork/context')
      }
    } catch (error) {
      console.error('Failed to load context:', error)
      router.push('/mywork/context')
    }
    setLoading(false)
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workContext) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/mywork" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href={`/mywork/context/${contextId}`} 
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to WorkContext
        </Link>

        {/* WorkSupport - Minimal View */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WorkSupport</h1>
              <p className="text-gray-600 mt-1">Context details and reference</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{workContext.title}</h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded capitalize">
                    {workContext.type}
                  </span>
                  <span className="text-sm text-gray-500">
                    Created {new Date(workContext.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {workContext.description && (
                  <p className="text-gray-600 mb-4">{workContext.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {workContext.startDate && (
                  <div>
                    <span className="font-medium text-gray-700">Start Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.startDate).toLocaleString()}</span>
                  </div>
                )}
                {workContext.endDate && (
                  <div>
                    <span className="font-medium text-gray-700">End Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.endDate).toLocaleString()}</span>
                  </div>
                )}
                {workContext.location && (
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{workContext.location}</span>
                  </div>
                )}
                {workContext.pocLastName && (
                  <div>
                    <span className="font-medium text-gray-700">POC:</span>
                    <span className="ml-2 text-gray-600">{workContext.pocLastName}</span>
                  </div>
                )}
              </div>

              {workContext.labels && workContext.labels.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700 text-sm">Labels:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {workContext.labels.map((label: string) => (
                      <span
                        key={label}
                        className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                  <p className="text-sm text-gray-500 italic">
                    Notes feature coming soon. Use this space to track support details and context-specific information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href={`/mywork/outputs/${contextId}`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Build WorkOutputs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

