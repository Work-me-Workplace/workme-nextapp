'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { FileText, MessageSquare, Monitor, Mail, Image, FileCheck } from 'lucide-react'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

const outputTypes = [
  { value: 'workforce_comms', name: 'Workforce Comms', icon: MessageSquare, description: 'Internal communications' },
  { value: 'digital_signage', name: 'Digital Signage', icon: Monitor, description: 'Digital display content' },
  { value: 'executive_email', name: 'Executive Email', icon: Mail, description: 'Executive-level emails' },
  { value: 'flyer_poster', name: 'Flyer / Poster', icon: Image, description: 'Print materials' },
]

export default function CreateOutputPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [step, setStep] = useState<'type' | 'source' | 'hydrate'>('type')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

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

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    // Route digital signage to dedicated flow
    if (type === 'digital_signage') {
      router.push('/mywork/digital-signage/new')
    } else {
      setStep('source')
    }
  }

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSource(sourceId)
    setStep('hydrate')
    // Navigate to output builder
    router.push(`/mywork/products/builder/new?type=${selectedType}&sourceId=${sourceId}`)
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
              <h1 className="text-3xl font-bold text-gray-900">Create Output</h1>
              <p className="text-gray-600 mt-2">Choose output type and source</p>
            </div>

            {step === 'type' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Choose Output Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outputTypes.map(type => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        onClick={() => handleTypeSelect(type.value)}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500 text-left"
                      >
                        <Icon className="h-8 w-8 text-blue-600 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{type.name}</h3>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 'source' && (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => setStep('type')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Back to Output Types
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Pick Source</h2>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Choose Company Stuff</h3>
                    <p className="text-sm text-gray-600 mb-4">Select from existing workforce items, milestones, or signals</p>
                    <Link
                      href={`/mycompany/workforcestuff?select=true&outputType=${selectedType}`}
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Browse Company Stuff
                    </Link>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Insert My Own</h3>
                    <p className="text-sm text-gray-600 mb-4">Create output from scratch without a source</p>
                    <button
                      onClick={() => router.push(`/mywork/products/builder/new?type=${selectedType}`)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                    >
                      Create from Scratch
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

