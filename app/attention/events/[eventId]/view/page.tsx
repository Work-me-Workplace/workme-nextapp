'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useEventHydration } from '@/lib/hooks/useEventHydration'
import { EVENT_AUDIENCE_OPTIONS } from '@/config/event-audience'
import { EVENT_CATEGORY_OPTIONS } from '@/config/event-category'

export default function EventViewPage() {
  const router = useRouter()
  const params = useParams()
  const eventRouterId = params.eventId as string

  // Get companyId from localStorage (hydrated by AuthProvider)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [event, setEvent] = useState<any>(null)
  const [routerData, setRouterData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use hydration hook
  const { hydrated, refresh: refreshEvents } = useEventHydration(companyId)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCompanyId = localStorage.getItem('companyId')
      if (storedCompanyId) {
        setCompanyId(storedCompanyId)
      }
    }
  }, [])

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventRouterId) return

      setLoading(true)
      setError(null)

      try {
        // Try localStorage first (instant load)
        const stored = localStorage.getItem(`event_${eventRouterId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          setRouterData(parsed.router)
          setEvent(parsed.event)
          setLoading(false)
          
          // Refresh in background
          refreshFromAPI()
          return
        }

        // If not in localStorage, fetch from API
        await refreshFromAPI()
      } catch (err: any) {
        console.error('Error loading event:', err)
        setError(err.response?.data?.error || err.message || 'Failed to load event')
        setLoading(false)
      }
    }

    const refreshFromAPI = async () => {
      try {
        const response = await api.get(`/api/context/${eventRouterId}`)
        
        if (response.data.success && response.data.workContext) {
          const workContext = response.data.workContext
          setRouterData(workContext)
          
          if (workContext.typedData && workContext.type === 'event') {
            setEvent(workContext.typedData)
            
            // Store in localStorage for next time
            localStorage.setItem(`event_${eventRouterId}`, JSON.stringify({
              router: workContext,
              event: workContext.typedData,
            }))
          }
        } else {
          setError('Event not found')
        }
      } catch (err: any) {
        console.error('Error fetching event from API:', err)
        setError(err.response?.data?.error || 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    if (eventRouterId) {
      loadEvent()
    }
  }, [eventRouterId])

  // Refresh events list after viewing
  useEffect(() => {
    if (companyId && hydrated && event) {
      refreshEvents() // Refresh events list to keep it in sync
    }
  }, [companyId, hydrated, event, refreshEvents])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !event || !routerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The event you are looking for does not exist.'}</p>
          <Link
            href="/mywork"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back to WorkplaceSandbox
          </Link>
        </div>
      </div>
    )
  }

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

  const formatTime = (time: string | null) => {
    if (!time) return null
    return time
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
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/mywork"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to WorkplaceSandbox
        </Link>

        {/* Event Header */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title || 'Untitled Event'}</h1>
              {event.theme && (
                <p className="text-xl text-gray-600 italic">"{event.theme}"</p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/attention/events/${eventRouterId}/promo/new`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                + Add Promotional Product
              </Link>
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {event.eventDate && (
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">Date</span>
                  <span className="text-lg text-gray-900">{formatDate(event.eventDate)}</span>
                </div>
              )}

              {(event.startTime || event.endTime) && (
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">Time</span>
                  <span className="text-lg text-gray-900">
                    {formatTime(event.startTime) || 'TBD'} 
                    {event.endTime && ` – ${formatTime(event.endTime)}`}
                  </span>
                </div>
              )}

              {event.eventCategory && (
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">Category</span>
                  <span className="text-lg text-gray-900">
                    {EVENT_CATEGORY_OPTIONS.find(opt => opt.value === event.eventCategory)?.label || event.eventCategory}
                  </span>
                </div>
              )}

              {event.audience && (
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">Audience</span>
                  <span className="text-lg text-gray-900">
                    {EVENT_AUDIENCE_OPTIONS.find(opt => opt.value === event.audience)?.label || event.audience}
                  </span>
                </div>
              )}

              {event.vibe && (
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">Vibe</span>
                  <span className="text-lg text-gray-900">{event.vibe}</span>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {event.description && (
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">Description</span>
                  <p className="text-gray-900 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {event.registrationRequired && (
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">Registration</span>
                  <span className="text-lg text-gray-900">{event.registrationRequired}</span>
                  {event.registrationLink && (
                    <a
                      href={event.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm block mt-1"
                    >
                      Register →
                    </a>
                  )}
                </div>
              )}

              {event.foodProvided && (
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">Food</span>
                  <span className="text-lg text-gray-900">{event.foodProvided}</span>
                  {event.foodTypes && (
                    <span className="text-gray-600 block mt-1">{event.foodTypes}</span>
                  )}
                </div>
              )}

              {event.pocEmail && (
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">Contact</span>
                  <a href={`mailto:${event.pocEmail}`} className="text-blue-600 hover:text-blue-700">
                    {event.pocEmail}
                  </a>
                  {event.pocPhone && (
                    <span className="text-gray-600 block">{event.pocPhone}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Arrays */}
          {event.speakers && event.speakers.length > 0 && (
            <div className="mt-6">
              <span className="block text-sm font-medium text-gray-500 mb-2">Speakers</span>
              <ul className="list-disc list-inside space-y-1">
                {event.speakers.map((speaker: string, idx: number) => (
                  <li key={idx} className="text-gray-900">{speaker}</li>
                ))}
              </ul>
            </div>
          )}

          {event.perks && event.perks.length > 0 && (
            <div className="mt-6">
              <span className="block text-sm font-medium text-gray-500 mb-2">Perks</span>
              <ul className="list-disc list-inside space-y-1">
                {event.perks.map((perk: string, idx: number) => (
                  <li key={idx} className="text-gray-900">{perk}</li>
                ))}
              </ul>
            </div>
          )}

          {event.participation && event.participation.length > 0 && (
            <div className="mt-6">
              <span className="block text-sm font-medium text-gray-500 mb-2">Participation</span>
              <ul className="list-disc list-inside space-y-1">
                {event.participation.map((item: string, idx: number) => (
                  <li key={idx} className="text-gray-900">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Promotional Products Section */}
        {event.promotionalWorkItems && event.promotionalWorkItems.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Promotional Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.promotionalWorkItems.map((promo: any) => (
                <Link
                  key={promo.id}
                  href={`/attention/events/${eventRouterId}/promo/${promo.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow transition"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{promo.name}</h3>
                  <p className="text-sm text-gray-600">{promo.type}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Event Items Section */}
        {event.eventItems && event.eventItems.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agenda Items</h2>
            <div className="space-y-4">
              {event.eventItems.map((item: any) => (
                <div key={item.id} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-gray-600">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
