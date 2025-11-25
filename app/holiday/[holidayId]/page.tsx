'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import AssetGrid, { Asset } from '@/components/holiday/AssetGrid'
import HolidayGeneratorPanel from '@/components/holiday/HolidayGeneratorPanel'
import DownloadPackageButton from '@/components/holiday/DownloadPackageButton'

interface Holiday {
  id: string
  name: string
  slug: string
}

interface GeneratedContent {
  title: string
  caption: string
  internalCaption: string
  externalCaption: string
  altText: string
  recommendedAssetUrl?: string
}

export default function HolidayBuilderPage() {
  const router = useRouter()
  const params = useParams()
  const holidayId = params.holidayId as string

  const [holiday, setHoliday] = useState<Holiday | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHoliday = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Load holiday
        const holidayResponse = await api.get('/api/holidays')
        if (holidayResponse.data.success) {
          const foundHoliday = holidayResponse.data.data.find(
            (h: Holiday) => h.slug === holidayId,
          )
          if (foundHoliday) {
            setHoliday(foundHoliday)
          } else {
            setError('Holiday not found')
          }
        }

        // Load assets (holiday-specific and general)
        const assetsResponse = await api.get('/api/assets', {
          params: {
            holiday: holidayId,
          },
        })
        if (assetsResponse.data.success) {
          setAssets(assetsResponse.data.data)
        }
      } catch (err: any) {
        console.error('Load holiday error:', err)
        setError(err.response?.data?.error || 'Failed to load holiday. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (holidayId) {
      loadHoliday()
    }
  }, [holidayId])

  const handleGenerate = async (slug: string) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await api.post('/api/holidays/generate', {
        holidaySlug: slug,
      })

      if (response.data.success) {
        setGeneratedContent(response.data.data)
      } else {
        setError(response.data.error || 'Failed to generate content')
      }
    } catch (err: any) {
      console.error('Generate error:', err)
      setError(err.response?.data?.error || 'Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    // Create a zip package with all content
    // For now, just download JSON
    if (!generatedContent || !holiday) return

    const packageData = {
      holiday: holiday.name,
      slug: holiday.slug,
      ...generatedContent,
      selectedAsset: selectedAsset,
    }

    const blob = new Blob([JSON.stringify(packageData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${holiday.slug}-package.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading holiday builder...</div>
        </div>
      </div>
    )
  }

  if (!holiday) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Holiday not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push('/holiday')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back to Holidays
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{holiday.name} Builder</h1>
          <p className="text-gray-600">Generate social graphics, captions, and content</p>
        </div>
        <DownloadPackageButton
          holidaySlug={holiday.slug}
          holidayName={holiday.name}
          generatedContent={generatedContent}
          onDownload={handleDownload}
        />
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-8">
        <HolidayGeneratorPanel
          holidaySlug={holiday.slug}
          holidayName={holiday.name}
          assets={assets}
          onGenerate={handleGenerate}
          generatedContent={generatedContent}
          loading={isGenerating}
        />

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Assets</h2>
          <AssetGrid
            assets={assets}
            onAssetSelect={setSelectedAsset}
            selectedAssetId={selectedAsset?.id}
          />
        </div>
      </div>
    </div>
  )
}

