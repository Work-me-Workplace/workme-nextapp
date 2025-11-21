'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import CSVUpload from '@/components/ntk/CSVUpload'
import NTKPreview from '@/components/ntk/NTKPreview'
import type { NTKStructure } from '@/lib/types/ntk'

type InputMode = 'manual' | 'csv' | 'reuse'

export default function NewNTKPage() {
  const router = useRouter()
  const [inputMode, setInputMode] = useState<InputMode>('manual')
  const [sourceText, setSourceText] = useState('')
  const [csvContent, setCsvContent] = useState('')
  const [generatedNTK, setGeneratedNTK] = useState<NTKStructure | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedNTKId, setSavedNTKId] = useState<string | null>(null)

  const handleGenerate = async () => {
    const textToUse = inputMode === 'csv' ? csvContent : sourceText

    if (!textToUse || textToUse.trim().length === 0) {
      setError('Please enter text or upload a CSV file')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await api.post('/api/ntk/generate', {
        sourceText: textToUse,
        isCSV: inputMode === 'csv',
        save: false, // Don't save on first generation
      })

      if (response.data.success) {
        setGeneratedNTK(response.data.ntk)
      } else {
        setError(response.data.error || 'Failed to generate NTK')
      }
    } catch (err: any) {
      console.error('NTK generation error:', err)
      setError(err.response?.data?.error || 'Failed to generate NTK. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedNTK) return

    setIsSaving(true)
    setError(null)

    try {
      const textToUse = inputMode === 'csv' ? csvContent : sourceText
      
      const response = await api.post('/api/ntk/generate', {
        sourceText: textToUse,
        isCSV: inputMode === 'csv',
        save: true, // Save this time
      })

      if (response.data.success && response.data.ntkId) {
        setSavedNTKId(response.data.ntkId)
        // Redirect to detail page after a short delay
        setTimeout(() => {
          router.push(`/ntk/${response.data.ntkId}`)
        }, 1500)
      } else {
        setError('Failed to save NTK')
      }
    } catch (err: any) {
      console.error('NTK save error:', err)
      setError(err.response?.data?.error || 'Failed to save NTK. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReuse = async (outputId: string) => {
    try {
      const response = await api.get(`/api/output-standalone/${outputId}`)
      if (response.data.success && response.data.data) {
        const existing = response.data.data
        // Extract source text from metadata
        const metadata = existing.metadata as any
        if (metadata?.sourceText) {
          setSourceText(metadata.sourceText)
          setInputMode('manual')
          setGeneratedNTK(null) // Reset preview
        }
      }
    } catch (err: any) {
      setError('Failed to load previous NTK')
    }
  }

  if (savedNTKId) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">NTK Saved Successfully!</h2>
          <p className="text-gray-600">Redirecting to NTK detail page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New NTK</h1>
        <p className="text-gray-600">Generate a structured Need-to-Know document from text input</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Input Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Input Method
        </label>
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => {
              setInputMode('manual')
              setGeneratedNTK(null)
              setError(null)
            }}
            className={`
              p-4 border-2 rounded-lg text-center
              ${inputMode === 'manual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <div className="text-2xl mb-2">✍️</div>
            <div className="font-medium">Manual Input</div>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setInputMode('csv')
              setGeneratedNTK(null)
              setError(null)
            }}
            className={`
              p-4 border-2 rounded-lg text-center
              ${inputMode === 'csv'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="font-medium">Upload CSV</div>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setInputMode('reuse')
              setGeneratedNTK(null)
              setError(null)
            }}
            className={`
              p-4 border-2 rounded-lg text-center
              ${inputMode === 'reuse'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <div className="text-2xl mb-2">♻️</div>
            <div className="font-medium">Reuse Previous</div>
          </button>
        </div>
      </div>

      {/* Input Area */}
      {inputMode === 'manual' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Text
          </label>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Paste or type your text here..."
            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {inputMode === 'csv' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV File
          </label>
          <CSVUpload
            onFileContent={(content) => {
              setCsvContent(content)
              setError(null)
            }}
            onError={(err) => setError(err)}
          />
        </div>
      )}

      {inputMode === 'reuse' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Previous NTK to Reuse
          </label>
          <p className="text-sm text-gray-500 mb-4">
            <a href="/ntk" className="text-blue-600 hover:underline">
              Go to NTK list to select one
            </a>
          </p>
        </div>
      )}

      {/* Generate Button */}
      {(inputMode === 'manual' || inputMode === 'csv') && (
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || (inputMode === 'manual' && !sourceText.trim()) || (inputMode === 'csv' && !csvContent.trim())}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isGenerating ? 'Generating NTK...' : 'Generate NTK'}
          </button>
        </div>
      )}

      {/* Preview */}
      {generatedNTK && (
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <NTKPreview
            ntk={generatedNTK}
            sourceText={inputMode === 'csv' ? csvContent : sourceText}
            onSave={handleSave}
            isLoading={isSaving}
          />
        </div>
      )}
    </div>
  )
}

