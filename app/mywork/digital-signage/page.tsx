'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Monitor, Plus, ArrowLeft } from 'lucide-react'

interface DigitalSignageProduct {
  id: string
  signType: string
  companyUnit: string | null
  headline: string
  subhead: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export default function DigitalSignageListPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [products, setProducts] = useState<DigitalSignageProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      
      setWorkMeId(id)
      loadProducts()
    }
  }, [router])

  async function loadProducts() {
    try {
      setLoading(true)
      const response = await api.get('/api/mywork/digital-signage/list')
      
      if (response.data.success && response.data.products) {
        setProducts(response.data.products)
      } else {
        setProducts([])
      }
    } catch (error: any) {
      console.error('Failed to load digital signage:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId || loading) {
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
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <Link
                href="/mywork/products"
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4 text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Work Products
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Digital Signage</h2>
                  <p className="text-gray-600 mt-2">View and manage your digital signage products</p>
                </div>
                <Link
                  href="/mywork/digital-signage/new"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New
                </Link>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <Link
                    key={product.id}
                    href={`/mywork/digital-signage/${product.id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-300 overflow-hidden"
                  >
                    {product.imageUrl && (
                      <div className="w-full h-48 bg-gray-100 overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.headline}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Monitor className="h-6 w-6 text-purple-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.signType.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.headline}
                      </h3>
                      {product.subhead && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.subhead}
                        </p>
                      )}
                      {product.companyUnit && (
                        <p className="text-xs text-gray-500 mb-2">Unit: {product.companyUnit}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Created {new Date(product.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Digital Signage Yet</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first digital signage product.</p>
                <Link
                  href="/mywork/digital-signage/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Digital Signage
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
