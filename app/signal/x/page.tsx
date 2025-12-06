'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Twitter, Settings, Eye } from 'lucide-react'

export default function XFeedLandingPage() {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const xFeedOptions = [
    {
      name: 'Tune X Feed',
      description: 'Select organizations, people, and hashtags to follow',
      path: '/signal/x/tune',
      icon: Settings,
      color: 'purple',
    },
    {
      name: 'View Feed',
      description: 'Live signals from organizations, people, and hashtags you follow',
      path: '/signal/x/feed',
      icon: Eye,
      color: 'purple',
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
              <Link href="/signal" className="text-purple-600 hover:text-purple-800 text-sm mb-4 inline-block">
                ← Back to Signals
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <Twitter className="h-8 w-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900">X Feed</h1>
              </div>
              <p className="text-gray-600 mb-6">Live Twitter/X feed signals</p>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What do you want to do?</h2>
            </div>

            {/* X Feed Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {xFeedOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Link
                    key={option.path}
                    href={option.path}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-purple-500 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-lg bg-purple-100 text-purple-600 border-purple-200 group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                        Available
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{option.name}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                    <div className="mt-4 text-purple-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to start →
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

