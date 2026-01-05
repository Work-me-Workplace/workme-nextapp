'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import type { WorkOpsSourceType } from './AddWorkModal'

interface SmartWorkFormProps {
  category: 'my_thoughts' | 'boss' | 'company_stuff'
  outlookId?: string // Optional, API gets it from auth
  onBack?: () => void
  onSuccess: () => void
}

const categoryLabels = {
  my_thoughts: 'My Thoughts',
  boss: 'Boss',
  company_stuff: 'Company Stuff',
}

const categoryPlaceholders = {
  my_thoughts: 'What\'s on your mind? What do you want to remember or do?',
  boss: 'What did your boss ask you to do? Any deadlines or urgency?',
  company_stuff: 'What company event, milestone, or initiative needs attention?',
}

export default function SmartWorkForm({ category, outlookId, onBack, onSuccess }: SmartWorkFormProps) {
  const [rawText, setRawText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const handleAnalyze = async () => {
    if (!rawText.trim()) return

    setAnalyzing(true)
    setError(null)

    try {
      const response = await api.post('/api/workops/item/analyze', {
        rawText: rawText.trim(),
        category,
      })

      if (response.data.success) {
        setAnalysis(response.data.analysis)
        setShowAnalysis(true)
      } else {
        setError(response.data.error || 'Failed to analyze')
      }
    } catch (err: any) {
      console.error('Failed to analyze:', err)
      setError(err.response?.data?.error || err.message || 'Failed to analyze')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async () => {
    if (!analysis) {
      // If no analysis, just create a simple capture
      await handleCreate({
        title: rawText.trim().substring(0, 100),
        body: rawText.trim(),
        itemType: 'capture',
        source: 'manual',
        urgency: null,
      })
      return
    }

    await handleCreate({
      title: analysis.title,
      body: analysis.body,
      itemType: analysis.itemType,
      source: 'manual',
      urgency: analysis.urgency,
      dueDate: analysis.extractedDetails?.dueDate || null,
    })
  }

  const handleCreate = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/workops/item/create', {
        ...data,
      })

      if (response.data.success) {
        onSuccess()
      } else {
        setError(response.data.error || 'Failed to create work item')
      }
    } catch (err: any) {
      console.error('Failed to create work item:', err)
      setError(err.response?.data?.error || err.message || 'Failed to create work item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {categoryLabels[category]}
        </h3>
        <p className="text-sm text-gray-600">
          Tell me what you want to do, and I'll help structure it as a work item.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
            What do you want to do?
          </label>
          <textarea
            id="rawText"
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={categoryPlaceholders[category]}
          />
        </div>

        {!showAnalysis && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !rawText.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze & Structure
              </>
            )}
          </button>
        )}

        {showAnalysis && analysis && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggested Work Item</h4>
              <div className="bg-white rounded p-3 space-y-2">
                <div>
                  <span className="text-xs text-gray-500">Title:</span>
                  <p className="text-sm font-medium text-gray-900">{analysis.title}</p>
                </div>
                {analysis.suggestedAction && (
                  <div>
                    <span className="text-xs text-gray-500">What you want to do:</span>
                    <p className="text-sm text-gray-700">{analysis.suggestedAction}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    Type: {analysis.itemType}
                  </span>
                  {analysis.urgency && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      analysis.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                      analysis.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                      analysis.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {analysis.urgency} urgency
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Work Item'}
              </button>
              <button
                onClick={() => {
                  setShowAnalysis(false)
                  setAnalysis(null)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {!showAnalysis && (
          <button
            onClick={() => handleCreate({
              title: rawText.trim().substring(0, 100) || 'Quick Capture',
              body: rawText.trim(),
              itemType: 'capture',
              source: 'manual',
              urgency: null,
            })}
            disabled={loading || !rawText.trim()}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create as Simple Capture'}
          </button>
        )}
      </div>
    </div>
  )
}

