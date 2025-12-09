'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { FileText, Plus, Trash2 } from 'lucide-react'
import api from '@/lib/api'

interface Template {
  id: string
  name: string
  body: string
  createdAt: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateBody, setNewTemplateBody] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadTemplates()
      }
    }
  }, [router])

  async function loadTemplates() {
    try {
      setLoading(true)
      const response = await api.get('/api/workengage/template')
      
      if (response.data.success) {
        setTemplates(response.data.data)
      } else {
        console.error('Failed to load templates:', response.data.error)
        setTemplates([])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTemplate() {
    if (!newTemplateName.trim() || !newTemplateBody.trim()) {
      alert('Please fill in both name and body')
      return
    }

    try {
      setSaving(true)
      const response = await api.post('/api/workengage/template', {
        name: newTemplateName,
        body: newTemplateBody,
      })

      if (response.data.success) {
        setNewTemplateName('')
        setNewTemplateBody('')
        setShowCreateForm(false)
        await loadTemplates()
      } else {
        alert('Failed to create template: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to create template:', error)
      alert('Failed to create template: ' + (error.message || 'Unknown error'))
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
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates</h1>
                <p className="text-gray-600">Manage your engagement message templates</p>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Template</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g., Promotion Congrats, Team Win"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Body
                    </label>
                    <textarea
                      value={newTemplateBody}
                      onChange={(e) => setNewTemplateBody(e.target.value)}
                      placeholder="Use {{employeeName}}, {{highlightTitle}}, {{highlightDescription}}, {{date}} as placeholders"
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Available placeholders: {'{{employeeName}}'}, {'{{highlightTitle}}'}, {'{{highlightDescription}}'}, {'{{date}}'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleCreateTemplate}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Creating...' : 'Create Template'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewTemplateName('')
                        setNewTemplateBody('')
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Templates List */}
            {templates.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
                <p className="text-gray-600 mb-4">Create your first template to get started</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                          {template.body}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

