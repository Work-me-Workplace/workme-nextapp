'use client'

import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Mail, Monitor, Image, FileText, MessageSquare, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

const productTypes = [
  {
    id: 'email_digest',
    name: 'Email Digest',
    icon: Mail,
    description: 'Create a weekly email digest with this impact event',
    createPath: (sourceId: string, sourceType: string) => `/workforce/enduring/email-digest/new?sourceId=${sourceId}&sourceType=${sourceType}`,
  },
  {
    id: 'digital_signage',
    name: 'Digital Signage',
    icon: Monitor,
    description: 'Create a digital sign to display this impact event',
    createPath: (sourceId: string, sourceType: string) => `/mywork/digital-signage/new?sourceId=${sourceId}&sourceType=${sourceType}`,
  },
  {
    id: 'flyer_poster',
    name: 'Flyer / Poster',
    icon: Image,
    description: 'Create a flyer or poster for this impact event',
    createPath: (sourceId: string, sourceType: string) => `/mywork/products/builder/new?type=flyer_poster&sourceId=${sourceId}&sourceType=${sourceType}`,
  },
  {
    id: 'senior_leader_email',
    name: 'Senior Leader Email',
    icon: FileText,
    description: 'Create a senior leader email about this impact event',
    createPath: (sourceId: string, sourceType: string) => `/mywork/seniorleader/build?sourceId=${sourceId}&sourceType=${sourceType}`,
  },
  {
    id: 'comms_plan',
    name: 'Comms Plan',
    icon: MessageSquare,
    description: 'Create a communications plan for this impact event',
    createPath: (sourceId: string, sourceType: string) => `/mywork/products/comms-plan/new?sourceId=${sourceId}&sourceType=${sourceType}`,
  },
]

function CreateProductContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const itemId = params?.id as string
  const sourceType = searchParams?.get('sourceType') || 'impact'

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

  const handleProductSelect = (productType: typeof productTypes[0]) => {
    const createPath = productType.createPath(itemId, sourceType)
    router.push(createPath)
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <div className="mb-8">
              <Link
                href={`/mycompany/workforcestuff/${itemId}`}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4 text-sm"
              >
                ← Back to Impact Event
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Create Product from Impact Event</h1>
              <p className="text-gray-600 mt-2">Choose a product type to create from this impact event</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {productTypes.map(productType => {
                const Icon = productType.icon
                return (
                  <button
                    key={productType.id}
                    onClick={() => handleProductSelect(productType)}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500 text-left group"
                  >
                    <Icon className="h-10 w-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{productType.name}</h3>
                    <p className="text-sm text-gray-600">{productType.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function CreateProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CreateProductContent />
    </Suspense>
  )
}

