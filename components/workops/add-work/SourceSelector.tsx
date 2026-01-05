'use client'

import { Brain, UserCheck, Building2 } from 'lucide-react'
import type { WorkOpsSourceType } from './AddWorkModal'

interface SourceSelectorProps {
  onSelect: (source: WorkOpsSourceType) => void
}

const sources = [
  {
    id: 'capture' as WorkOpsSourceType,
    label: 'My Thoughts',
    icon: Brain,
    description: 'Ideas, thoughts, or things you want to remember',
    color: 'purple',
  },
  {
    id: 'boss_tasking' as WorkOpsSourceType,
    label: 'Boss',
    icon: UserCheck,
    description: 'Tasks or requests from your boss or supervisor',
    color: 'blue',
  },
  {
    id: 'workforce_stuff' as WorkOpsSourceType,
    label: 'Company Stuff',
    icon: Building2,
    description: 'Company events, milestones, employee highlights, or initiatives',
    color: 'indigo',
  },
]

export default function SourceSelector({ onSelect }: SourceSelectorProps) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-6">What kind of work is this?</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sources.map((source) => {
          const Icon = source.icon
          return (
            <button
              key={source.id}
              onClick={() => onSelect(source.id)}
              className="flex flex-col items-center p-8 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-center group"
            >
              <div className={`p-4 rounded-lg mb-4 group-hover:scale-110 transition-transform ${
                source.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                source.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                'bg-indigo-100 text-indigo-600'
              }`}>
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{source.label}</h3>
              <p className="text-sm text-gray-500">{source.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

