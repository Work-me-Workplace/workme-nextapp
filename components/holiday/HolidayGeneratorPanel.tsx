'use client'

import { useState } from 'react'
import { Asset } from './AssetGrid'

export interface HolidayGeneratorPanelProps {
  holidaySlug: string
  holidayName: string
  assets: Asset[]
  onGenerate: (holidaySlug: string) => Promise<void>
  generatedContent?: {
    title: string
    caption: string
    internalCaption: string
    externalCaption: string
    altText: string
    recommendedAssetUrl?: string
  } | null
  loading?: boolean
}

export default function HolidayGeneratorPanel({
  holidaySlug,
  holidayName,
  assets,
  onGenerate,
  generatedContent,
  loading = false,
}: HolidayGeneratorPanelProps) {
  const [selectedVersion, setSelectedVersion] = useState<'internal' | 'external'>('internal')

  const handleGenerate = async () => {
    await onGenerate(holidaySlug)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Generate Content for {holidayName}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          AI will generate social graphics, captions, and ALT text for this holiday.
        </p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Content'}
        </button>
      </div>

      {generatedContent && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            <button
              type="button"
              onClick={() => setSelectedVersion('internal')}
              className={`px-4 py-2 text-sm font-medium ${
                selectedVersion === 'internal'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Internal Workforce
            </button>
            <button
              type="button"
              onClick={() => setSelectedVersion('external')}
              className={`px-4 py-2 text-sm font-medium ${
                selectedVersion === 'external'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600'
              }`}
            >
              External Public
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <p className="text-gray-900">{generatedContent.title}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caption ({selectedVersion === 'internal' ? 'Internal' : 'External'})
              </label>
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedVersion === 'internal'
                  ? generatedContent.internalCaption
                  : generatedContent.externalCaption}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ALT Text
              </label>
              <p className="text-gray-700">{generatedContent.altText}</p>
            </div>

            {generatedContent.recommendedAssetUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommended Asset
                </label>
                <img
                  src={generatedContent.recommendedAssetUrl}
                  alt={generatedContent.altText}
                  className="max-w-xs rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

