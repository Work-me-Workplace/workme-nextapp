'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContexts } from '@/lib/actions/work-context'
import { getWorkOutputs } from '@/lib/actions/work-output'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'

export default function MyWorkPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [activeWorkOutputs, setActiveWorkOutputs] = useState<any[]>([])
  const [recentContexts, setRecentContexts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for workMeId in localStorage
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        // No workMeId, redirect to signin
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadData(id)
      }
    }
  }, [router])

  async function loadData(workMeId: string) {
    setLoading(true)
    try {
      // Load work outputs (active ones)
      const outputsResult = await getWorkOutputs(workMeId)
      if (outputsResult.success) {
        setActiveWorkOutputs(outputsResult.workOutputs || [])
      }

      // Load recent contexts
      const contextsResult = await getWorkContexts()
      if (contextsResult.success) {
        setRecentContexts((contextsResult.workContexts || []).slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
    setLoading(false)
  }

  const isActive = (path: string) => {
    if (path === '/mywork') return pathname === path
    return pathname?.startsWith(path)
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.clear()
                  router.push('/signin')
                }}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <SidebarNav />

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">MyWork Dashboard</h2>
              <p className="text-gray-600 mt-2">Manage your work contexts and outputs</p>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-8 text-white mb-8">
              <h3 className="text-2xl font-bold mb-4">Let's Work</h3>
              <p className="text-blue-100 mb-6">
                Build company-level impact events that may lead to your personal workflow.
              </p>
              <Link 
                href="/mywork/context" 
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition inline-block"
              >
                Go to Events →
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active WorkOutputs */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active WorkOutputs</h3>
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {activeWorkOutputs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No active outputs yet</p>
                    <Link
                      href="/mywork/context"
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Create your first output →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeWorkOutputs.slice(0, 5).map((output) => (
                      <div key={output.id} className="border-l-4 border-blue-600 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{output.context?.title}</p>
                            <p className="text-sm text-gray-500 capitalize">{output.outputType.replace('_', ' ')}</p>
                          </div>
                          <Link
                            href={`/mywork/outputs/builder/${output.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View →
                          </Link>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Updated {new Date(output.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent WorkContexts */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                {recentContexts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No contexts yet</p>
                    <Link
                      href="/mywork/context/new"
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Create your first context →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentContexts.map((context) => (
                      <Link
                        key={context.id}
                        href={`/mywork/context/${context.id}`}
                        className="block border-l-4 border-green-600 pl-4 py-2 hover:bg-gray-50 rounded-r"
                      >
                        <p className="font-medium text-gray-900">{context.title}</p>
                        <p className="text-sm text-gray-500 capitalize">{context.type}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created {new Date(context.createdAt).toLocaleDateString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

