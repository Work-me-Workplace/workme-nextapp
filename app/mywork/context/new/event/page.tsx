'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import EventCreationFork from '@/components/events/EventCreationFork'
import EventManualForm from '@/components/events/EventManualForm'
import EventAIForm from '@/components/events/EventAIForm'
import EventTemplatePicker from '@/components/events/EventTemplatePicker'

type CreationMode = 'fork' | 'manual' | 'ai' | 'template'

export default function NewEventPage() {
  const router = useRouter()
  const [mode, setMode] = useState<CreationMode>('fork')
  const [workMeId, setWorkMeId] = useState<string | null>(null)

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

  const handleSelectMode = (selectedMode: 'manual' | 'ai' | 'template') => {
    setMode(selectedMode)
  }

  const handleBackToFork = () => {
    setMode('fork')
  }

  if (!workMeId) {
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/mywork/context/new" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to Context Types
        </Link>

        {mode === 'fork' && (
          <EventCreationFork onSelectMode={handleSelectMode} />
        )}

        {mode === 'manual' && (
          <EventManualForm onBack={handleBackToFork} />
        )}

        {mode === 'ai' && (
          <EventAIForm onBack={handleBackToFork} />
        )}

        {mode === 'template' && (
          <EventTemplatePicker onBack={handleBackToFork} />
        )}
      </div>
    </div>
  )
}
