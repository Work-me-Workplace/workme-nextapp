'use client'

import { useState, useRef } from 'react'

interface CSVUploadProps {
  onFileContent: (content: string) => void
  onError?: (error: string) => void
}

export default function CSVUpload({ onFileContent, onError }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      onError?.('Please upload a CSV file')
      return
    }

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        onFileContent(content)
      }
    }
    reader.onerror = () => {
      onError?.('Failed to read file')
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
      />
      
      {fileName ? (
        <div className="space-y-2">
          <div className="text-green-600">✓ {fileName}</div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setFileName(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Remove file
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          <div className="text-gray-600">
            Click to upload or drag and drop
          </div>
          <div className="text-sm text-gray-500">
            CSV file only
          </div>
        </div>
      )}
    </div>
  )
}

