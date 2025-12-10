'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Ship, Plus, Calendar, Package, FileText, TrendingUp } from 'lucide-react'
import NewsProcessor from '@/components/platform/NewsProcessor'

interface PlatformUnit {
  id: string
  hullNumber: string
  name: string | null
  shipyard: string | null
  lifecycleStatus: string | null
  description: string | null
  nextMilestoneExpected: string | null
}

interface PlatformStatement {
  id: string
  sourceName: string | null
  sourceUrl: string | null
  headline: string | null
  aiSummary: string | null
  aiTags: string[]
  createdAt: string
}

interface PlatformUpdate {
  id: string
  scheduleStatus: string | null
  costStatus: string | null
  narrativeSummary: string | null
  override_programStatus: string | null
  override_intendedTotalUnits: number | null
  override_currentProgressEstimate: number | null
  createdAt: string
  statement: {
    id: string
    headline: string | null
    sourceName: string | null
  } | null
}

interface PlatformProduct {
  id: string
  name: string
  category: string | null
  programCode: string | null
  description: string | null
  whySpecial: string | null
  nextDeliveryExpected: string | null
  lastDeliveryDate: string | null
  intendedTotalUnits: number | null
  programStatus: string | null
  currentProgressEstimate: number | null
  units: PlatformUnit[]
  statements: PlatformStatement[]
  updates: PlatformUpdate[]
}

export default function PlatformProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [product, setProduct] = useState<PlatformProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

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
  }, [id, router, refreshKey])

  async function loadProduct() {
    try {
      setLoading(true)
      const response = await api.get(`/api/company/products/platform/${id}`)
      
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <Link href="/company/products" className="text-blue-600 hover:text-blue-700">
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
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-center mb-4">
            <Ship className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              {product.category && (
                <p className="text-gray-600 mt-1">Category: {product.category}</p>
              )}
              {product.programCode && (
                <p className="text-gray-600">Program Code: {product.programCode}</p>
              )}
            </div>
          </div>

          {product.description && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          {product.whySpecial && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Why Special</h2>
              <p className="text-gray-700">{product.whySpecial}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {product.intendedTotalUnits && (
              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Intended Total Units</p>
                  <p className="text-gray-900 font-medium">{product.intendedTotalUnits}</p>
                </div>
              </div>
            )}
            {product.programStatus && (
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Program Status</p>
                  <p className="text-gray-900 font-medium">{product.programStatus}</p>
                </div>
              </div>
            )}
            {product.currentProgressEstimate !== null && (
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Progress Estimate</p>
                  <p className="text-gray-900 font-medium">{product.currentProgressEstimate}%</p>
                </div>
              </div>
            )}
            {product.nextDeliveryExpected && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Next Delivery Expected</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(product.nextDeliveryExpected).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {product.lastDeliveryDate && (
              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Last Delivery Date</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(product.lastDeliveryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* News Processing Section */}
        <div className="mb-6">
          <NewsProcessor
            platformProductId={product.id}
            onProcessed={() => {
              setRefreshKey((k) => k + 1)
            }}
          />
        </div>

        {/* Updates Section */}
        {product.updates.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Updates ({product.updates.length})</h2>
            <div className="space-y-4">
              {product.updates.map(update => (
                <div key={update.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      {update.statement && (
                        <p className="text-sm font-medium text-gray-900">
                          {update.statement.headline || 'Update'}
                        </p>
                      )}
                      {update.statement?.sourceName && (
                        <p className="text-xs text-gray-500">{update.statement.sourceName}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {update.narrativeSummary && (
                    <p className="text-sm text-gray-700 mb-3">{update.narrativeSummary}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {update.scheduleStatus && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        Schedule: {update.scheduleStatus}
                      </span>
                    )}
                    {update.costStatus && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                        Cost: {update.costStatus}
                      </span>
                    )}
                    {update.override_programStatus && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                        Status Override: {update.override_programStatus}
                      </span>
                    )}
                    {update.override_intendedTotalUnits !== null && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                        Units Override: {update.override_intendedTotalUnits}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statements Section */}
        {product.statements.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Statements ({product.statements.length})</h2>
            <div className="space-y-4">
              {product.statements.map(statement => (
                <div key={statement.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      {statement.headline && (
                        <p className="text-sm font-medium text-gray-900">{statement.headline}</p>
                      )}
                      {statement.sourceName && (
                        <p className="text-xs text-gray-500">{statement.sourceName}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(statement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {statement.aiSummary && (
                    <p className="text-sm text-gray-700 mb-2">{statement.aiSummary}</p>
                  )}
                  {statement.aiTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {statement.aiTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Units Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Units ({product.units.length})</h2>
            <div className="flex space-x-3">
              <Link
                href={`/company/products/milestones/new?platformProductId=${product.id}`}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Milestone
              </Link>
              <Link
                href={`/company/products/platform/${product.id}/unit/new`}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Unit
              </Link>
            </div>
          </div>

          {product.units.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.units.map(unit => (
                <Link
                  key={unit.id}
                  href={`/company/products/platform/unit/${unit.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{unit.hullNumber}</h3>
                  {unit.name && (
                    <p className="text-sm text-gray-600 mb-2">{unit.name}</p>
                  )}
                  {unit.shipyard && (
                    <p className="text-xs text-gray-500 mb-1">Shipyard: {unit.shipyard}</p>
                  )}
                  {unit.lifecycleStatus && (
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {unit.lifecycleStatus}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-600 mb-4">No units yet</p>
              <Link
                href={`/company/products/platform/${product.id}/unit/new`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Create First Unit
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
