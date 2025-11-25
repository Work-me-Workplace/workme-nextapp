'use client'

import Image from 'next/image'

export interface AssetCardProps {
  id: string
  url: string
  fileName: string
  category: string
  holidaySlug?: string | null
  onClick?: () => void
  selected?: boolean
}

export default function AssetCard({
  id,
  url,
  fileName,
  category,
  onClick,
  selected = false,
}: AssetCardProps) {
  return (
    <div
      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
        selected
          ? 'border-blue-600 ring-2 ring-blue-300'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="aspect-square relative bg-gray-100">
        <Image
          src={url}
          alt={fileName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      </div>
      {selected && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
      <div className="p-2 bg-white">
        <p className="text-xs text-gray-600 truncate">{fileName}</p>
        <p className="text-xs text-gray-400 capitalize">{category}</p>
      </div>
    </div>
  )
}

