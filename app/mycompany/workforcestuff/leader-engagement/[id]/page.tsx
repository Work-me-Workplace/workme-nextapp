'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Calendar, Clock, MapPin, User, Mail, Phone, ExternalLink } from 'lucide-react'

export default function LeaderEngagementDetailPage() {
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
      const response = await api.get(`/api/workforcestuff/leader-engagement/${params.id}`)
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
              <span className="text-xs font-medium text-gray-500 uppercase bg-blue-100 text-blue-800 px-2 py-1 rounded mb-3 inline-block">
                Leader Engagement
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h1>
              
              {item.description && (
                <p className="text-gray-700 mb-6 whitespace-pre-wrap">{item.description}</p>
              )}

              {(item.engagementDate || item.startTime || item.endTime) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
                  {item.engagementDate && (
                    <p className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date: {new Date(item.engagementDate).toLocaleDateString()}
                    </p>
                  )}
                  {(item.startTime || item.endTime) && (
                    <p className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time: {item.startTime || 'TBD'} {item.endTime && `- ${item.endTime}`}
                    </p>
                  )}
                </div>
              )}

              {item.location && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {item.location}
                  </p>
                </div>
              )}

              {item.leaderName && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <strong>{item.leaderName}</strong>
                    {item.leaderTitle && <span className="text-gray-600"> - {item.leaderTitle}</span>}
                  </p>
                </div>
              )}

              {item.topicAreas && item.topicAreas.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Topic Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.topicAreas.map((topic: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.registrationRequired && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Registration Required</p>
                  {item.registrationLink && (
                    <a 
                      href={item.registrationLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mt-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Register Here
                    </a>
                  )}
                </div>
              )}

              {(item.pocEmail || item.pocPhone) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Point of Contact</h3>
                  {item.pocEmail && (
                    <p className="text-sm flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${item.pocEmail}`} className="text-blue-600 hover:text-blue-700">
                        {item.pocEmail}
                      </a>
                    </p>
                  )}
                  {item.pocPhone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${item.pocPhone}`} className="text-blue-600 hover:text-blue-700">
                        {item.pocPhone}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {item.keyMessages && item.keyMessages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Messages</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {item.keyMessages.map((msg: string, idx: number) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.talkingPoints && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Talking Points</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.talkingPoints}</p>
                </div>
              )}

              {item.qAndAEnabled && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Q&A Session Enabled</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


