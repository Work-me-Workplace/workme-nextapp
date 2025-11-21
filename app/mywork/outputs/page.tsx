'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SidebarNav from '@/components/mywork/SidebarNav'
import { useAuth } from '@/lib/providers/AuthProvider'

// Static output type cards configuration
const outputTypes = [
  {
    value: 'workforce_comms_email',
    name: 'Workforce Comms Email',
    description: 'Internal workforce communications and email content',
    icon: '📧',
    route: '/mywork/outputs/email/new',
  },
  {
    value: 'messaging_talking_points',
    name: 'Messaging & Talking Points',
    description: 'Key messages and talking points for communications',
    icon: '💬',
    route: '/mywork/outputs/talking-points/new', // Placeholder - create later
  },
  {
    value: 'digital_product',
    name: 'Digital Product',
    description: 'Digital signage, web content, and online materials',
    icon: '💻',
    route: '/mywork/outputs/digital/new', // Placeholder - create later
  },
  {
    value: 'print_product',
    name: 'Print Product',
    description: 'Print materials, flyers, posters, and physical deliverables',
    icon: '🖨️',
    route: '/mywork/outputs/print/new', // Placeholder - create later
  },
  {
    value: 'sharepoint_update',
    name: 'SharePoint Update',
    description: 'SharePoint blocks and web publishing content',
    icon: '🔗',
    route: '/mywork/outputs/sharepoint/new', // Placeholder - create later
  },
  {
    value: 'photo_video_support',
    name: 'Photo & Video Support',
    description: 'Photography and videography deliverables',
    icon: '📸',
    route: '/mywork/outputs/photo-video/new', // Placeholder - create later
  },
]

export default function StandaloneOutputsListPage() {
  const router = useRouter()
  const { session, loading } = useAuth()

  // Redirect to signin if not authenticated
  if (!loading && !session.workMeId) {
    router.push('/signin')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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
        {/* Sidebar */}
        <SidebarNav />

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <Link
                href="/mywork"
                className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
              >
                ← Back to MyWork
              </Link>
              <h2 className="text-3xl font-bold text-gray-900">WorkOutputs</h2>
              <p className="text-gray-600 mt-2">Choose the type of output you want to create</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outputTypes.map((outputType) => (
                <Link
                  key={outputType.value}
                  href={outputType.route}
                  className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-center mb-4">
                    <div className="text-4xl mr-4">{outputType.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{outputType.name}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{outputType.description}</p>
                  <span className="text-blue-600 font-medium">Create →</span>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
