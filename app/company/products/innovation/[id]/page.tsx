'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Sparkles, Target, Gauge, PlayCircle, Users, CheckCircle } from 'lucide-react'

interface InnovationProduct {
  id: string
  name: string
  description: string | null
  impactArea: string | null
  maturityLevel: string | null
  demoStatus: string | null
  partners: string[]
  benefits: string[]
}

export default function InnovationProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [product, setProduct] = useState<InnovationProduct | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workMeIdValue = getWorkMeIdFromStorage()
      if (!workMeIdValue) {
        router.push('/signin')
        return
      }
      
      setWorkMeId(workMeIdValue)
      loadProduct()
    }
  }, [id, router])

  async function loadProduct() {
    try {
      setLoading(true)
      const response = await api.get(`/api/company/products/innovation/${id}`)
      
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <Link href="/company/products" className="text-purple-600 hover:text-purple-700">
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
          className="text-purple-600 hover:text-purple-700 mb-4 inline-block text-sm"
        >
          ← Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Sparkles className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            </div>
          </div>

          {product.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {product.impactArea && (
              <div className="flex items-start">
                <Target className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Impact Area</p>
                  <p className="text-gray-900 font-medium">{product.impactArea}</p>
                </div>
              </div>
            )}

            {product.maturityLevel && (
              <div className="flex items-start">
                <Gauge className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Maturity Level</p>
                  <p className="text-gray-900 font-medium">{product.maturityLevel}</p>
                </div>
              </div>
            )}

            {product.demoStatus && (
              <div className="flex items-start">
                <PlayCircle className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Demo Status</p>
                  <p className="text-gray-900 font-medium">{product.demoStatus}</p>
                </div>
              </div>
            )}
          </div>

          {product.partners.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Partners</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.partners.map((partner, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                  >
                    {partner}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.benefits.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Benefits</h2>
              </div>
              <ul className="list-disc list-inside space-y-2">
                {product.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-gray-700">{benefit}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
