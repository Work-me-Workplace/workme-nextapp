'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Calendar, FileText, Plus, Archive, Edit, ArchiveRestore } from 'lucide-react'
import api from '@/lib/api'

interface WorkforceStuffItem {
  id: string
  type: 'event' | 'training' | 'benefit' | 'campaign' | 'impact' | 'cause' | 'community' | 'announcement'
  title: string
  summary?: string
  description?: string
  details?: string
  startDate?: string | null
  endDate?: string | null
  status?: 'active' | 'archived'
  archived?: boolean
  createdAt: string
  [key: string]: any // For additional fields
}

export default function WorkforceStuffDetailPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = params?.id as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [item, setItem] = useState<WorkforceStuffItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        if (itemId) {
          loadItem()
        }
      }
    }
  }, [router, itemId])

  async function loadItem() {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/workforcestuff/${itemId}`)
      
      if (response.data.success && response.data.item) {
        const loadedItem = response.data.item
        const isArchived = loadedItem.status === 'ARCHIVED' || loadedItem.archived
        setItem({
          ...loadedItem,
          status: isArchived ? 'archived' : 'active',
          archived: isArchived,
        })
      } else {
        setError('Item not found')
      }
    } catch (err: any) {
      console.error('Failed to load workforce stuff item:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load item')
    } finally {
      setLoading(false)
    }
  }

  async function handleArchive(archived: boolean) {
    if (!item) return

    try {
      setArchiving(true)
      setError(null)
      
      const response = await api.put(`/api/workforcestuff/${itemId}`, {
        type: item.type,
        data: { status: archived ? 'ARCHIVED' : 'ACTIVE' },
      })

      if (response.data.success) {
        // Reload the item to reflect the change
        await loadItem()
        // Also refresh the list by redirecting back
        router.push('/mycompany/workforcestuff')
      } else {
        setError(response.data.error || 'Failed to archive item')
      }
    } catch (err: any) {
      console.error('Failed to archive item:', err)
      setError(err.response?.data?.error || err.message || 'Failed to archive item')
    } finally {
      setArchiving(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!loading && !item && !error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-xl font-bold text-gray-900">Work.me</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex">
          <SidebarNav />
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow p-12 text-center">
                {error ? (
                  <>
                    <p className="text-red-600 mb-4 font-semibold">{error}</p>
                    <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700">
                      ← Back to Workforce Stuff
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">Workforce item not found</p>
                    <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700">
                      ← Back to Workforce Stuff
                    </Link>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!item) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
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
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
              ← Back to Workforce Stuff
            </Link>

            <div className="bg-white rounded-lg shadow p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase bg-blue-100 text-blue-800 px-2 py-1 rounded mb-2 inline-block">
                    {item.type}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mt-2">{item.title}</h1>
                  {(item.summary || item.description) && (
                    <p className="text-gray-600 mt-2">{item.summary || item.description}</p>
                  )}
                  {item.archived && (
                    <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                      Archived
                    </span>
                  )}
                </div>
              </div>

              {/* Date Information */}
              {(item.startDate || item.endDate) && (
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  {item.startDate && (
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Start Date</p>
                        <p className="font-semibold text-gray-900">{new Date(item.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {item.endDate && (
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">End Date</p>
                        <p className="font-semibold text-gray-900">{new Date(item.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Details */}
              {(item.details || item.description) && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Details</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{item.details || item.description}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 border-t">
                <Link
                  href={`/mywork/create?sourceId=${item.id}&sourceType=${item.type}`}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Work Output
                </Link>
                <Link
                  href={`/mywork/products?sourceId=${item.id}`}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  View Related Outputs
                </Link>
                {item.archived ? (
                  <button
                    onClick={() => handleArchive(false)}
                    disabled={archiving}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <ArchiveRestore className="h-5 w-5 mr-2" />
                    {archiving ? 'Unarchiving...' : 'Unarchive'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleArchive(true)}
                    disabled={archiving}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Archive className="h-5 w-5 mr-2" />
                    {archiving ? 'Archiving...' : 'Archive'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

