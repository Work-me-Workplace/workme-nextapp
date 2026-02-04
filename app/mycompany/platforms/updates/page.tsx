'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { RefreshCw, Plus, Ship, Calendar, Filter } from 'lucide-react'

interface UnitUpdate {
  id: string
  statusUpdate: string | null
  percentComplete: number | null
  scheduleNote: string | null
  narrativeSummary: string | null
  seaTrialsStartDate: string | null
  deliveryDate: string | null
  commissioningDate: string | null
  createdAt: string
  platformUnit: {
    id: string
    hullNumber: string
    name: string | null
    platformProduct: {
      id: string
      name: string
    }
  }
  statement: {
    headline: string | null
    sourceName: string | null
  } | null
}

export default function PlatformUnitUpdatesPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [updates, setUpdates] = useState<UnitUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadUpdates()
      }
    }
  }, [router, filterStatus])

  async function loadUpdates() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('statusUpdate', filterStatus)
      
      const response = await api.get(`/api/company/products/platform/unit/updates/list?${params.toString()}`)
      
      if (response.data.success) {
        setUpdates(response.data.updates || [])
      }
    } catch (error) {
      console.error('Failed to load updates:', error)
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform Unit Updates</h1>
                <p className="text-gray-600 mt-2">
                  All platform unit updates across all units. Track progress, milestones, and status changes.
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center gap-4">
                <Filter className="h-5 w-5 text-gray-500" />
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Builder's Trials">Builder's Trials</option>
                    <option value="Sea Trials">Sea Trials</option>
                    <option value="Keel Laid">Keel Laid</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Commissioning">Commissioning</option>
                  </select>
                </div>
              </div>
            </div>

            {updates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <RefreshCw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Updates Yet</h3>
                <p className="text-gray-600 mb-6">Start tracking platform unit updates from the unit pages.</p>
                <Link
                  href="/mycompany/products"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  View Platforms
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((update) => (
                  <Link
                    key={update.id}
                    href={`/mycompany/platforms/${update.platformUnit.platformProduct.id}/units/${update.platformUnit.id}`}
                    className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Ship className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {update.platformUnit.name || update.platformUnit.hullNumber}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {update.platformUnit.platformProduct.name}
                          </span>
                        </div>
                        
                        {update.statusUpdate && (
                          <div className="mb-2">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {update.statusUpdate}
                            </span>
                          </div>
                        )}

                        {update.narrativeSummary && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{update.narrativeSummary}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {update.percentComplete !== null && (
                            <span>Progress: {update.percentComplete}%</span>
                          )}
                          {update.deliveryDate && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Delivery: {new Date(update.deliveryDate).toLocaleDateString()}
                            </span>
                          )}
                          {update.statement?.sourceName && (
                            <span>Source: {update.statement.sourceName}</span>
                          )}
                          <span>{new Date(update.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
