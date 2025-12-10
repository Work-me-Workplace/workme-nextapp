'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface NewsProcessorProps {
  platformProductId: string
  onProcessed?: () => void
}

export default function NewsProcessor({ platformProductId, onProcessed }: NewsProcessorProps) {
  const [rawText, setRawText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [autoApply, setAutoApply] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    statement?: any
    update?: any
    platformUpdated?: boolean
    error?: string
  } | null>(null)

  async function handleProcess() {
    if (!rawText.trim()) {
      alert('Please paste the news article text')
      return
    }

    try {
      setProcessing(true)
      setResult(null)

      const response = await api.post('/api/platform/process-news', {
        platformProductId,
        rawText,
        sourceUrl: sourceUrl || undefined,
        autoApplyUpdates: autoApply,
      })

      if (response.data.success) {
        setResult({
          success: true,
          statement: response.data.statement,
          update: response.data.update,
          platformUpdated: response.data.platformUpdated,
        })
        setRawText('')
        setSourceUrl('')
        if (onProcessed) {
          onProcessed()
        }
      } else {
        setResult({
          success: false,
          error: response.data.error || 'Failed to process article',
        })
      }
    } catch (error: any) {
      console.error('Failed to process news:', error)
      setResult({
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to process article',
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center mb-4">
        <FileText className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Process News Article</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Source URL (optional)
          </label>
          <input
            type="url"
            id="sourceUrl"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="https://..."
          />
        </div>

        <div>
          <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
            Article Text *
          </label>
          <textarea
            id="rawText"
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
            placeholder="Paste the full article text here..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoApply"
            checked={autoApply}
            onChange={(e) => setAutoApply(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="autoApply" className="ml-2 text-sm text-gray-700">
            Automatically apply updates to platform (otherwise they'll be stored as suggestions)
          </label>
        </div>

        <button
          onClick={handleProcess}
          disabled={processing || !rawText.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Process Article
            </>
          )}
        </button>

        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              )}
              <div className="flex-1">
                {result.success ? (
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-2">
                      Article processed successfully!
                    </p>
                    {result.update && (
                      <div className="text-xs text-green-700 space-y-1">
                        {result.update.scheduleStatus && (
                          <p>Schedule Status: {result.update.scheduleStatus}</p>
                        )}
                        {result.update.costStatus && <p>Cost Status: {result.update.costStatus}</p>}
                        {result.update.override_programStatus && (
                          <p>Program Status Override: {result.update.override_programStatus}</p>
                        )}
                        {result.platformUpdated && (
                          <p className="font-medium">Platform product updated with new values</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-900">{result.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
