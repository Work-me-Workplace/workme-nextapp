'use client'

import Link from 'next/link'
import { use, useState, useEffect } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/lib/providers/AuthProvider'

export default function EmailDigestProductPage({ params }: { params: Promise<{ emailDigestId: string }> }) {
  const { emailDigestId } = use(params)
  const { session, loading: authLoading } = useAuth()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      // Wait for auth to be ready
      if (authLoading || !session.firebaseId) {
        return
      }

      try {
        const response = await api.get(`/api/workforce/enduring/email-digest/${emailDigestId}`)
        const result = response.data
        if (result.success && result.product) {
          setProduct(result.product)
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [emailDigestId, authLoading, session.firebaseId])

  const handleGenerateEdition = async () => {
    setGenerating(true)
    try {
      const response = await api.post(`/api/workforce/enduring/email-digest/${emailDigestId}/editions`)
      const result = response.data
      if (result.success && result.edition) {
        // Redirect to edition detail page (curation will happen there)
        window.location.href = `/workforce/enduring/email-digest/${emailDigestId}/editions/${result.edition.id}`
      } else {
        alert('Failed to create edition: ' + (result.error || 'Unknown error'))
        setGenerating(false)
      }
    } catch (error: any) {
      console.error('Error creating edition:', error)
      alert('Failed to create edition: ' + (error.response?.data?.error || error.message))
      setGenerating(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!session.firebaseId) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <Link href="/workforce/enduring/email-digest" className="text-blue-600 hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/workforce/enduring/email-digest" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/workforce/enduring/email-digest" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to Products
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
          {product.description && <p className="text-gray-600">{product.description}</p>}
        </div>

        {/* Primary Actions */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/workforce/enduring/email-digest/items/new"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Item
          </Link>
          <Link
            href="/workforce/enduring/email-digest/items"
            className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-semibold inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            Browse Items
          </Link>
          <button
            onClick={handleGenerateEdition}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 inline-flex items-center ml-auto"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {generating ? 'Generating...' : 'Generate New Edition'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/workforce/enduring/email-digest/${emailDigestId}/editions`}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
            >
              <div className="flex items-center space-x-3">
                <svg className="h-8 w-8 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div>
                  <div className="font-semibold text-gray-900 group-hover:text-blue-700">View All Editions</div>
                  <div className="text-sm text-gray-600">Browse and manage editions</div>
                </div>
              </div>
            </Link>
            <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="font-semibold text-gray-700">Series Settings</div>
                  <div className="text-sm text-gray-500">Coming soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

