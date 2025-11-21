'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getWorkforceCommsProducts } from '@/lib/actions/workforce-comms'

export default function WorkforceCommsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const result = await getWorkforceCommsProducts()
      if (result.success) {
        setProducts(result.products)
      }
      setLoading(false)
    }
    fetchProducts()
  }, [])

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workforce Communications</h1>
          <p className="text-gray-600">Manage your communication products and drafts</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link
                key={product.workforceCommsId}
                href={`/workforce-comms/${product.workforceCommsId}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{product.type}</p>
                </div>
                {product.description && (
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{product._count.editions} editions</span>
                  <span>{product._count.drafts} drafts</span>
                </div>
                {product.editions && product.editions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-400">Latest: {product.editions[0].subject}</p>
                  </div>
                )}
              </Link>
            ))}

            {/* Create New Product Card */}
            <Link
              href="/workforce-comms/new"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center min-h-[200px]"
            >
              <div className="text-center">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-gray-600 font-medium">Create New Product</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

