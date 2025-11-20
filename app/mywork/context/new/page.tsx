'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

const contextTypes = [
  {
    type: 'campaign',
    name: 'Campaign',
    description: 'Company campaign or initiative',
    icon: '📢',
    formPath: '/mywork/context/new/campaign',
  },
  {
    type: 'impact_event',
    name: 'Impact Event',
    description: 'Workforce impact event or change',
    icon: '⚡',
    formPath: '/mywork/context/new/impact-event',
  },
  {
    type: 'training',
    name: 'Training',
    description: 'Company training or learning program',
    icon: '📚',
    formPath: '/mywork/context/new/training',
  },
  {
    type: 'event',
    name: 'Event',
    description: 'Company event or gathering',
    icon: '🎉',
    formPath: '/mywork/context/new/event',
  },
  {
    type: 'community',
    name: 'Community Opportunity',
    description: 'Community engagement opportunity',
    icon: '🤝',
    formPath: '/mywork/context/new/community',
  },
]

export default function NewWorkContextPage() {
  const router = useRouter()

  if (typeof window !== 'undefined' && !getWorkMeIdFromStorage()) {
    router.push('/signin')
    return null
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/mywork/context" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to WorkContexts
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New WorkContext</h1>
          <p className="text-gray-600">Choose the type of work context you want to create</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contextTypes.map((contextType) => (
            <Link
              key={contextType.type}
              href={contextType.formPath}
              className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">{contextType.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{contextType.name}</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{contextType.description}</p>
              <span className="text-blue-600 font-medium">Create →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
