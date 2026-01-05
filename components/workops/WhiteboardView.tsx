'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Target, Calendar, Move, X, Edit2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { WorkOpsStatus } from '@prisma/client'

interface WorkOpsItem {
  id: string
  title: string
  body?: string | null
  itemType: string
  urgency?: string | null
  status: WorkOpsStatus
  source?: string | null
  dueDate?: string | null
  createdAt: string
  updatedAt: string
  // Whiteboard-specific fields
  positionX?: number | null
  positionY?: number | null
  groupId?: string | null
  targetQuarter?: string | null
}

interface WorkOpsGoal {
  id: string
  title: string
  description?: string | null
  targetQuarter?: string | null
  positionX?: number | null
  positionY?: number | null
}

interface WhiteboardViewProps {
  items: WorkOpsItem[]
  onItemUpdate: (itemId: string, updates: Partial<WorkOpsItem>) => void
  onAddGoal: () => void
  onAddItem: () => void
}

const QUARTERS = [
  { id: '2026-Q1', label: 'Q1 2026', x: 50, y: 100, color: 'bg-blue-50 border-blue-200' },
  { id: '2026-Q2', label: 'Q2 2026', x: 400, y: 100, color: 'bg-green-50 border-green-200' },
  { id: '2026-Q3', label: 'Q3 2026', x: 750, y: 100, color: 'bg-yellow-50 border-yellow-200' },
  { id: '2026-Q4', label: 'Q4 2026', x: 1100, y: 100, color: 'bg-purple-50 border-purple-200' },
]

const GOAL_ZONES = [
  { id: 'career', label: 'Career Goals', x: 50, y: 400, color: 'bg-indigo-50 border-indigo-200' },
  { id: 'work', label: 'Work Projects', x: 400, y: 400, color: 'bg-teal-50 border-teal-200' },
  { id: 'personal', label: 'Personal', x: 750, y: 400, color: 'bg-pink-50 border-pink-200' },
]

export default function WhiteboardView({ items, onItemUpdate, onAddGoal, onAddItem }: WhiteboardViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [goals, setGoals] = useState<WorkOpsGoal[]>([])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Initialize items with default positions if they don't have them
  const itemsWithPositions = items.map((item, index) => ({
    ...item,
    positionX: item.positionX ?? (index % 4) * 200 + 100,
    positionY: item.positionY ?? Math.floor(index / 4) * 150 + 200,
    targetQuarter: item.targetQuarter ?? null,
  }))

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetQuarter?: string, targetZone?: string) => {
    e.preventDefault()
    if (!draggedItem) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom

    const updates: Partial<WorkOpsItem> = {
      positionX: x,
      positionY: y,
    }

    if (targetQuarter) {
      updates.targetQuarter = targetQuarter
    }

    onItemUpdate(draggedItem, updates)
    setDraggedItem(null)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const getStatusIcon = (status: WorkOpsStatus) => {
    switch (status) {
      case WorkOpsStatus.done:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case WorkOpsStatus.in_progress:
        return <Clock className="h-4 w-4 text-blue-600" />
      case WorkOpsStatus.blocked:
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getUrgencyColor = (urgency?: string | null) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={onAddGoal}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          <Target className="h-4 w-4" />
          Add Goal
        </button>
        <button
          onClick={onAddItem}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Work
        </button>
        <div className="h-6 w-px bg-gray-300 mx-1" />
        <button
          onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
          className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
        >
          +
        </button>
        <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
          className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
        >
          −
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full relative cursor-move"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Quarter Zones */}
        {QUARTERS.map((quarter) => (
          <div
            key={quarter.id}
            className={`absolute border-2 border-dashed rounded-lg p-4 min-w-[300px] min-h-[200px] ${quarter.color}`}
            style={{ left: quarter.x, top: quarter.y }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, quarter.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{quarter.label}</h3>
              <Calendar className="h-5 w-5 text-gray-500" />
            </div>
            <div className="text-xs text-gray-600">
              {itemsWithPositions.filter((item) => item.targetQuarter === quarter.id).length} items
            </div>
          </div>
        ))}

        {/* Goal Zones */}
        {GOAL_ZONES.map((zone) => (
          <div
            key={zone.id}
            className={`absolute border-2 border-dashed rounded-lg p-4 min-w-[300px] min-h-[200px] ${zone.color}`}
            style={{ left: zone.x, top: zone.y }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, undefined, zone.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{zone.label}</h3>
              <Target className="h-5 w-5 text-gray-500" />
            </div>
            <div className="text-xs text-gray-600">
              {goals.filter((goal) => goal.id === zone.id).length} goals
            </div>
          </div>
        ))}

        {/* Work Items */}
        {itemsWithPositions.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            className="absolute bg-white rounded-lg shadow-md border border-gray-200 p-3 min-w-[200px] max-w-[250px] cursor-move hover:shadow-lg transition-shadow"
            style={{
              left: item.positionX ?? 0,
              top: item.positionY ?? 0,
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getStatusIcon(item.status)}
                <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
              </div>
              <Move className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
            {item.body && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.body}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {item.urgency && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getUrgencyColor(item.urgency)}`}>
                  {item.urgency}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                {item.itemType}
              </span>
            </div>
            {item.targetQuarter && (
              <div className="mt-2 text-xs text-gray-500">
                {item.targetQuarter}
              </div>
            )}
          </div>
        ))}

        {/* Goals */}
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="absolute bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg border-2 border-indigo-600 p-4 min-w-[250px] max-w-[300px] text-white"
            style={{
              left: goal.positionX ?? 50,
              top: goal.positionY ?? 600,
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                <h3 className="font-bold text-lg">{goal.title}</h3>
              </div>
              <button
                onClick={() => setEditingGoal(goal.id)}
                className="text-white/80 hover:text-white"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
            {goal.description && (
              <p className="text-sm text-white/90 mb-2">{goal.description}</p>
            )}
            {goal.targetQuarter && (
              <div className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded inline-block">
                {goal.targetQuarter}
              </div>
            )}
            <div className="mt-3 text-xs text-white/80">
              {itemsWithPositions.filter((item) => item.groupId === goal.id).length} items linked
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs text-gray-600 max-w-xs">
        <p className="font-semibold mb-1">How to use:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Drag items to organize them</li>
          <li>Drop items in quarter zones or goal areas</li>
          <li>Ctrl + Drag to pan the canvas</li>
          <li>Use +/- to zoom</li>
        </ul>
      </div>
    </div>
  )
}

