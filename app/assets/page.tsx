'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import AssetGrid, { Asset } from '@/components/holiday/AssetGrid'
import AssetCategorySelector from '@/components/holiday/AssetCategorySelector'
import HolidaySelector, { Holiday } from '@/components/holiday/HolidaySelector'

export default function AssetsPage() {
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedHolidaySlug, setSelectedHolidaySlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Load holidays
        const holidaysResponse = await api.get('/api/holidays')
        if (holidaysResponse.data.success) {
          setHolidays(holidaysResponse.data.data)
        }

        // Load assets
        await loadAssets()
      } catch (err: any) {
        console.error('Load data error:', err)
        setError(err.response?.data?.error || 'Failed to load assets. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    loadAssets()
  }, [selectedCategory, selectedHolidaySlug])

  const loadAssets = async () => {
    try {
      const params: any = {}
      if (selectedCategory) {
        params.category = selectedCategory
      }
      if (selectedHolidaySlug) {
        params.holiday = selectedHolidaySlug
      }

      const response = await api.get('/api/assets', { params })

      if (response.data.success) {
        setAssets(response.data.data)
      } else {
        setError(response.data.error || 'Failed to load assets')
      }
    } catch (err: any) {
      console.error('Load assets error:', err)
      setError(err.response?.data?.error || 'Failed to load assets. Please try again.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Photo Repository</h1>
          <p className="text-gray-600">Browse and manage your assets</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/assets/upload')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Upload Asset
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <AssetCategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Holiday
          </label>
          <HolidaySelector
            holidays={holidays}
            selectedHolidaySlug={selectedHolidaySlug}
            onHolidayChange={setSelectedHolidaySlug}
          />
        </div>
      </div>

      <AssetGrid assets={assets} loading={isLoading} />
    </div>
  )
}

