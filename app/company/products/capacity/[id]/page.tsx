'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Factory, MapPin, Tag, Wrench, AlertTriangle, TrendingUp, FileText } from 'lucide-react'

interface CapacityProduct {
  id: string
  name: string
  location: string | null
  contractorType: string | null
  capabilities: string[]
  constraints: string[]
  productionRate: string | null
  notes: string | null
}

export default function CapacityProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [product, setProduct] = useState<CapacityProduct | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      
      setWorkMeId(id)
      loadProduct()
    }
  }, [params.id, router])

  async function loadProduct() {
    try {
      setLoading(true)
      const response = await api.get(`/api/company/products/capacity/${params.id}`)
      
      if (response.data.success && response.data.product) {
        setProduct(response.data.product)
      } else {
        console.error('Failed to load product:', response.data.error)
      }
    } catch (error) {
      console.error('Failed to load product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <Link href="/company/products" className="text-green-600 hover:text-green-700">
            ← Back to Products
          </Link>
        </div>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/company/products"
          className="text-green-600 hover:text-green-700 mb-4 inline-block text-sm"
        >
          ← Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Factory className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {product.location && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-gray-900 font-medium">{product.location}</p>
                </div>
              </div>
            )}

            {product.contractorType && (
              <div className="flex items-start">
                <Tag className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Contractor Type</p>
                  <p className="text-gray-900 font-medium">{product.contractorType}</p>
                </div>
              </div>
            )}

            {product.productionRate && (
              <div className="flex items-start">
                <TrendingUp className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Production Rate</p>
                  <p className="text-gray-900 font-medium">{product.productionRate}</p>
                </div>
              </div>
            )}
          </div>

          {product.capabilities.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Wrench className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Capabilities</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.capabilities.map((capability, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.constraints.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Constraints</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.constraints.map((constraint, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                  >
                    {constraint}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.notes && (
            <div>
              <div className="flex items-center mb-3">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{product.notes}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
