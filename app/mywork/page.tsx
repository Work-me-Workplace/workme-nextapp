'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContexts } from '@/lib/actions/work-context'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { useEventHydration } from '@/lib/hooks/useEventHydration'
import SidebarNav from '@/components/mywork/SidebarNav'

const contextTypes = [
  {
    type: 'event',
    name: 'Event',
    description: 'Company event or gathering',
    icon: '🎉',
    formPath: '/mywork/context/new/event',
    color: 'blue',
  },
  {
    type: 'campaign',
    name: 'Campaign',
    description: 'Company campaign or initiative',
    icon: '📢',
    formPath: '/mywork/context/new/campaign',
    color: 'purple',
  },
  {
    type: 'training',
    name: 'Training',
    description: 'Company training or learning program',
    icon: '📚',
    formPath: '/mywork/context/new/training',
    color: 'green',
  },
  {
    type: 'impact_event',
    name: 'Impact',
    description: 'Things that impact you - disruptions affecting workforce',
    icon: '⚠️',
    formPath: '/mywork/context/new/impact-event',
    color: 'red',
  },
  {
    type: 'community',
    name: 'Community',
    description: 'Community engagement opportunity',
    icon: '🤝',
    formPath: '/mywork/context/new/community',
    color: 'orange',
  },
  {
    type: 'benefits',
    name: 'Benefits',
    description: 'Benefits enrollment window (e.g., Open Season)',
    icon: '🎁',
    formPath: '/mywork/context/new/benefits',
    color: 'pink',
  },
  {
    type: 'career',
    name: 'Career',
    description: 'Performance reviews, assessments, career development',
    icon: '📈',
    formPath: '/mywork/context/new/career',
    color: 'indigo',
  },
  {
    type: 'employee_cause',
    name: 'Cause',
    description: 'Employee-driven causes, drives, or donation campaigns',
    icon: '❤️',
    formPath: '/mywork/context/new/employee-cause',
    color: 'rose',
  },
]

export default function WorkplaceSandboxPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [allContexts, setAllContexts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Use event hydration hook for instant event loading
  const { events, eventRouters, hydrated: eventsHydrated, refresh: refreshEvents } = useEventHydration(companyId)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      const storedCompanyId = localStorage.getItem('companyId')
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        if (storedCompanyId) {
          setCompanyId(storedCompanyId)
        }
        loadContexts()
      }
    }
  }, [router])

  // Hydrate events when companyId is available
  useEffect(() => {
    if (companyId && !eventsHydrated) {
      refreshEvents()
    }
  }, [companyId, eventsHydrated, refreshEvents])

  // Listen for refresh events (when new event is created)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleRefresh = () => {
      if (companyId) {
        refreshEvents()
        loadContexts() // Also refresh other contexts
      }
    }
    window.addEventListener('refreshEvents', handleRefresh)
    return () => window.removeEventListener('refreshEvents', handleRefresh)
  }, [companyId, refreshEvents])

  async function loadContexts() {
    setLoading(true)
    try {
      const result = await getWorkContexts()
      if (result.success) {
        setAllContexts(result.workContexts || [])
      }
    } catch (error) {
      console.error('Failed to load contexts:', error)
    }
    setLoading(false)
  }

  // Merge hydrated events with other contexts
  const hydratedEvents = eventRouters.map((router) => {
    const event = events.find((e) => e.id === router.eventRefId)
    return {
      id: router.id,
      type: 'event',
      title: router.title || event?.title || 'Untitled Event',
      createdAt: router.createdAt,
      typedData: event,
      router,
    }
  })

  // Combine hydrated events with other contexts (excluding events)
  const nonEventContexts = allContexts.filter(ctx => ctx.type !== 'event')
  const allContextsWithHydratedEvents = [...hydratedEvents, ...nonEventContexts]

  // Group contexts by type
  const contextsByType = contextTypes.reduce((acc, typeDef) => {
    if (typeDef.type === 'event') {
      acc[typeDef.type] = hydratedEvents // Use hydrated events
    } else {
      acc[typeDef.type] = allContextsWithHydratedEvents.filter(ctx => ctx.type === typeDef.type)
    }
    return acc
  }, {} as Record<string, any[]>)

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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.clear()
                  router.push('/signin')
                }}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <SidebarNav />

        {/* Main Content - Sandbox Hub */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">WorkplaceSandbox</h1>
              <p className="text-gray-600 mt-2">Build and manage company-level happenings</p>
            </div>

            {/* Context Type Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {contextTypes.map((typeDef) => {
                const typeContexts = contextsByType[typeDef.type] || []
                const count = typeContexts.length

                return (
                  <div key={typeDef.type} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-3xl mr-3">{typeDef.icon}</span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{typeDef.name}</h3>
                          {count > 0 && (
                            <p className="text-sm text-gray-500">{count} {count === 1 ? 'item' : 'items'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{typeDef.description}</p>
                    
                    <Link
                      href={`/mywork/${typeDef.type}`}
                      className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Dive in
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Existing Contexts by Type */}
            {contextTypes.map((typeDef) => {
              const typeContexts = contextsByType[typeDef.type] || []
              
              if (typeContexts.length === 0) return null

              return (
                <div key={typeDef.type} id={`${typeDef.type}-section`} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <span className="text-2xl mr-2">{typeDef.icon}</span>
                      {typeDef.name} ({typeContexts.length})
                    </h2>
                    <Link
                      href={typeDef.formPath}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      + Add More
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeContexts.map((context) => {
                      // For events, link to the new view page
                      const viewUrl = context.type === 'event' 
                        ? `/attention/events/${context.id}/view`
                        : `/mywork/context/${context.id}`
                      
                      return (
                        <div
                          key={context.id}
                          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-blue-500"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{context.title || 'Untitled'}</h3>
                          {context.typedData?.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{context.typedData.description}</p>
                          )}
                          {context.type === 'event' && context.typedData?.theme && (
                            <p className="text-sm text-gray-500 italic mb-3">"{context.typedData.theme}"</p>
                          )}
                          {context.type === 'event' && context.typedData?.eventDate && (
                            <p className="text-xs text-gray-500 mb-2">
                              📅 {new Date(context.typedData.eventDate).toLocaleDateString()}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-4">
                            <p className="text-xs text-gray-400">
                              Created {new Date(context.createdAt).toLocaleDateString()}
                            </p>
                            <Link
                              href={viewUrl}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
                            >
                              View →
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Empty State */}
            {allContextsWithHydratedEvents.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">No happenings yet. Create your first one!</p>
                <Link
                  href="/mywork/context/new/event"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Create Your First Event
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
