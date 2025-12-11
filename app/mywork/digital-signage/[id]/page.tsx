'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import api from '@/lib/api'
import { Monitor, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface DigitalSignage {
  id: string
  signType: string
  companyUnit?: string | null
  createdAt: string
  workforceAchievement?: {
    personName: string
    unit?: string | null
    achievement: string
    details?: string | null
    photoUrl?: string | null
  } | null
  workforce?: {
    title: string
    summary?: string | null
    bullets: string[]
    imageUrl?: string | null
    footerNote?: string | null
  } | null
  companyNews?: {
    headline: string
    subheadline?: string | null
    body?: string | null
    link?: string | null
    thumbnail?: string | null
  } | null
  companyEvent?: {
    eventName: string
    eventDate?: string | null
    startTime?: string | null
    endTime?: string | null
    location?: string | null
    description?: string | null
    perks: string[]
    registrationLink?: string | null
  } | null
}

export default function DigitalSignageViewPage() {
  const router = useRouter()
  const params = useParams()
  const signageId = params?.id as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [signage, setSignage] = useState<DigitalSignage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadSignage()
      }
    }
  }, [router, signageId])

  async function loadSignage() {
    if (!signageId) return

    try {
      setLoading(true)
      const response = await api.get(`/api/digital-signage/${signageId}`)
      
      if (response.data.success && response.data.signage) {
        setSignage(response.data.signage)
      } else {
        setError(response.data.error || 'Failed to load digital signage')
      }
    } catch (err: any) {
      console.error('Failed to load digital signage:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load digital signage')
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

  if (error || !signage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Digital signage not found'}
          </div>
          <Link href="/mywork" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            ← Back to MyWork
          </Link>
        </div>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/mywork"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to MyWork
            </Link>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Digital Signage</h1>
                    <p className="text-blue-100">{signage.signType.replace('_', ' ')}</p>
                  </div>
                  <Monitor className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="px-8 py-6">
                {signage.workforceAchievement && (
                  <div className="space-y-6">
                    {signage.workforceAchievement.photoUrl && (
                      <div className="text-center">
                        <img 
                          src={signage.workforceAchievement.photoUrl} 
                          alt={signage.workforceAchievement.personName}
                          className="mx-auto rounded-full w-32 h-32 object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {signage.workforceAchievement.personName}
                      </h2>
                      {signage.workforceAchievement.unit && (
                        <p className="text-gray-600 mb-4">{signage.workforceAchievement.unit}</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Achievement</h3>
                      <p className="text-gray-700 text-lg">{signage.workforceAchievement.achievement}</p>
                    </div>
                    {signage.workforceAchievement.details && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Details</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{signage.workforceAchievement.details}</p>
                      </div>
                    )}
                  </div>
                )}

                {signage.workforce && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{signage.workforce.title}</h2>
                      {signage.workforce.summary && (
                        <p className="text-gray-700 text-lg mb-4">{signage.workforce.summary}</p>
                      )}
                    </div>
                    {signage.workforce.bullets.length > 0 && (
                      <div>
                        <ul className="list-disc list-inside space-y-2">
                          {signage.workforce.bullets.map((bullet, index) => (
                            <li key={index} className="text-gray-700">{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {signage.workforce.imageUrl && (
                      <div>
                        <img 
                          src={signage.workforce.imageUrl} 
                          alt={signage.workforce.title}
                          className="w-full rounded-lg"
                        />
                      </div>
                    )}
                    {signage.workforce.footerNote && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600">{signage.workforce.footerNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {signage.companyNews && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {signage.companyNews.headline}
                      </h2>
                      {signage.companyNews.subheadline && (
                        <p className="text-xl text-gray-600 mb-4">{signage.companyNews.subheadline}</p>
                      )}
                    </div>
                    {signage.companyNews.thumbnail && (
                      <div>
                        <img 
                          src={signage.companyNews.thumbnail} 
                          alt={signage.companyNews.headline}
                          className="w-full rounded-lg"
                        />
                      </div>
                    )}
                    {signage.companyNews.body && (
                      <div>
                        <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                          {signage.companyNews.body}
                        </p>
                      </div>
                    )}
                    {signage.companyNews.link && (
                      <div>
                        <a 
                          href={signage.companyNews.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Learn More →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {signage.companyEvent && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {signage.companyEvent.eventName}
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {signage.companyEvent.eventDate && (
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="text-lg font-medium text-gray-900">
                            {new Date(signage.companyEvent.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {(signage.companyEvent.startTime || signage.companyEvent.endTime) && (
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="text-lg font-medium text-gray-900">
                            {signage.companyEvent.startTime && signage.companyEvent.endTime
                              ? `${signage.companyEvent.startTime} - ${signage.companyEvent.endTime}`
                              : signage.companyEvent.startTime || signage.companyEvent.endTime}
                          </p>
                        </div>
                      )}
                      {signage.companyEvent.location && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="text-lg font-medium text-gray-900">{signage.companyEvent.location}</p>
                        </div>
                      )}
                    </div>
                    {signage.companyEvent.description && (
                      <div>
                        <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                          {signage.companyEvent.description}
                        </p>
                      </div>
                    )}
                    {signage.companyEvent.perks.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Perks</h3>
                        <ul className="list-disc list-inside space-y-2">
                          {signage.companyEvent.perks.map((perk, index) => (
                            <li key={index} className="text-gray-700">{perk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {signage.companyEvent.registrationLink && (
                      <div>
                        <a 
                          href={signage.companyEvent.registrationLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          Register Now →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t text-sm text-gray-500">
                  <p>Created {new Date(signage.createdAt).toLocaleDateString()}</p>
                  {signage.companyUnit && <p>Unit: {signage.companyUnit}</p>}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

