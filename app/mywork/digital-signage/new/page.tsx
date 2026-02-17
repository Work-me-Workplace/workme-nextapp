'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Users, Newspaper, Award, Calendar, PenLine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import api from '@/lib/api'

export const dynamic = 'force-dynamic'

type SignageCard = {
  value: string
  name: string
  icon: LucideIcon
  description: string
  source?: string
}

/** Four categories with explainers. Workforce includes both team updates and company events. */
const categories: { id: string; label: string; explainer: string; cards: SignageCard[] }[] = [
  {
    id: 'workforce',
    label: 'Workforce & events',
    explainer: 'Team updates, initiatives, and company events. Use this for anything people-focused: announcements, events, gatherings, or registration.',
    cards: [
      {
        value: 'WORKFORCE',
        name: 'Workforce update',
        icon: Users,
        description: 'General workforce communications, team initiatives, and updates',
      },
      {
        value: 'COMPANY_EVENT',
        name: 'Company event',
        icon: Calendar,
        description: 'Upcoming events, gatherings, and registration',
      },
    ],
  },
  {
    id: 'achievements',
    label: 'Achievements',
    explainer: 'Recognize people and awards. Pull from existing employee highlights or enter manually.',
    cards: [
      {
        value: 'WORKFORCE_ACHIEVEMENT',
        name: 'Employee recognition',
        icon: Award,
        description: 'Recognize employee achievements and awards',
      },
    ],
  },
  {
    id: 'news',
    label: 'News',
    explainer: 'Company announcements and news. You can start from a milestone, platform update, or write your own.',
    cards: [
      {
        value: 'COMPANY_NEWS',
        name: 'Company news',
        icon: Newspaper,
        description: 'Company announcements and news',
      },
    ],
  },
  {
    id: 'own',
    label: 'Just add my own',
    explainer: 'Start from scratch. Enter your own headline and content—no template required.',
    cards: [
      {
        value: 'WORKFORCE',
        name: 'Start from scratch',
        icon: PenLine,
        description: 'Freeform content; we’ll use a simple workforce-style layout',
        source: 'manual',
      },
    ],
  },
]

function DigitalSignageNewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const highlightId = searchParams?.get('highlightId')
  const sourceId = searchParams?.get('sourceId')
  const sourceType = searchParams?.get('sourceType')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
      }
    }
  }, [router])

  // Auto-generate from workforce stuff if sourceId is provided
  useEffect(() => {
    if (sourceId && sourceType && workMeId && !generating) {
      generateFromWorkforceStuff()
    }
  }, [sourceId, sourceType, workMeId])

  async function generateFromWorkforceStuff() {
    if (!sourceId || !sourceType) return

    try {
      setGenerating(true)
      setError(null)
      
      const response = await api.post(
        `/api/workforcestuff/${sourceId}/generate-digital-signage?type=${sourceType}`
      )

      if (response.data.success && response.data.signage) {
        // Redirect to the created signage
        router.push(`/mywork/digital-signage/${response.data.signage.id}?saved=true`)
      } else {
        setError(response.data.error || 'Failed to generate digital signage')
      }
    } catch (err: any) {
      console.error('Failed to generate digital signage from workforce stuff:', err)
      setError(err.response?.data?.error || err.message || 'Failed to generate digital signage')
      setGenerating(false)
    }
  }

  const handleSelect = (type: string, source?: string) => {
    const params = new URLSearchParams()
    params.set('type', type)
    if (source) params.set('source', source)
    if (highlightId && type === 'WORKFORCE_ACHIEVEMENT') params.set('highlightId', highlightId)
    router.push(`/mywork/digital-signage/builder/new?${params.toString()}`)
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show loading/error state when generating from workforce stuff
  if (generating || (sourceId && sourceType)) {
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
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow p-12 text-center">
                {error ? (
                  <>
                    <p className="text-red-600 mb-4 font-semibold">{error}</p>
                    <button
                      onClick={() => {
                        setError(null)
                        setGenerating(false)
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Choose manually instead
                    </button>
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating digital signage from workforce item...</p>
                  </>
                )}
              </div>
            </div>
          </main>
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
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <Link
                href="/mywork"
                className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
              >
                ← Back to MyWork
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Create Digital Signage</h1>
              <p className="text-gray-600 mt-2 max-w-xl">
                Digital signs run on screens around the building. Choose what you’re creating so we can use the right layout and options.
              </p>
            </div>

            <div className="space-y-10">
              {categories.map((section) => (
                <section key={section.id} className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{section.label}</h2>
                    <p className="text-sm text-gray-600 mt-1">{section.explainer}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {section.cards.map((card) => {
                      const Icon = card.icon
                      return (
                        <button
                          key={card.value + (card.source ?? '')}
                          onClick={() => handleSelect(card.value, card.source)}
                          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition border border-gray-200 hover:border-blue-400 text-left group"
                        >
                          <Icon className="h-9 w-9 text-blue-600 mb-3 group-hover:text-blue-700" />
                          <h3 className="font-semibold text-gray-900 mb-1">{card.name}</h3>
                          <p className="text-sm text-gray-600">{card.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DigitalSignageNewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DigitalSignageNewContent />
    </Suspense>
  )
}
