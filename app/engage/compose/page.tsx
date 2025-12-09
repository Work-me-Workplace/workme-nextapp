'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { FileText, Sparkles, Send } from 'lucide-react'
import api from '@/lib/api'

interface Template {
  id: string
  name: string
  body: string
}

interface Highlight {
  id: string
  achievement?: string | null
  citationText: string
  employees: Array<{
    employee: {
      fullName: string
    }
  }>
}

export default function ComposePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
  }, [router])

  // Handle highlightId from query params
  useEffect(() => {
    const highlightIdParam = searchParams.get('highlightId')
    if (highlightIdParam && highlights.length > 0 && !selectedHighlightId) {
      const highlight = highlights.find((h) => h.id === highlightIdParam)
      if (highlight) {
        setSelectedHighlightId(highlightIdParam)
        // Note: Template hydration will happen when template is selected
      }
    }
  }, [searchParams, highlights, selectedHighlightId])

  async function loadData() {
    try {
      setLoading(true)
      
      // Load templates
      const templatesRes = await api.get('/api/workengage/template')
      if (templatesRes.data.success) {
        setTemplates(templatesRes.data.data)
      }

      // Load highlights
      const highlightsRes = await api.get('/api/workengage/highlight')
      if (highlightsRes.data.success) {
        setHighlights(highlightsRes.data.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleInsertTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    setSelectedTemplateId(templateId)
    
    // If highlight is selected, hydrate the template
    if (selectedHighlightId) {
      await handleHydrateTemplate(template.body, selectedHighlightId)
    } else {
      setMessage(template.body)
    }
  }

  async function handleApplyHighlight(highlightId: string) {
    setSelectedHighlightId(highlightId)
    
    // If template is selected, hydrate it
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId)
      if (template) {
        await handleHydrateTemplate(template.body, highlightId)
      }
    }
  }

  async function handleHydrateTemplate(templateBody: string, highlightId: string) {
    try {
      const response = await api.post('/api/workengage/hydrate', {
        templateBody,
        highlightId,
      })
      
      if (response.data.success) {
        setMessage(response.data.data.hydrated)
      }
    } catch (error) {
      console.error('Failed to hydrate template:', error)
      // Fallback to just the template body
      setMessage(templateBody)
    }
  }

  async function handleSave() {
    if (!message.trim()) {
      alert('Please enter a message')
      return
    }

    try {
      setSaving(true)
      const response = await api.post('/api/workengage/compose', {
        message,
        templateId: selectedTemplateId,
        highlightId: selectedHighlightId,
      })

      if (response.data.success) {
        router.push('/engage/history')
      } else {
        alert('Failed to save message: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to save message:', error)
      alert('Failed to save message: ' + (error.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Compose</h1>
            <p className="text-gray-600 mb-8">Create an engagement message</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Templates */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
                  </div>
                  {templates.length === 0 ? (
                    <p className="text-sm text-gray-500">No templates available</p>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleInsertTemplate(template.id)}
                          className={`w-full text-left p-3 rounded border transition-all ${
                            selectedTemplateId === template.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <h3 className="font-medium text-sm text-gray-900 mb-1">
                            {template.name}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {template.body}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Highlights Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                  <div className="flex items-center mb-4">
                    <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">Highlights</h2>
                  </div>
                  {highlights.length === 0 ? (
                    <p className="text-sm text-gray-500">No highlights available</p>
                  ) : (
                    <div className="space-y-2">
                      {highlights.map((highlight) => (
                        <button
                          key={highlight.id}
                          onClick={() => handleApplyHighlight(highlight.id)}
                          className={`w-full text-left p-3 rounded border transition-all ${
                            selectedHighlightId === highlight.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <h3 className="font-medium text-sm text-gray-900 mb-1">
                            {highlight.employees[0]?.employee?.fullName || 'Employee'}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {highlight.achievement || highlight.citationText}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Composer */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Message</h2>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here, or select a template to get started..."
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {selectedTemplateId && (
                        <span className="mr-3">Template selected</span>
                      )}
                      {selectedHighlightId && (
                        <span>Highlight applied</span>
                      )}
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving || !message.trim()}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Message'}
                    </button>
                  </div>
                </div>

                {/* Placeholder Help */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Template Placeholders</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><code className="bg-blue-100 px-1 rounded">{'{{employeeName}}'}</code> - Employee's full name</li>
                    <li><code className="bg-blue-100 px-1 rounded">{'{{highlightTitle}}'}</code> - Achievement or citation</li>
                    <li><code className="bg-blue-100 px-1 rounded">{'{{highlightDescription}}'}</code> - Narrative or citation text</li>
                    <li><code className="bg-blue-100 px-1 rounded">{'{{date}}'}</code> - Highlight date</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

