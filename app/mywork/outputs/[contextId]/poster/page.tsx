'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContext } from '@/lib/actions/work-context'
import { getWorkOutputsByContext, createWorkOutput, updateWorkOutput } from '@/lib/actions/work-output'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId'

export default function PosterOutputPage() {
  const router = useRouter()
  const params = useParams()
  const contextId = params.contextId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [workContext, setWorkContext] = useState<any>(null)
  const [workOutput, setWorkOutput] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    callToAction: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadData()
      }
    }
  }, [contextId, router])

  async function loadData() {
    if (!contextId) return
    setLoading(true)
    try {
      const contextResult = await getWorkContext(contextId)
      if (contextResult.success && contextResult.workContext) {
        setWorkContext(contextResult.workContext)
      } else {
        alert('WorkContext not found')
        router.push('/mywork/context')
        return
      }

      const outputsResult = await getWorkOutputsByContext(contextId)
      if (outputsResult.success) {
        const posterOutput = outputsResult.workOutputs?.find((o: any) => o.outputType === 'poster')
        if (posterOutput) {
          setWorkOutput(posterOutput)
          const data = posterOutput.dataJson as any
          if (data) {
            setFormData({
              title: data.title || '',
              content: data.content || '',
              callToAction: data.callToAction || '',
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      router.push('/mywork/context')
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!workMeId) return
    setSaving(true)
    try {
      const dataJson = {
        title: formData.title,
        content: formData.content,
        callToAction: formData.callToAction,
      }

      if (workOutput) {
        const result = await updateWorkOutput(workOutput.id, { dataJson })
        if (result.success) {
          alert('Poster output saved!')
          loadData()
        } else {
          alert('Failed to save: ' + (result.error || 'Unknown error'))
        }
      } else {
        const result = await createWorkOutput({
          contextId,
          outputType: 'poster',
          dataJson,
        })
        if (result.success && result.workOutput) {
          alert('Poster output created!')
          setWorkOutput(result.workOutput)
        } else {
          alert('Failed to create: ' + (result.error || 'Unknown error'))
        }
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save')
    }
    setSaving(false)
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workContext) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href={`/mywork/outputs/${contextId}`} 
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to WorkOutputs
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🖼️</span>
            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded capitalize">
              {workContext.type}
            </span>
            <span className="text-sm text-gray-500">{workContext.title}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Poster Output</h1>
          <p className="text-gray-600 mt-1">Design a poster or flyer for this context</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Poster Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Poster headline"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Poster content and details..."
              />
            </div>

            <div>
              <label htmlFor="callToAction" className="block text-sm font-medium text-gray-700 mb-2">
                Call to Action
              </label>
              <input
                type="text"
                id="callToAction"
                value={formData.callToAction}
                onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Register now, Learn more, Contact us"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : workOutput ? 'Update Poster' : 'Create Poster'}
              </button>
              <Link
                href={`/mywork/outputs/${contextId}`}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

