'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Calendar, MapPin, ExternalLink, Building } from 'lucide-react'

export default function CommunityDetailPage() {
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
      const response = await api.get(`/api/workforcestuff/community/${params.id}`)
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
              <span className="text-xs font-medium text-gray-500 uppercase bg-green-100 text-green-800 px-2 py-1 rounded mb-3 inline-block">
                Community Engagement
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h1>
              
              {item.description && (
                <p className="text-gray-700 mb-6 whitespace-pre-wrap">{item.description}</p>
              )}

              <div className="space-y-3 mb-6">
                {item.partnerOrg && (
                  <p className="text-sm flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    Partner: {item.partnerOrg}
                  </p>
                )}
                {item.date && (
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                )}
                {item.location && (
                  <p className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {item.location}
                  </p>
                )}
              </div>

              {item.signUpLink && (
                <a href={item.signUpLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Sign Up
                </a>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}



