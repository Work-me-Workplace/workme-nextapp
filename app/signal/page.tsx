'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Search, FileText, Mail, Twitter, Newspaper, Radio } from 'lucide-react'

export default function SignalLandingPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        setLoading(false)
      }
    }
  }, [router])

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const signalTypes = [
    {
      name: 'Note Lookup',
      description: 'I heard this in a meeting - check if it\'s publicly verifiable',
      path: '/signal/note',
      icon: FileText,
      color: 'blue',
      available: true,
    },
    {
      name: 'Google Scan',
      description: 'Keyword-based web/news sweep',
      path: '/signal/google',
      icon: Search,
      color: 'green',
      available: true,
    },
    {
      name: 'X Feed',
      description: 'Live Twitter/X feed signals',
      path: '/signal/x',
      icon: Twitter,
      color: 'purple',
      available: true,
    },
    {
      name: 'Senior Email',
      description: 'SES/Flag email context extraction',
      path: '/signal/senior',
      icon: Mail,
      color: 'orange',
      available: false,
    },
    {
      name: 'Clip Parser',
      description: 'Parse CHINFO / curated news clips',
      path: '/signal/clip',
      icon: Newspaper,
      color: 'indigo',
      available: false,
    },
  ]

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Radio className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Signals</h1>
              </div>
              <p className="text-gray-600 mb-6">OSINT-based signal ingestion and verification</p>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What do you want to do?</h2>
            </div>

            {/* Signal Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {signalTypes.map((signal) => {
                const Icon = signal.icon
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600 border-blue-200',
                  green: 'bg-green-100 text-green-600 border-green-200',
                  purple: 'bg-purple-100 text-purple-600 border-purple-200',
                  orange: 'bg-orange-100 text-orange-600 border-orange-200',
                  indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
                }

                if (signal.available) {
                  return (
                    <Link
                      key={signal.path}
                      href={signal.path}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-500 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg ${colorClasses[signal.color as keyof typeof colorClasses]} group-hover:scale-110 transition-transform`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                          Available
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{signal.name}</h3>
                      <p className="text-sm text-gray-600">{signal.description}</p>
                      <div className="mt-4 text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to start →
                      </div>
                    </Link>
                  )
                }

                return (
                  <div
                    key={signal.path}
                    className="bg-white rounded-lg shadow p-6 opacity-60 border-2 border-gray-200 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${colorClasses[signal.color as keyof typeof colorClasses]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{signal.name}</h3>
                    <p className="text-sm text-gray-600">{signal.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

