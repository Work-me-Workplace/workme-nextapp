'use client'

import Link from 'next/link'
import { use, useState, useEffect } from 'react'
import { getEmailDigestProduct } from '@/lib/actions/email-digest'

export default function EmailDigestEditionsPage({ params }: { params: Promise<{ emailDigestId: string }> }) {
  const { emailDigestId } = use(params)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
        <Link href={`/workforce/enduring/email-digest/${emailDigestId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to Product
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Editions: {product.title}</h1>
        </div>

        <div className="space-y-4">
          {product.editions && product.editions.length > 0 ? (
            product.editions.map((edition: any) => (
              <Link
                key={edition.id}
                href={`/workforce/enduring/email-digest/${emailDigestId}/editions/${edition.id}`}
                className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Edition from {new Date(edition.generatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Generated: {new Date(edition.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(edition.generatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No editions yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

