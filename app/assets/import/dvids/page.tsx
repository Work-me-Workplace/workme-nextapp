'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Camera, Upload, X, ExternalLink, Loader2 } from 'lucide-react'

export default function DVIDSImportPage() {
  const router = useRouter()
  const [dvidsUrl, setDvidsUrl] = useState('')
  const [previewData, setPreviewData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importedAsset, setImportedAsset] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
  })

  const handlePreview = async () => {
    if (!dvidsUrl.trim()) {
      setError('Please enter a DVIDS URL')
      return
    }

    setLoading(true)
    setError(null)
    setPreviewData(null)

    try {
      // Call preview endpoint (we'll create this or use the main import endpoint in preview mode)
      const response = await fetch('/api/assets/import/dvids/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dvidsUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to preview DVIDS page')
      }

      setPreviewData(data.data)
      // Pre-fill form with extracted data
      if (data.data.title) {
        setFormData(prev => ({ ...prev, title: prev.title || data.data.title }))
      }
      if (data.data.description) {
        setFormData(prev => ({ ...prev, description: prev.description || data.data.description }))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to preview DVIDS page')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!dvidsUrl.trim()) {
      setError('Please enter a DVIDS URL')
      return
    }

    setImporting(true)
    setError(null)

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const response = await fetch('/api/assets/import/dvids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dvidsUrl,
          title: formData.title || undefined,
          description: formData.description || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import asset')
      }

      setImportedAsset(data.data)
    } catch (err: any) {
      setError(err.message || 'Failed to import asset')
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setDvidsUrl('')
    setPreviewData(null)
    setImportedAsset(null)
    setFormData({ title: '', description: '', tags: '' })
    setError(null)
  }

  if (importedAsset) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <SidebarNav />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Import Successful!</h2>
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {importedAsset.type === 'image' && (
                <div className="flex justify-center">
                  <img
                    src={importedAsset.url}
                    alt={importedAsset.title || importedAsset.filename || 'Imported image'}
                    className="max-w-full h-64 object-contain rounded-lg border"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-sm text-gray-900">{importedAsset.title || importedAsset.filename || 'Untitled'}</p>
                </div>

                {importedAsset.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{importedAsset.description}</p>
                  </div>
                )}

                {importedAsset.tags && importedAsset.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {importedAsset.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">URL</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={importedAsset.url}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(importedAsset.url)
                        alert('URL copied to clipboard!')
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Import Another
                </button>
                <button
                  onClick={() => router.push('/assets')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View All Assets
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarNav />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Import from DVIDS</h1>
          <p className="text-gray-600 mt-2">
            Import images from Defense Visual Information Distribution Service (DVIDS)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            {/* DVIDS URL Input */}
            <div>
              <label htmlFor="dvidsUrl" className="block text-sm font-medium text-gray-700 mb-2">
                DVIDS URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  id="dvidsUrl"
                  value={dvidsUrl}
                  onChange={(e) => setDvidsUrl(e.target.value)}
                  placeholder="https://www.dvidshub.net/image/..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || importing}
                />
                <button
                  onClick={handlePreview}
                  disabled={!dvidsUrl.trim() || loading || importing}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      <span>Preview</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter a DVIDS page URL (e.g., https://www.dvidshub.net/image/...)
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Preview */}
            {previewData && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Preview</h3>
                {previewData.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={previewData.imageUrl}
                      alt="Preview"
                      className="max-w-full h-48 object-contain rounded-lg border bg-white"
                      onError={() => {
                        setError('Failed to load preview image')
                      }}
                    />
                  </div>
                )}
                {previewData.title && (
                  <p className="text-sm text-gray-900 font-medium mb-1">{previewData.title}</p>
                )}
                {previewData.description && (
                  <p className="text-sm text-gray-600 mb-2">{previewData.description}</p>
                )}
                {previewData.photographer && (
                  <p className="text-xs text-gray-500">Photo by: {previewData.photographer}</p>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a title for this asset"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={importing}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter a description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={importing}
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional, comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={importing}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => router.push('/assets')}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                disabled={importing}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!dvidsUrl.trim() || importing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Import Asset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
