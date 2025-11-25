'use client'

import { useState } from 'react'

export interface DownloadPackageButtonProps {
  holidaySlug: string
  holidayName: string
  generatedContent?: {
    title: string
    caption: string
    internalCaption: string
    externalCaption: string
    altText: string
    recommendedAssetUrl?: string
  } | null
  onDownload?: () => Promise<void>
}

export default function DownloadPackageButton({
  holidaySlug,
  holidayName,
  generatedContent,
  onDownload,
}: DownloadPackageButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!generatedContent) {
      alert('Please generate content first')
      return
    }

    setDownloading(true)

    try {
      if (onDownload) {
        await onDownload()
      } else {
        // Default download behavior
        const packageData = {
          holiday: holidayName,
          slug: holidaySlug,
          title: generatedContent.title,
          caption: generatedContent.caption,
          internalCaption: generatedContent.internalCaption,
          externalCaption: generatedContent.externalCaption,
          altText: generatedContent.altText,
          recommendedAssetUrl: generatedContent.recommendedAssetUrl,
        }

        const blob = new Blob([JSON.stringify(packageData, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${holidaySlug}-package.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download package')
    } finally {
      setDownloading(false)
    }
  }

  if (!generatedContent) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {downloading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Downloading...
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Export Pack
        </>
      )}
    </button>
  )
}

