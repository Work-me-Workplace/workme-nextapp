'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { TrendingUp, FileText, Plus, Calendar, ExternalLink, Sparkles, Loader2, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

interface Milestone {
  id: string
  title: string
  category: string | null
  milestoneType: string | null
  description?: string | null
  date?: string | null
  sourceUrl?: string | null
  createdAt: string
  newsArtifact?: {
    id: string
    headline: string | null
    sourceName: string | null
    sourceUrl: string | null
  } | null
  platformUnit?: {
    name: string | null
    hullNumber: string
    platformProduct?: {
      name: string
    }
  } | null
}

export default function MilestoneDetailPage() {
  const params = useParams()
  const router = useRouter()
  const milestoneId = params?.id as string
  
  const [milestoneData, setMilestoneData] = useState<Milestone | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedProductId, setGeneratedProductId] = useState<string | null>(null)

  useEffect(() => {
    loadMilestone()
  }, [milestoneId])

  async function loadMilestone() {
    try {
      setLoading(true)
      const response = await api.get('/api/company/milestones/list')
      
      if (response.data.success) {
        const milestone = response.data.milestones.find((m: Milestone) => m.id === milestoneId)
        setMilestoneData(milestone || null)
      }
    } catch (error) {
      console.error('Failed to load milestone:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateDigitalProduct() {
    if (!milestoneId) return
    
    try {
      setGenerating(true)
      const response = await api.post(`/api/company/milestones/${milestoneId}/generate-digital-product`, {
        companyUnit: null, // Can be customized later
      })
      
      if (response.data.success) {
        setGeneratedProductId(response.data.digitalSign.id)
        setTimeout(() => {
          router.push(`/mywork/digital-signage/${response.data.digitalSign.id}`)
        }, 2000)
      }
    } catch (error: any) {
      console.error('Failed to generate digital product:', error)
      alert(error.response?.data?.error || 'Failed to generate digital product')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
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
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading milestone...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

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
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {milestoneData.category && (
                  <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-50 rounded">
                    {milestoneData.category}
                  </span>
                )}
                {milestoneData.milestoneType && (
                  <span className="inline-block px-3 py-1 text-sm font-semibold text-purple-600 bg-purple-50 rounded">
                    {milestoneData.milestoneType}
                  </span>
                )}
                {milestoneData.date && (
                  <span className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(milestoneData.date).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-6">{milestoneData.title}</h1>

              {milestoneData.description && (
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 text-lg">{milestoneData.description}</p>
                </div>
              )}

              {milestoneData.platformUnit && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Platform Unit</h3>
                  <p className="text-gray-900">
                    {milestoneData.platformUnit.name || milestoneData.platformUnit.hullNumber}
                    {milestoneData.platformUnit.platformProduct && (
                      <span className="text-gray-600 ml-2">({milestoneData.platformUnit.platformProduct.name})</span>
                    )}
                  </p>
                </div>
              )}

              {milestoneData.newsArtifact && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">News Source</h3>
                  <p className="text-gray-900 font-medium mb-1">
                    {milestoneData.newsArtifact.headline || milestoneData.newsArtifact.sourceName || 'News Article'}
                  </p>
                  {milestoneData.newsArtifact.sourceUrl && (
                    <a
                      href={milestoneData.newsArtifact.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View original article
                    </a>
                  )}
                </div>
              )}

              {milestoneData.sourceUrl && !milestoneData.newsArtifact && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <ExternalLink className="h-5 w-5 text-gray-500 mr-2" />
                    <a
                      href={milestoneData.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Source
                    </a>
                  </div>
                </div>
              )}

              {generatedProductId && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Digital product generated! Redirecting...</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-6 border-t">
                <button
                  onClick={handleGenerateDigitalProduct}
                  disabled={generating}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Digital Product
                    </>
                  )}
                </button>
                
                <Link
                  href={`/mywork/create?sourceId=${milestoneId}&sourceType=milestone`}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Work Output
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

