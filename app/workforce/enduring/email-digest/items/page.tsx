'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/providers/AuthProvider'
import api from '@/lib/api'
import EmailDigestSidebar from '@/components/workforce/EmailDigestSidebar'

export default function ItemCataloguePage() {
  const { session, loading: authLoading } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | ready | draft | archived

  useEffect(() => {
    async function fetchItems() {
      if (authLoading || !session.firebaseId) return

      try {
        setLoading(true)
        const response = await api.get('/api/workforce/enduring/email-digest/items')
        if (response.data.success) {
          setItems(response.data.items || [])
        }
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [authLoading, session.firebaseId])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session.firebaseId) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true
    return item.status.toLowerCase() === filter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/workforce/enduring/email-digest" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <EmailDigestSidebar />
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/workforce/enduring/email-digest"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to Email Digest
        </Link>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Item Catalogue</h1>
            <p className="text-gray-600">Create and manage reusable email digest items</p>
          </div>
          <Link
            href="/workforce/enduring/email-digest/items/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Item
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'ready'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ready ({items.filter((i) => i.status === 'READY').length})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'draft'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Draft ({items.filter((i) => i.status === 'DRAFT').length})
            </button>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="h-16 w-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first digest item to get started. Items can be reused across multiple editions.
            </p>
            <Link
              href="/workforce/enduring/email-digest/items/new"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const content = item.formattedContent as any
              const statusColors = {
                READY: 'bg-green-100 text-green-800',
                DRAFT: 'bg-yellow-100 text-yellow-800',
                ARCHIVED: 'bg-gray-100 text-gray-800',
              }

              return (
                <Link
                  key={item.id}
                  href={`/workforce/enduring/email-digest/items/${item.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        statusColors[item.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.sourceType && (
                      <span className="text-xs text-gray-500">{item.sourceType}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {content?.title || 'Untitled Item'}
                  </h3>
                  {content?.body && (
                    <p
                      className="text-sm text-gray-600 line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: content.body.substring(0, 150) + '...',
                      }}
                    />
                  )}
                  <div className="mt-4 pt-4 border-t flex justify-between text-xs text-gray-500">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.updatedAt && item.updatedAt !== item.createdAt && (
                      <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}
