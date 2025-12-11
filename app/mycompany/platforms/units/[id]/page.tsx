'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Ship, ArrowLeft, Plus, Calendar, TrendingUp, FileText } from 'lucide-react'

interface Milestone {
  id: string
  milestoneType: string
  date: string | null
  description: string | null
  sourceUrl: string | null
  createdAt: string
}

interface Update {
  id: string
  statusUpdate: string | null
  percentComplete: number | null
  scheduleNote: string | null
  industrialBaseNote: string | null
  leadershipQuote: string | null
  narrativeSummary: string | null
  keelLaidDate: string | null
  seaTrialsStartDate: string | null
  deliveryDate: string | null
  commissioningDate: string | null
  createdAt: string
  statement: {
    id: string
    headline: string | null
    sourceName: string | null
  } | null
}

interface Statement {
  id: string
  headline: string | null
  sourceName: string | null
  sourceUrl: string | null
  rawText: string
  createdAt: string
}

interface Unit {
  id: string
  hullNumber: string
  name: string | null
  block: string | null
  shipyard: string | null
  status: string | null
  description: string | null
  percentComplete: number | null
  deliveryExpected: string | null
  commissioningDate: string | null
  platformProduct: {
    id: string
    name: string
  }
  milestones: Milestone[]
  updates: Update[]
  statements: Statement[]
}

export default function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workMeIdValue = getWorkMeIdFromStorage()
      if (!workMeIdValue) {
        router.push('/signin')
        return
      }
      
      setWorkMeId(workMeIdValue)
      loadUnit()
    }
  }, [id, router])

  async function loadUnit() {
    try {
      setLoading(true)
      const response = await api.get(`/api/company/products/platform/unit/${id}`)
      
      if (response.data.success && response.data.unit) {
        setUnit(response.data.unit)
      } else {
        console.error('Failed to load unit:', response.data.error)
      }
    } catch (error) {
      console.error('Failed to load unit:', error)
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

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unit not found</h2>
          <Link href="/mycompany/platforms" className="text-blue-600 hover:text-blue-700">
            ← Back to Platforms
          </Link>
        </div>
      </div>
    )
  }

  const milestoneTypeLabels: Record<string, string> = {
    CONTRACT_AWARDED: 'Contract Awarded',
    KEEL_LAYING: 'Keel Laying',
    HULL_COMPLETION: 'Hull Completion',
    LAUNCH: 'Launch',
    SEA_TRIALS: 'Sea Trials',
    DELIVERY: 'Delivery',
    COMMISSIONING: 'Commissioning',
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
            <div className="mb-6">
              <Link
                href={`/mycompany/platforms/${unit.platformProduct.id}`}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {unit.platformProduct.name}
              </Link>
            </div>

            {/* Unit Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{unit.hullNumber}</h1>
                  {unit.name && (
                    <p className="text-xl text-gray-600 mt-1">{unit.name}</p>
                  )}
                </div>
                {unit.percentComplete !== null && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{unit.percentComplete}%</p>
                    <p className="text-sm text-gray-500">Complete</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                {unit.block && (
                  <div>
                    <p className="text-xs text-gray-500">Block</p>
                    <p className="text-sm font-medium text-gray-900">{unit.block}</p>
                  </div>
                )}
                {unit.shipyard && (
                  <div>
                    <p className="text-xs text-gray-500">Shipyard</p>
                    <p className="text-sm font-medium text-gray-900">{unit.shipyard}</p>
                  </div>
                )}
                {unit.status && (
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium text-gray-900">{unit.status}</p>
                  </div>
                )}
                {unit.deliveryExpected && (
                  <div>
                    <p className="text-xs text-gray-500">Expected Delivery</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(unit.deliveryExpected).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {unit.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700">{unit.description}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Milestones Timeline */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Milestones ({unit.milestones.length})
                  </h2>
                </div>

                {unit.milestones.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                    
                    <div className="space-y-6">
                      {unit.milestones.map((milestone, idx) => (
                        <div key={milestone.id} className="relative pl-12">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1 w-8 h-8 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {milestoneTypeLabels[milestone.milestoneType] || milestone.milestoneType}
                              </h3>
                              {milestone.date && (
                                <span className="text-xs text-gray-500">
                                  {new Date(milestone.date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-gray-700">{milestone.description}</p>
                            )}
                            {milestone.sourceUrl && (
                              <a
                                href={milestone.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
                              >
                                View Source →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p>No milestones yet</p>
                  </div>
                )}
              </div>

              {/* Updates Feed */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Updates ({unit.updates.length})
                  </h2>
                  <Link
                    href={`/mycompany/platforms/units/${unit.id}/updates/create`}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Update
                  </Link>
                </div>

                {unit.updates.length > 0 ? (
                  <div className="space-y-4">
                    {unit.updates.map(update => (
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
                        {update.statusUpdate && (
                          <p className="text-sm font-medium text-blue-600 mt-2">
                            Status: {update.statusUpdate}
                          </p>
                        )}
                        {update.percentComplete !== null && (
                          <p className="text-sm text-gray-600 mt-1">
                            Progress: {update.percentComplete}%
                          </p>
                        )}
                        {update.industrialBaseNote && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Industrial Base:</span> {update.industrialBaseNote}
                          </p>
                        )}
                        {update.scheduleNote && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Schedule:</span> {update.scheduleNote}
                          </p>
                        )}
                        {update.leadershipQuote && (
                          <blockquote className="text-sm text-gray-700 italic mt-2 border-l-2 border-gray-300 pl-3">
                            "{update.leadershipQuote}"
                          </blockquote>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p>No updates yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Statements Feed */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Statements ({unit.statements.length})
              </h2>

              {unit.statements.length > 0 ? (
                <div className="space-y-3">
                  {unit.statements.map(statement => (
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
                      <p className="text-sm text-gray-700 mt-2 line-clamp-3">{statement.rawText}</p>
                      {statement.sourceUrl && (
                        <a
                          href={statement.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
                        >
                          View Source →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No statements yet</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
