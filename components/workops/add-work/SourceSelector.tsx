'use client'

import { UserCheck, Camera, Pencil, Users, TrendingUp, Award, Box, AlertTriangle } from 'lucide-react'
import type { WorkOpsSourceType } from './AddWorkModal'

interface SourceSelectorProps {
  onSelect: (source: WorkOpsSourceType) => void
}

const sources = [
  {
    id: 'boss_tasking' as WorkOpsSourceType,
    label: 'Boss Tasking',
    icon: UserCheck,
    description: 'Tasks assigned by your boss or supervisor',
    color: 'blue',
  },
  {
    id: 'capture' as WorkOpsSourceType,
    label: 'Capture',
    icon: Camera,
    description: 'Quick capture of thoughts or ideas',
    color: 'purple',
  },
  {
    id: 'manual' as WorkOpsSourceType,
    label: 'Manual Entry',
    icon: Pencil,
    description: 'Manually create a work item',
    color: 'green',
  },
  {
    id: 'workforce_stuff' as WorkOpsSourceType,
    label: 'Workforce Stuff',
    icon: Users,
    description: 'From company events, training, benefits',
    color: 'indigo',
  },
  {
    id: 'company_milestones' as WorkOpsSourceType,
    label: 'Company Milestones',
    icon: TrendingUp,
    description: 'Company achievements and milestones',
    color: 'yellow',
  },
  {
    id: 'employee_highlights' as WorkOpsSourceType,
    label: 'Employee Highlights',
    icon: Award,
    description: 'Employee recognition and awards',
    color: 'pink',
  },
  {
    id: 'products' as WorkOpsSourceType,
    label: 'Products',
    icon: Box,
    description: 'Company products and initiatives',
    color: 'orange',
  },
  {
    id: 'external_pressures' as WorkOpsSourceType,
    label: 'External Pressures',
    icon: AlertTriangle,
    description: 'External pressures and requirements',
    color: 'red',
  },
]

export default function SourceSelector({ onSelect }: SourceSelectorProps) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-6">Select the source of this work item:</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sources.map((source) => {
          const Icon = source.icon
          return (
            <button
              key={source.id}
              onClick={() => onSelect(source.id)}
              className="flex flex-col items-center p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-center group"
            >
              <div className={`p-3 rounded-lg mb-3 group-hover:scale-110 transition-transform ${
                source.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                source.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                source.color === 'green' ? 'bg-green-100 text-green-600' :
                source.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                source.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                source.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                source.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                'bg-red-100 text-red-600'
              }`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{source.label}</h3>
              <p className="text-xs text-gray-500">{source.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

