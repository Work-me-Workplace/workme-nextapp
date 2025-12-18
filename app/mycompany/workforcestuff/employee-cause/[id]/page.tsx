'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Calendar, ExternalLink, Heart, Building } from 'lucide-react'

export default function EmployeeCauseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = getWorkMeIdFromStorage()
    if (!id) {
      router.push('/signin')
    } else {
      loadItem()
    }
  }, [params.id])

  async function loadItem() {
    try {
      const { default: api } = await import('@/lib/api')
      const response = await api.get(`/api/workforcestuff/employee-cause/${params.id}`)
      if (response.data.success) setItem(response.data.data)
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !item) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
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
            <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
              ← Back to Workforce Stuff
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <span className="text-xs font-medium text-gray-500 uppercase bg-pink-100 text-pink-800 px-2 py-1 rounded mb-3 inline-block">
                Employee Cause
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h1>
              
              {item.description && (
                <p className="text-gray-700 mb-6 whitespace-pre-wrap">{item.description}</p>
              )}

              {item.impactSummary && (
                <div className="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-600" />
                    Impact
                  </h3>
                  <p className="text-gray-700">{item.impactSummary}</p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {item.partnerOrg && (
                  <p className="text-sm flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    Partner: {item.partnerOrg}
                  </p>
                )}
                {(item.windowStart || item.windowEnd) && (
                  <div className="p-3 bg-gray-50 rounded">
                    {item.windowStart && (
                      <p className="text-sm"><Calendar className="inline h-4 w-4 mr-2"/>Start: {new Date(item.windowStart).toLocaleDateString()}</p>
                    )}
                    {item.windowEnd && (
                      <p className="text-sm"><Calendar className="inline h-4 w-4 mr-2"/>End: {new Date(item.windowEnd).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
              </div>

              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Learn More & Participate
                </a>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


