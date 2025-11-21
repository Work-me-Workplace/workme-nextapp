'use client'

import Link from 'next/link'
import { use, useState, useEffect } from 'react'
import { getWorkforceCommsEditions, getWorkforceCommsProduct } from '@/lib/actions/workforce-comms'

export default function EditionsHistoryPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params)
  const [product, setProduct] = useState<any>(null)
  const [editions, setEditions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [productResult, editionsResult] = await Promise.all([
        getWorkforceCommsProduct(productId),
        getWorkforceCommsEditions(productId),
      ])

      if (productResult.success && productResult.product) {
        setProduct(productResult.product)
      }

      if (editionsResult.success && editionsResult.editions) {
        setEditions(editionsResult.editions)
      }

      setLoading(false)
    }
    fetchData()
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <Link href={`/workforce-comms/${productId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to Product
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edition History - {product?.name || 'Loading...'}
          </h1>
          <p className="text-gray-600">View all generated editions</p>
        </div>

        {editions.length > 0 ? (
          <div className="space-y-4">
            {editions.map((edition) => (
              <Link
                key={edition.editionId}
                href={`/workforce-comms/${productId}/editions/${edition.editionId}`}
                className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{edition.subject}</h3>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(edition.createdAt).toLocaleDateString()} at {new Date(edition.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {edition.sentAt ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Sent {new Date(edition.sentAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                      Draft
                    </span>
                  )}
                </div>
                <div className="text-gray-600 text-sm line-clamp-2">
                  {edition.body.substring(0, 200)}...
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No editions yet. Generate your first edition from a draft.</p>
          </div>
        )}
      </div>
    </div>
  )
}

