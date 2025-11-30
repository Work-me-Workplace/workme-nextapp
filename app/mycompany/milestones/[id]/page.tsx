'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import SidebarNav from '@/components/mywork/SidebarNav'
import { TrendingUp, FileText, Plus, Calendar, ExternalLink } from 'lucide-react'

interface Milestone {
  id: string
  title: string
  description?: string
  date?: string | null
  sourceUrl?: string | null
  createdAt: string
}

export default function MilestoneDetailPage() {
  const params = useParams()
  const milestoneId = params?.id as string

  // TODO: Load milestone data
  const milestoneData: Milestone | null = null

  if (!milestoneData) {
    return (
      <div className="min-h-screen bg-gray-50">
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
            </div>
          </div>
        </nav>

        <div className="flex">
          <SidebarNav />
          <main className="flex-1">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">Milestone not found</p>
                <Link href="/mycompany/milestones" className="text-blue-600 hover:text-blue-700">
                  ← Back to Milestones
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/mycompany/milestones" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
              ← Back to Milestones
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              {/* TypeScript workaround: milestoneData is always null in current implementation */}
              {milestoneData ? (() => {
                const milestone = milestoneData as Milestone
                return (
                  <>
                    <div className="flex items-center mb-4">
                      <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-500">
                        {milestone.date ? new Date(milestone.date).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{milestone.title}</h1>
                    {milestone.description && (
                      <div className="prose max-w-none mb-6">
                        <p className="text-gray-700">{milestone.description}</p>
                      </div>
                    )}

                    {milestone.sourceUrl && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <ExternalLink className="h-5 w-5 text-gray-500 mr-2" />
                          <a
                            href={milestone.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View Source
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                )
              })() : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Milestone data will be loaded here</p>
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-6 border-t">
                <Link
                  href={`/mywork/create?sourceId=${milestoneId}&sourceType=milestone`}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Work Output from This
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

