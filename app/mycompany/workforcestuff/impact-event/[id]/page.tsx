'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Calendar, AlertCircle, Users, Mail, Phone } from 'lucide-react'

interface ImpactEvent {
  id: string
  title: string
  description: string | null
  effectiveDate: string | null
  impactedPopulation: string | null
  urgency: string | null
  pocFirstName: string | null
  pocLastName: string | null
  pocEmail: string | null
  pocPhone: string | null
  summary: string | null
  createdAt: string
}

export default function ImpactEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [event, setEvent] = useState<ImpactEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadEvent()
      }
    }
  }, [router, eventId])

  async function loadEvent() {
    try {
      setLoading(true)
      const { default: api } = await import('@/lib/api')
      const response = await api.get(`/api/workforcestuff/impact-event/${eventId}`)
      
      if (response.data.success) {
        setEvent(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load impact event:', error)
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

  if (!event) {
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
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">Impact event not found</p>
                <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700">
                  ← Back to Workforce Stuff
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const urgencyColors = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800',
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
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
              ← Back to Workforce Stuff
            </Link>

            <div className="bg-white rounded-lg shadow p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Impact Event
                    </span>
                    {event.urgency && (
                      <span className={`text-xs font-medium uppercase px-2 py-1 rounded ${urgencyColors[event.urgency as keyof typeof urgencyColors] || 'bg-gray-100 text-gray-800'}`}>
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        {event.urgency} Urgency
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                  {event.summary && (
                    <p className="text-gray-600 mt-2">{event.summary}</p>
                  )}
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {event.effectiveDate && (
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Effective Date</p>
                      <p className="font-semibold text-gray-900">{new Date(event.effectiveDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {event.impactedPopulation && (
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Impacted Population</p>
                      <p className="font-semibold text-gray-900">{event.impactedPopulation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Details</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                  </div>
                </div>
              )}

              {/* Point of Contact */}
              {(event.pocFirstName || event.pocLastName || event.pocEmail || event.pocPhone) && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Point of Contact</h3>
                  <div className="space-y-2">
                    {(event.pocFirstName || event.pocLastName) && (
                      <p className="text-gray-900 font-medium">
                        {[event.pocFirstName, event.pocLastName].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {event.pocEmail && (
                      <div className="flex items-center text-gray-700">
                        <Mail className="h-4 w-4 mr-2" />
                        <a href={`mailto:${event.pocEmail}`} className="text-blue-600 hover:text-blue-700">
                          {event.pocEmail}
                        </a>
                      </div>
                    )}
                    {event.pocPhone && (
                      <div className="flex items-center text-gray-700">
                        <Phone className="h-4 w-4 mr-2" />
                        <a href={`tel:${event.pocPhone}`} className="text-blue-600 hover:text-blue-700">
                          {event.pocPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-6 border-t text-sm text-gray-500">
                <p>Created: {new Date(event.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}



