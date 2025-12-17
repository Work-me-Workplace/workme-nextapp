'use client'

import Link from 'next/link'
import { use, useState, useEffect } from 'react'
import { getEmailDigestProduct, createEmailDigestEdition } from '@/lib/actions/email-digest'

export default function EmailDigestProductPage({ params }: { params: Promise<{ emailDigestId: string }> }) {
  const { emailDigestId } = use(params)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      const result = await getEmailDigestProduct(emailDigestId)
      if (result.success && result.product) {
        setProduct(result.product)
      }
      setLoading(false)
    }
    fetchProduct()
  }, [emailDigestId])

  const handleGenerateEdition = async () => {
    setGenerating(true)
    try {
      const result = await createEmailDigestEdition({ emailDigestId })
      if (result.success && result.edition) {
        // Redirect to edition detail page (curation will happen there)
        window.location.href = `/workforce/enduring/email-digest/${emailDigestId}/editions/${result.edition.id}`
      } else {
        alert('Failed to create edition: ' + (result.error || 'Unknown error'))
        setGenerating(false)
      }
    } catch (error) {
      console.error('Error creating edition:', error)
      alert('Failed to create edition')
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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

        <div className="mb-6">
          <button
            onClick={handleGenerateEdition}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          >
            {generating ? 'Generating...' : '+ Generate New Edition'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Editions</h2>
            <Link
              href={`/workforce/enduring/email-digest/${emailDigestId}/editions`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          {product.editions && product.editions.length > 0 ? (
            <div className="space-y-4">
              {product.editions.slice(0, 5).map((edition: any) => (
                <Link
                  key={edition.id}
                  href={`/workforce/enduring/email-digest/${emailDigestId}/editions/${edition.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Edition from {new Date(edition.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(edition.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No editions yet. Generate your first edition.</p>
          )}
        </div>
      </div>
    </div>
  )
}

