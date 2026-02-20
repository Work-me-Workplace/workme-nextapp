'use client'

import { PenLine, Sparkles } from 'lucide-react'

export type AddTaskMethod = 'manual' | 'ai'

interface MethodSelectorProps {
  onSelect: (method: AddTaskMethod) => void
}

export default function MethodSelector({ onSelect }: MethodSelectorProps) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-6">How do you want to add this task?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSelect('manual')}
          className="flex flex-col items-center p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-center group"
        >
          <div className="p-3 rounded-lg mb-3 group-hover:scale-105 transition-transform bg-slate-100 text-slate-600">
            <PenLine className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Manual</h3>
          <p className="text-xs text-gray-500">Type title and details yourself</p>
        </button>
        <button
          type="button"
          onClick={() => onSelect('ai')}
          className="flex flex-col items-center p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-center group"
        >
          <div className="p-3 rounded-lg mb-3 group-hover:scale-105 transition-transform bg-indigo-100 text-indigo-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">AI</h3>
          <p className="text-xs text-gray-500">Describe in your words; we structure it</p>
        </button>
      </div>
    </div>
  )
}
