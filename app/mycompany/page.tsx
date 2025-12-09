'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Users, TrendingUp, Award } from 'lucide-react'

export default function MyCompanyHubPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthReady(true)
        const id = getWorkMeIdFromStorage()
        if (id) {
          setWorkMeId(id)
        } else {
          router.push('/signin')
        }
      } else {
        router.push('/signin')
      }
    })

    return () => unsubscribe()
  }, [router])

  if (!authReady || !workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const modules = [
    {
      name: 'Workforce Stuff',
      description: 'Events, training, benefits, campaigns, and all company happenings',
      path: '/mycompany/workforcestuff',
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'hover:border-blue-500',
    },
    {
      name: 'Company Milestones',
      description: 'Track and celebrate important company achievements and milestones',
      path: '/mycompany/milestones',
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'hover:border-green-500',
    },
    {
      name: 'Employee Highlights',
      description: 'Recognize and showcase employee achievements, awards, and accomplishments',
      path: '/mycompany/highlights',
      icon: Award,
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'hover:border-purple-500',
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
              <h1 className="text-3xl font-bold text-gray-900">MyCompany</h1>
              <p className="text-gray-600 mt-2">Manage company-wide content, events, and recognition</p>
            </div>

            {/* Module Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {modules.map((module) => {
                const Icon = module.icon
                return (
                  <Link
                    key={module.path}
                    href={module.path}
                    className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent ${module.borderColor}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-3 ${module.bgColor} rounded-lg`}>
                          <Icon className={`h-6 w-6 ${module.iconColor}`} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 ml-3">{module.name}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                    <span className={`${module.iconColor} font-medium text-sm`}>
                      Open {module.name} →
                    </span>
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

