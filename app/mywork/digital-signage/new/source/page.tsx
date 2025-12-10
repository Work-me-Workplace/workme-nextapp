'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Database, Award, FileText, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

const sourceTypes = [
  { 
    value: 'workstuff', 
    name: 'From Work Stuff', 
    icon: Database, 
    description: 'Select from existing workforce items, milestones, or signals' 
  },
  { 
    value: 'highlight', 
    name: 'From Employee Highlight', 
    icon: Award, 
    description: 'Create from an existing employee highlight' 
  },
  { 
    value: 'manual', 
    name: 'Manual Entry', 
    icon: FileText, 
    description: 'Enter information manually' 
  },
  { 
    value: 'ai', 
    name: 'AI Generation', 
    icon: Sparkles, 
    description: 'Provide raw content and let AI create the signage' 
  },
]

export default function DigitalSignageSourcePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const signType = searchParams?.get('type')

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

  const handleSourceSelect = (source: string) => {
    if (!signType) {
      router.push('/mywork/digital-signage/new')
      return
    }

    if (source === 'workstuff') {
      router.push(`/mycompany/workforcestuff?select=true&signType=${signType}`)
    } else if (source === 'highlight') {
      router.push(`/mycompany/highlights?select=true&signType=${signType}`)
    } else if (source === 'ai') {
      router.push(`/mywork/digital-signage/builder/new?type=${signType}&source=ai`)
    } else {
      // Manual entry
      router.push(`/mywork/digital-signage/builder/new?type=${signType}&source=manual`)
    }
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
              <button
                onClick={() => router.push('/mywork/digital-signage/new')}
                className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
              >
                ← Back to Sign Type Selection
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Where is the content from?</h1>
              <p className="text-gray-600 mt-2">Choose how you want to create this digital signage</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sourceTypes.map(source => {
                const Icon = source.icon
                return (
                  <button
                    key={source.value}
                    onClick={() => handleSourceSelect(source.value)}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500 text-left"
                  >
                    <Icon className="h-10 w-10 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{source.name}</h3>
                    <p className="text-sm text-gray-600">{source.description}</p>
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
