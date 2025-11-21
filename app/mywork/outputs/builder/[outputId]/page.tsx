'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkOutput, updateWorkOutput } from '@/lib/actions/work-output'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function WorkOutputBuilderPage() {
  const router = useRouter()
  const params = useParams()
  const outputId = params.outputId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [workOutput, setWorkOutput] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadOutput()
      }
    }
  }, [outputId, router])

  async function loadOutput() {
    if (!outputId) return
    setLoading(true)
    try {
      const result = await getWorkOutput(outputId)
      if (result.success && result.workOutput) {
        setWorkOutput(result.workOutput)
      } else {
        alert('WorkOutput not found')
        router.push('/mywork')
      }
    } catch (error) {
      console.error('Failed to load output:', error)
      router.push('/mywork')
    }
    setLoading(false)
  }

  async function handleSave(data: any) {
    setSaving(true)
    try {
      const result = await updateWorkOutput(outputId, { dataJson: data })
      if (result.success) {
        alert('Saved successfully!')
        loadOutput()
      } else {
        alert('Failed to save: ' + JSON.stringify(result.error))
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

  if (!workOutput) {
    return null
  }

  const outputType = workOutput.outputType

  // Route to specific builder based on outputType
  if (outputType === 'ntk_snippet') {
    return <NTKSnippetBuilder output={workOutput} onSave={handleSave} saving={saving} />
  }

  // Generic builder for other types (placeholder)
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
          href={workOutput.supportId ? `/mywork/support/${workOutput.contextId}` : `/mywork/context/${workOutput.contextId}`}
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Builder: {outputType}</h1>
          <p className="text-gray-600 mb-6">Builder coming soon for this output type.</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-600 whitespace-pre-wrap">
              {JSON.stringify(workOutput.dataJson || {}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

// NTK Snippet Builder Component
function NTKSnippetBuilder({ output, onSave, saving }: { output: any; onSave: (data: any) => void; saving: boolean }) {
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    priority: 'normal',
    audience: '',
  })

  useEffect(() => {
    if (output.dataJson) {
      const data = output.dataJson as any
      setFormData({
        subject: data.subject || '',
        body: data.body || '',
        priority: data.priority || 'normal',
        audience: data.audience || '',
      })
    }
  }, [output])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(formData)
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
          href={output.supportId ? `/mywork/support/${output.contextId}` : `/mywork/context/${output.contextId}`}
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">NTK Snippet Builder</h1>
          <p className="text-gray-600 mb-6">Create workforce email content for Need to Know communications.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject Line *
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Important Update: Open Season Enrollment"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <input
                type="text"
                id="audience"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., All employees, Management team, Department X"
              />
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                Email Body *
              </label>
              <textarea
                id="body"
                required
                rows={12}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Enter the email content here..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Word count: {formData.body.split(/\s+/).filter(Boolean).length}
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => onSave({ ...formData, status: 'final' })}
                disabled={saving}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Final
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

