'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContext } from '@/lib/actions/work-context'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function WorkContextSuccessPage() {
  const router = useRouter()
  const params = useParams()
  const contextId = params.contextId as string
  const [workContext, setWorkContext] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        loadContext()
      }
    }
  }, [contextId, router])

  async function loadContext() {
    if (!contextId) return
    setLoading(true)
    try {
      const clientWorkMeId = typeof window !== 'undefined' ? getWorkMeIdFromStorage() : null
      const result = await getWorkContext(contextId, clientWorkMeId)
      if (result.success && result.workContext) {
        setWorkContext(result.workContext)
      } else {
        // If context not found, redirect to detail page
        router.push(`/mywork/context/${contextId}`)
      }
    } catch (error) {
      console.error('Failed to load context:', error)
      router.push(`/mywork/context/${contextId}`)
    }
    setLoading(false)
  }

  if (loading || !workContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              WorkContext Created!
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              <span className="font-semibold">{workContext.title || 'Your WorkContext'}</span> has been created successfully.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              What would you like to do next?
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Build WorkSupport */}
            <Link
              href={`/mywork/support/${contextId}/setup`}
              className="block p-6 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-center"
            >
              <div className="mb-3">
                <svg className="h-10 w-10 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Set Up WorkSupport</h3>
              <p className="text-sm text-gray-600">Choose which outputs you need for this context</p>
            </Link>

            {/* View WorkContext */}
            <Link
              href={`/mywork/context/${contextId}`}
              className="block p-6 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition text-center"
            >
              <div className="mb-3">
                <svg className="h-10 w-10 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">View Details</h3>
              <p className="text-sm text-gray-600">Review and edit this WorkContext</p>
            </Link>

            {/* Create Another */}
            <Link
              href="/mywork/context/new"
              className="block p-6 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition text-center"
            >
              <div className="mb-3">
                <svg className="h-10 w-10 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Another</h3>
              <p className="text-sm text-gray-600">Start a new WorkContext</p>
            </Link>
          </div>

          {/* Context Preview */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Context Preview</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {workContext.type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown'}
              </p>
              {workContext.typedData?.description && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Description:</span> {workContext.typedData.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center space-x-4">
          <Link
            href="/mywork"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to MyWork
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/mywork/context"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            View All Contexts
          </Link>
        </div>
      </div>
    </div>
  )
}

