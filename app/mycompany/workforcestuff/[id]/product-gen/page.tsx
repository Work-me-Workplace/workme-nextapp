'use client'

import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { WORK_PRODUCT_TYPE_OPTIONS } from '@/lib/workproduct.config'

export const dynamic = 'force-dynamic'

interface WorkforceStuffItem {
  id: string
  type: string
  title: string
  description?: string | null
  summary?: string | null
  effectiveDate?: string | null
  impactedPopulation?: string | null
  urgency?: string | null
  location?: string | null
  [key: string]: any
}

function ProductGenContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [item, setItem] = useState<WorkforceStuffItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const itemId = params?.id as string

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
      loadItem()
    }
  }, [router, itemId])

  async function loadItem() {
    try {
      setLoading(true)
      setError(null)
      
      // API uses authenticated user's companyId - no need to pass it
      const response = await api.get(`/api/workforcestuff/${itemId}`)
      
      if (response.data.success && response.data.item) {
        setItem(response.data.item)
      } else {
        setError('Failed to load workforce item')
      }
    } catch (error: any) {
      console.error('Failed to load workforce item:', error)
      setError(error.response?.data?.error || 'Failed to load workforce item')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (productType: (typeof WORK_PRODUCT_TYPE_OPTIONS)[0]) => {
    if (!item) return
    const createPath = productType.createPath(item.id, item.type, undefined)
    router.push(createPath)
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
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

        <div className="flex">
          <SidebarNav />
          <main className="flex-1">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800">{error || 'Workforce item not found'}</p>
                <Link
                  href={`/mycompany/workforcestuff/${itemId}`}
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700"
                >
                  ← Back to Detail Page
                </Link>
              </div>
            </div>
          </main>
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

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href={`/mycompany/workforcestuff/${itemId}`}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to work item (source + product options)
            </Link>

            {/* Workforce Stuff Blurb */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-500">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded uppercase mb-2">
                  {item.type === 'impact' ? 'IMPACT EVENT' : item.type.toUpperCase()}
                </span>
                {item.urgency && (
                  <span className="inline-block ml-2 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded uppercase">
                    {item.urgency} URGENCY
                  </span>
                )}
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h1>
              
              {(item.description || item.summary) && (
                <div className="prose max-w-none mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {item.description || item.summary}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                {item.effectiveDate && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Effective Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(item.effectiveDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {item.impactedPopulation && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Who It Affects</p>
                    <p className="text-sm font-semibold text-gray-900">{item.impactedPopulation}</p>
                  </div>
                )}
                {item.location && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900">{item.location}</p>
                  </div>
                )}
                {item.urgency && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Urgency</p>
                    <p className="text-sm font-semibold text-gray-900">{item.urgency}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Selection */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Which product would you like to create?</h2>
              <p className="text-gray-600">Select a product type to generate from this workforce item</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {WORK_PRODUCT_TYPE_OPTIONS.filter((productType) => {
                if (!productType.allowedSourceTypes) return true
                return productType.allowedSourceTypes.includes(item.type)
              }).map((productType) => {
                const Icon = productType.icon
                return (
                  <button
                    key={productType.id}
                    onClick={() => handleProductSelect(productType)}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500 text-left group"
                  >
                    <Icon className="h-10 w-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{productType.name}</h3>
                    <p className="text-sm text-gray-600">{productType.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ProductGenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProductGenContent />
    </Suspense>
  )
}

