'use client'

import { Brain, UserCheck, Building2, Zap, List } from 'lucide-react'
import type { WorkOpsSourceType } from './AddWorkModal'

interface SourceSelectorProps {
  onSelect: (source: WorkOpsSourceType) => void
}

const sources = [
  {
    id: 'manual' as WorkOpsSourceType,
    label: 'Quick add',
    icon: Zap,
    description: 'Just title and optional details — no AI, instant',
    color: 'green',
  },
  {
    id: 'bulk' as WorkOpsSourceType,
    label: 'Bulk add',
    icon: List,
    description: 'Paste a list; we create one task per line or bullet',
    color: 'slate',
  },
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

const colorClasses: Record<string, string> = {
  green: 'bg-green-100 text-green-600',
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  indigo: 'bg-indigo-100 text-indigo-600',
}

export default function SourceSelector({ onSelect }: SourceSelectorProps) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-6">How do you want to add work?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {sources.map((source) => {
          const Icon = source.icon
          return (
            <button
              key={source.id}
              onClick={() => onSelect(source.id)}
              className="flex flex-col items-center p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-center group"
            >
              <div className={`p-3 rounded-lg mb-3 group-hover:scale-110 transition-transform ${colorClasses[source.color] || 'bg-gray-100 text-gray-600'}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{source.label}</h3>
              <p className="text-xs text-gray-500">{source.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

