'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Ship, Calendar, Plus, Package } from 'lucide-react'

interface Milestone {
  id: string
  title: string
  description: string | null
  date: string | null
  milestoneType: string | null
}

interface Unit {
  id: string
  hullNumber: string
  name: string | null
  shipyard: string | null
  lifecycleStatus: string | null
  description: string | null
  nextMilestoneExpected: string | null
  platformProduct: {
    id: string
    name: string
  }
  milestones: Milestone[]
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
        <div className="mb-4">
          <Link
            href={`/company/products/platform/${unit.platformProduct.id}`}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Back to {unit.platformProduct.name}
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-center mb-6">
            <Ship className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{unit.hullNumber}</h1>
              {unit.name && (
                <p className="text-gray-600 mt-1">{unit.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {unit.shipyard && (
              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Shipyard</p>
                  <p className="text-gray-900 font-medium">{unit.shipyard}</p>
                </div>
              </div>
            )}
            {unit.lifecycleStatus && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Lifecycle Status</p>
                  <p className="text-gray-900 font-medium">{unit.lifecycleStatus}</p>
                </div>
              </div>
            )}
            {unit.nextMilestoneExpected && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Next Milestone Expected</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(unit.nextMilestoneExpected).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {unit.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700">{unit.description}</p>
            </div>
          )}
        </div>

        {/* Milestones Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Milestones ({unit.milestones.length})</h2>
            <Link
              href={`/company/products/milestones/new?platformUnitId=${unit.id}`}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Link>
          </div>

          {unit.milestones.length > 0 ? (
            <div className="space-y-4">
              {unit.milestones.map(milestone => (
                <div
                  key={milestone.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                      {milestone.description && (
                        <p className="text-gray-600 mb-2">{milestone.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {milestone.date && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(milestone.date).toLocaleDateString()}
                          </span>
                        )}
                        {milestone.milestoneType && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {milestone.milestoneType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-600 mb-4">No milestones yet</p>
              <Link
                href={`/company/products/milestones/new?platformUnitId=${unit.id}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Add First Milestone
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
