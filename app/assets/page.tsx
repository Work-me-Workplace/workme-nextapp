'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TopNav from '@/components/layout/TopNav'
import { uploadAsset } from '@/lib/assets/uploadAsset'
import { ImageIcon, Upload, X } from 'lucide-react'

export default function AssetsPage() {
  const router = useRouter()
  const [uploadType, setUploadType] = useState<'standalone' | 'digital-sign' | 'work-package' | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedAsset, setUploadedAsset] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Pre-fill title with filename (without extension)
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '')
      setFormData(prev => ({ ...prev, title: prev.title || nameWithoutExt }))
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      // Upload file first
      const asset = await uploadAsset(file)

      // Update asset with metadata
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || null,
          description: formData.description || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to update asset metadata')

      const updatedAsset = await response.json()
      setUploadedAsset(updatedAsset)
      setUploadType(null)
      setFile(null)
      setFormData({ title: '', description: '' })
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setUploadType(null)
    setFile(null)
    setUploadedAsset(null)
    setFormData({ title: '', description: '' })
  }

  if (uploadedAsset) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Upload Successful!</h2>
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {uploadedAsset.type === 'image' && (
                <div className="flex justify-center">
                  <img
                    src={uploadedAsset.url}
                    alt={uploadedAsset.title || uploadedAsset.filename || 'Uploaded image'}
                    className="max-w-full h-64 object-contain rounded-lg border"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Photo Name</label>
                  <p className="mt-1 text-sm text-gray-900">{uploadedAsset.title || uploadedAsset.filename || 'Untitled'}</p>
                </div>
                
                {uploadedAsset.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{uploadedAsset.description}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">URL</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={uploadedAsset.url}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedAsset.url)
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
                  Upload Another
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
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600 mt-2">Upload and manage your files and images</p>
        </div>

        {!uploadType ? (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What do you want to upload?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setUploadType('standalone')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <ImageIcon className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Standalone Asset</h3>
                <p className="text-sm text-gray-600">Upload a file or image that's not assigned to anything specific</p>
              </button>

              <button
                onClick={() => setUploadType('digital-sign')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <Upload className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Digital Sign Asset</h3>
                <p className="text-sm text-gray-600">Upload an asset to attach to a digital sign</p>
              </button>

              <button
                onClick={() => setUploadType('work-package')}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <Upload className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Work Package Asset</h3>
                <p className="text-sm text-gray-600">Upload an asset to attach to a work package</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {uploadType === 'standalone' && 'Upload Standalone Asset'}
                {uploadType === 'digital-sign' && 'Upload Digital Sign Asset'}
                {uploadType === 'work-package' && 'Upload Work Package Asset'}
              </h2>
              <button
                onClick={() => setUploadType(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,.pdf,.ppt,.pptx,.doc,.docx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {file ? (
                      <>
                        <ImageIcon className="h-12 w-12 text-green-600 mb-2" />
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, PDF, PPT up to 10MB
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Photo Name */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Name
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a name for this asset"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Photo Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter a description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setUploadType(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
