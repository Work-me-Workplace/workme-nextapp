'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'

interface Asset {
  id: string
  url: string
  fileName: string
  category: string
  holidaySlug?: string | null
  createdAt: string
  holiday?: {
    id: string
    name: string
    slug: string
  } | null
}

export default function AssetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const assetId = params.assetId as string

  const [asset, setAsset] = useState<Asset | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAsset = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Load all assets and find the one we need
        const response = await api.get('/api/assets')
        if (response.data.success) {
          const foundAsset = response.data.data.find((a: Asset) => a.id === assetId)
          if (foundAsset) {
            setAsset(foundAsset)
          } else {
            setError('Asset not found')
          }
        } else {
          setError(response.data.error || 'Failed to load asset')
        }
      } catch (err: any) {
        console.error('Load asset error:', err)
        setError(err.response?.data?.error || 'Failed to load asset. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (assetId) {
      loadAsset()
    }
  }, [assetId])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading asset...</div>
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Asset not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push('/assets')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Assets
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Asset Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={asset.url}
            alt={asset.fileName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Name
            </label>
            <p className="text-gray-900">{asset.fileName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <p className="text-gray-900 capitalize">{asset.category}</p>
          </div>

          {asset.holiday && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Holiday
              </label>
              <p className="text-gray-900">{asset.holiday.name}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created At
            </label>
            <p className="text-gray-900">
              {new Date(asset.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 break-all"
            >
              {asset.url}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

