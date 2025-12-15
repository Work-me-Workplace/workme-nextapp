'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Package, Eye, Calendar, Plus, CheckSquare, Monitor } from 'lucide-react'

export default function MyWorkHubPage() {
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

  const workCards = [
    {
      title: 'Products',
      description: 'View and manage all your work products',
      icon: Package,
      href: '/mywork/products',
      color: 'blue',
    },
    {
      title: 'Active Work',
      description: 'See what you\'re currently working on',
      icon: CheckSquare,
      href: '/mywork/active',
      color: 'purple',
    },
    {
      title: 'Events',
      description: 'View and manage events',
      icon: Calendar,
      href: '/mywork/events',
      color: 'orange',
    },
  ]

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

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Work</h1>
              <p className="text-gray-600 mt-2">Your hub for building, viewing, and planning work products</p>
            </div>

            {/* Work Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workCards.map((card) => {
                const Icon = card.icon
                const colorClasses = {
                  blue: 'border-blue-500 hover:border-blue-600 bg-blue-50',
                  green: 'border-green-500 hover:border-green-600 bg-green-50',
                  purple: 'border-purple-500 hover:border-purple-600 bg-purple-50',
                  orange: 'border-orange-500 hover:border-orange-600 bg-orange-50',
                }
                const iconColorClasses = {
                  blue: 'text-blue-600',
                  green: 'text-green-600',
                  purple: 'text-purple-600',
                  orange: 'text-orange-600',
                }

                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className={`group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 border-l-4 ${colorClasses[card.color as keyof typeof colorClasses]} p-6 block`}
                  >
                    <div className="flex items-start">
                      <div className={`p-3 rounded-lg bg-white ${iconColorClasses[card.color as keyof typeof iconColorClasses]} group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition">
                          {card.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {card.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-700 transition">
                      <span>View →</span>
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
