'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Ship, Plus, ArrowLeft, FileText, TrendingUp, Calendar, Package } from 'lucide-react'
import NewsProcessor from '@/components/platform/NewsProcessor'

interface PlatformUnit {
  id: string
  hullNumber: string
  name: string | null
  block: string | null
  shipyard: string | null
  status: string | null
  percentComplete: number | null
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

interface Platform {
  id: string
  name: string
  category: string | null
  programCode: string | null
  description: string | null
  whySpecial: string | null
  payloadNotes: string | null
  intendedTotalUnits: number | null
  programStatus: string | null
  currentProgressEstimate: number | null
  knownShipsInClass: string[]
  units: PlatformUnit[]
  statements: PlatformStatement[]
  updates: PlatformUpdate[]
}

export default function PlatformDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform | null>(null)
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
      loadPlatform()
    }
  }, [id, router, refreshKey])

  async function loadPlatform() {
    try {
      setLoading(true)
      const response = await api.get(`/api/company/products/platform/${id}`)
      
      if (response.data.success && response.data.product) {
        setPlatform(response.data.product)
      } else {
        console.error('Failed to load platform:', response.data.error)
      }
    } catch (error) {
      console.error('Failed to load platform:', error)
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

  if (!platform) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Platform not found</h2>
          <Link href="/mycompany/platforms" className="text-blue-600 hover:text-blue-700">
            ← Back to Platforms
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

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/mycompany/platforms"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Platforms
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column — Platform Overview */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-4">
                    <Ship className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{platform.name}</h1>
                      {platform.category && (
                        <p className="text-gray-600 text-sm">Category: {platform.category}</p>
                      )}
                      {platform.programCode && (
                        <p className="text-gray-600 text-sm">Program: {platform.programCode}</p>
                      )}
                    </div>
                  </div>

                  {platform.description && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-sm text-gray-700">{platform.description}</p>
                    </div>
                  )}

                  {platform.whySpecial && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Why Special</h3>
                      <p className="text-sm text-gray-700">{platform.whySpecial}</p>
                    </div>
                  )}

                  {platform.knownShipsInClass.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Known Ships</h3>
                      <div className="flex flex-wrap gap-2">
                        {platform.knownShipsInClass.map((ship, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700"
                          >
                            {ship}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                    {platform.currentProgressEstimate !== null && (
                      <div>
                        <p className="text-xs text-gray-500">Progress</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {platform.currentProgressEstimate}%
                        </p>
                      </div>
                    )}
                    {platform.intendedTotalUnits && (
                      <div>
                        <p className="text-xs text-gray-500">Total Units</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {platform.intendedTotalUnits}
                        </p>
                      </div>
                    )}
                    {platform.programStatus && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="text-sm font-medium text-blue-600">
                          {platform.programStatus}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column — Units, Statements, Updates */}
              <div className="lg:col-span-2 space-y-6">
                {/* Units Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Units in This Platform ({platform.units.length})
                    </h2>
                    <Link
                      href={`/mycompany/platforms/${platform.id}/units/create`}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Unit
                    </Link>
                  </div>

                  {platform.units.length > 0 ? (
                    <div className="space-y-3">
                      {platform.units.map(unit => (
                        <Link
                          key={unit.id}
                          href={`/mycompany/platforms/units/${unit.id}`}
                          className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{unit.hullNumber}</h3>
                              {unit.name && (
                                <p className="text-sm text-gray-600">{unit.name}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {unit.block && <span>Block: {unit.block}</span>}
                                {unit.shipyard && <span>Shipyard: {unit.shipyard}</span>}
                                {unit.status && <span>Status: {unit.status}</span>}
                              </div>
                            </div>
                            {unit.percentComplete !== null && (
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  {unit.percentComplete}%
                                </p>
                                <p className="text-xs text-gray-500">Complete</p>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">No units yet</p>
                      <Link
                        href={`/mycompany/platforms/${platform.id}/units/create`}
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        Create First Unit
                      </Link>
                    </div>
                  )}
                </div>

                {/* Platform Statements Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Platform Statements ({platform.statements.length})
                    </h2>
                    <Link
                      href={`/mycompany/platforms/${platform.id}/statements/add`}
                      className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Statement
                    </Link>
                  </div>

                  {platform.statements.length > 0 ? (
                    <div className="space-y-3">
                      {platform.statements.map(statement => (
                        <div
                          key={statement.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              {statement.headline && (
                                <h4 className="font-medium text-gray-900">{statement.headline}</h4>
                              )}
                              {statement.sourceName && (
                                <p className="text-xs text-gray-500 mt-1">{statement.sourceName}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(statement.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {statement.aiSummary && (
                            <p className="text-sm text-gray-700 mt-2">{statement.aiSummary}</p>
                          )}
                          {statement.aiTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
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
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No statements yet</p>
                  )}
                </div>

                {/* Platform Updates Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Platform Updates ({platform.updates.length})
                    </h2>
                  </div>

                  {platform.updates.length > 0 ? (
                    <div className="space-y-4">
                      {platform.updates.map(update => (
                        <div
                          key={update.id}
                          className="border-l-4 border-blue-500 pl-4 py-2"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              {update.statement && (
                                <h4 className="font-medium text-gray-900">
                                  {update.statement.headline || 'Update'}
                                </h4>
                              )}
                              {update.statement?.sourceName && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {update.statement.sourceName}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(update.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {update.narrativeSummary && (
                            <p className="text-sm text-gray-700 mt-2">{update.narrativeSummary}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
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
                                Status: {update.override_programStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No updates yet</p>
                  )}
                </div>

                {/* News Processor */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <NewsProcessor
                    platformProductId={platform.id}
                    onProcessed={() => {
                      setRefreshKey((k) => k + 1)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
