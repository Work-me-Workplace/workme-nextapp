'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Calendar } from 'lucide-react'

export default function DailyOutlookPage() {
  const router = useRouter()
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

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarNav />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Daily Outlook</h1>
            <p className="text-gray-600 mt-2">Your daily work planning and assignments</p>
          </div>

          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Outlook Coming Soon</h3>
            <p className="text-gray-600 mb-4">This feature is under development.</p>
            <Link
              href="/workops/overall"
              className="inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              Go to Overall Outlook →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

