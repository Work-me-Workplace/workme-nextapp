'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

type CreationMode = 'fork' | 'scratch' | 'ai' | 'previous'

export default function PromotionalProductForkPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const [mode, setMode] = useState<CreationMode>('fork')

  const handleSelectMode = (selectedMode: 'scratch' | 'ai' | 'previous') => {
    setMode(selectedMode)
  }

  const handleBackToFork = () => {
    setMode('fork')
  }

  if (mode === 'scratch') {
    router.push(`/workforce/events/${eventId}/promo/new/scratch`)
    return null
  }

  if (mode === 'ai') {
    router.push(`/workforce/events/${eventId}/promo/new/ai`)
    return null
  }

  if (mode === 'previous') {
    router.push(`/workforce/events/${eventId}/promo/new/previous`)
    return null
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
        <button
          onClick={() => window.history.back()}
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Promotional Product</h2>
          <p className="text-gray-600 mb-6">How would you like to create your promotional product?</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              type="button"
              onClick={() => handleSelectMode('scratch')}
              className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-500 transition-all duration-200 bg-white"
            >
              <svg className="h-12 w-12 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-lg font-semibold text-gray-800">From Scratch</span>
              <p className="text-sm text-gray-500 text-center mt-1">Build manually with full control</p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('ai')}
              className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-green-500 transition-all duration-200 bg-white"
            >
              <svg className="h-12 w-12 text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-lg font-semibold text-gray-800">Paste Text (AI Assist)</span>
              <p className="text-sm text-gray-500 text-center mt-1">Paste event text and let AI structure it</p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('previous')}
              className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-purple-500 transition-all duration-200 bg-white"
            >
              <svg className="h-12 w-12 text-purple-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-lg font-semibold text-gray-800">Use Previous</span>
              <p className="text-sm text-gray-500 text-center mt-1">Start from a previous product</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

