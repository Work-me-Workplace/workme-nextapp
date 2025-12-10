'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { useEventHydration } from '@/lib/hooks/useEventHydration'
import SidebarNav from '@/components/mywork/SidebarNav'
import { EVENT_CATEGORY_OPTIONS } from '@/config/event-category'

export default function EventsLandingPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [companyUnit, setCompanyUnit] = useState<string | null>(null)

  // Hydrate events - loads instantly from localStorage
  const { events, eventRouters, hydrated, loading: eventsLoading, refresh: refreshEvents } = useEventHydration(companyUnit)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      const storedCompanyUnit = localStorage.getItem('companyUnit')
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        if (storedCompanyUnit) {
          setCompanyUnit(storedCompanyUnit)
        }
      }
    }
  }, [router])

  // Auto-hydrate when companyUnit is available
  useEffect(() => {
    if (companyUnit && !hydrated && !eventsLoading) {
      refreshEvents()
    }
  }, [companyUnit, hydrated, eventsLoading, refreshEvents])

  // Listen for refresh events
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleRefresh = () => {
      if (companyUnit) {
        refreshEvents()
      }
    }
    window.addEventListener('refreshEvents', handleRefresh)
    return () => window.removeEventListener('refreshEvents', handleRefresh)
  }, [companyUnit, refreshEvents])

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Map routers to events for display
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

  const formatDate = (date: Date | string | null) => {
    if (!date) return null
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
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

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <Link
                  href="/mywork"
                  className="text-blue-600 hover:text-blue-700 mb-2 inline-block text-sm"
                >
                  ← Back to WorkplaceSandbox
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <span className="text-3xl mr-3">🎉</span>
                  Events
                </h1>
                <p className="text-gray-600 mt-2">
                  {hydratedEvents.length > 0 
                    ? `${hydratedEvents.length} event${hydratedEvents.length === 1 ? '' : 's'} in your WorkplaceSandbox`
                    : 'Manage company events and gatherings'}
                </p>
              </div>
              <Link
                href="/mywork/context/new/event"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                + Add Event
              </Link>
            </div>

            {/* Events Grid */}
            {eventsLoading && !hydrated ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading events...</p>
              </div>
            ) : hydratedEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Events Yet</h2>
                <p className="text-gray-600 mb-6">Create your first event to get started</p>
                <Link
                  href="/mywork/context/new/event"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  + Create Your First Event
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hydratedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-blue-500"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                    {event.typedData?.theme && (
                      <p className="text-sm text-gray-500 italic mb-3">"{event.typedData.theme}"</p>
                    )}
                    {event.typedData?.eventDate && (
                      <p className="text-sm text-gray-600 mb-2">
                        📅 {formatDate(event.typedData.eventDate)}
                      </p>
                    )}
                    {event.typedData?.eventCategory && (
                      <p className="text-xs text-gray-500 mb-2">
                        {EVENT_CATEGORY_OPTIONS.find(opt => opt.value === event.typedData?.eventCategory)?.label || event.typedData.eventCategory}
                      </p>
                    )}
                    {event.typedData?.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.typedData.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-400">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/workforce/events/${event.id}/view`}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
