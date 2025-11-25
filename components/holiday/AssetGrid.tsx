'use client'

import { useState } from 'react'
import AssetCard from './AssetCard'

export interface Asset {
  id: string
  url: string
  fileName: string
  category: string
  holidaySlug?: string | null
}

export interface AssetGridProps {
  assets: Asset[]
  onAssetSelect?: (asset: Asset) => void
  selectedAssetId?: string | null
  loading?: boolean
}

export default function AssetGrid({
  assets,
  onAssetSelect,
  selectedAssetId,
  loading = false,
}: AssetGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-200 rounded-lg">
        <p className="text-gray-500">No assets found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          {...asset}
          selected={selectedAssetId === asset.id}
          onClick={() => onAssetSelect?.(asset)}
        />
      ))}
    </div>
  )
}

