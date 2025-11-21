'use client'

import Link from 'next/link'
import { use, useState, useEffect } from 'react'
import { getWorkforceCommsProduct } from '@/lib/actions/workforce-comms'

export default function WorkforceCommsProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProduct() {
      const result = await getWorkforceCommsProduct(productId)
      if (result.success && result.product) {
        setProduct(result.product)
      }
      setLoading(false)
    }
    fetchProduct()
  }, [productId])

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
          <Link href="/workforce-comms" className="text-blue-600 hover:underline">
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
              <Link href="/workforce-comms" className="flex items-center space-x-2">
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
        <Link href="/workforce-comms" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to Products
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          {product.description && (
            <p className="text-gray-600">{product.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Drafts Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Drafts</h2>
              <Link
                href={`/workforce-comms/${productId}/drafts/new`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                + New Draft
              </Link>
            </div>
            {product.drafts && product.drafts.length > 0 ? (
              <div className="space-y-4">
                {product.drafts.map((draft: any) => (
                  <Link
                    key={draft.draftId}
                    href={`/workforce-comms/${productId}/drafts/${draft.draftId}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">Draft</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Status: <span className="font-medium">{draft.status}</span>
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(draft.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No drafts yet. Create your first draft to get started.</p>
            )}
          </div>

          {/* Editions Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Editions</h2>
              <Link
                href={`/workforce-comms/${productId}/editions`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
            {product.editions && product.editions.length > 0 ? (
              <div className="space-y-4">
                {product.editions.slice(0, 5).map((edition: any) => (
                  <Link
                    key={edition.editionId}
                    href={`/workforce-comms/${productId}/editions/${edition.editionId}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{edition.subject}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {edition.sentAt ? `Sent: ${new Date(edition.sentAt).toLocaleDateString()}` : 'Not sent'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(edition.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No editions yet. Generate your first edition from a draft.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

