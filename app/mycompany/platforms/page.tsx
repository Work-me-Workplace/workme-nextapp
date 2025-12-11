'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Ship, Plus } from 'lucide-react'

interface Platform {
  id: string
  name: string
  category: string | null
  programCode: string | null
  programStatus: string | null
  currentProgressEstimate: number | null
  intendedTotalUnits: number | null
}

export default function PlatformsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      
      setWorkMeId(id)
      loadPlatforms()
    }
  }, [router])

  async function loadPlatforms() {
    try {
      setLoading(true)
      const response = await api.get('/api/company/products/platform/list')
      
      if (response.data.success && response.data.products) {
        setPlatforms(response.data.products)
      } else {
        setPlatforms([])
      }
    } catch (error) {
      console.error('Failed to load platforms:', error)
      setPlatforms([])
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
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Company Platforms</h1>
                <p className="text-gray-600 mt-2">Track major company platforms, capabilities, and external pressures.</p>
              </div>
              <Link
                href="/mycompany/platforms/create"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Platform
              </Link>
            </div>

            {platforms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {platforms.map(platform => (
                  <Link
                    key={platform.id}
                    href={`/mycompany/platforms/${platform.id}`}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex items-center mb-3">
                      <Ship className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-xs font-medium text-gray-500 uppercase">Platform</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{platform.name}</h3>
                    {platform.category && (
                      <p className="text-sm text-gray-600 mb-1">Category: {platform.category}</p>
                    )}
                    {platform.programCode && (
                      <p className="text-sm text-gray-600 mb-1">Program: {platform.programCode}</p>
                    )}
                    {platform.programStatus && (
                      <p className="text-sm font-medium text-gray-900 mt-2">
                        Status: <span className="text-blue-600">{platform.programStatus}</span>
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      {platform.intendedTotalUnits && (
                        <span>Units: {platform.intendedTotalUnits}</span>
                      )}
                      {platform.currentProgressEstimate !== null && (
                        <span>Progress: {platform.currentProgressEstimate}%</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center border-2 border-dashed border-gray-200">
                <Ship className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Platforms Yet</h3>
                <p className="text-gray-600 mb-6">Create your first platform to begin tracking company capability lines.</p>
                <Link
                  href="/mycompany/platforms/create"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Create Platform
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
