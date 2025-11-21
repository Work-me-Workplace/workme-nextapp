'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContexts, deleteWorkContext } from '@/lib/actions/work-context'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function WorkContextListPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [workContexts, setWorkContexts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadContexts()
      }
    }
  }, [router])

  async function loadContexts() {
    setLoading(true)
    try {
      const result = await getWorkContexts()
      if (result.success) {
        setWorkContexts(result.workContexts || [])
      }
    } catch (error) {
      console.error('Failed to load contexts:', error)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this WorkContext?')) {
      const result = await deleteWorkContext(id)
      if (result.success) {
        loadContexts()
      } else {
        alert('Failed to delete WorkContext')
      }
    }
  }

  const filteredContexts = workContexts.filter(context =>
    (context.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    context.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (context.typedData?.description && context.typedData.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (!workMeId) {
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
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                MyWork
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/mywork"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/mywork'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mywork/context"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      pathname?.startsWith('/mywork/context')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    WorkContext
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Career
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/career"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career/objectives"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Objectives
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career/achievements"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Achievements
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Setup
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/setup"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Modules
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Link href="/mywork" className="text-blue-600 hover:text-blue-700 mb-2 inline-block text-sm">
                  ← Back to MyWork
                </Link>
                <h2 className="text-3xl font-bold text-gray-900">WorkContexts</h2>
                <p className="text-gray-600 mt-2">Create or select a WorkContext to start</p>
              </div>
              <Link
                href="/mywork/context/new"
                className="rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition"
              >
                Create New WorkContext
              </Link>
            </div>

            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search contexts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : filteredContexts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'No contexts match your search' : 'No WorkContexts yet'}
                  </p>
                  <Link
                    href="/mywork/context/new"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first WorkContext →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContexts.map((context) => (
                  <Link
                    key={context.id}
                    href={`/mywork/context/${context.id}`}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{context.title || 'Untitled'}</h3>
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">
                          {context.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    {context.typedData?.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{context.typedData.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                      <span>Created {new Date(context.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDelete(context.id)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

