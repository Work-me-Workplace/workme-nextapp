'use client'

export interface AssetCategorySelectorProps {
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}

const CATEGORIES = [
  { value: null, label: 'All Categories' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'workforce', label: 'Workforce' },
  { value: 'shipyard', label: 'Shipyard' },
  { value: 'general', label: 'General NAVSEA' },
]

export default function AssetCategorySelector({
  selectedCategory,
  onCategoryChange,
}: AssetCategorySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => (
        <button
          key={category.value || 'all'}
          type="button"
          onClick={() => onCategoryChange(category.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === category.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}

