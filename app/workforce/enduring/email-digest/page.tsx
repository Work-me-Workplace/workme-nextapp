'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getEmailDigestProducts } from '@/lib/actions/email-digest'

export default function EmailDigestListPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const result = await getEmailDigestProducts()
      if (result.success) {
        setProducts(result.products)
      }
      setLoading(false)
    }
    fetchProducts()
  }, [])

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Digest Series</h1>
          <p className="text-gray-600">Manage your recurring email digest series and editions</p>
          <p className="text-xs text-blue-600 mt-1">📍 Direct URL: /workforce/enduring/email-digest</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/workforce/enduring/email-digest/${product.id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{product.title}</h3>
                {product.description && (
                  <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                )}
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{product._count.editions} editions</span>
              </div>
            </Link>
          ))}

          {/* Create New Product Card */}
          <Link
            href="/workforce/enduring/email-digest/new"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center min-h-[200px]"
          >
            <div className="text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-gray-600 font-medium">Create New Series</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

