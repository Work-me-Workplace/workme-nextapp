'use client'

import { useState } from 'react'

interface WorkspaceUnitProps {
  unitName: string
  onUnitNameChange: (name: string) => void
  onSubmit: () => void
  loading?: boolean
}

export default function WorkspaceUnit({
  unitName,
  onUnitNameChange,
  onSubmit,
  loading = false,
}: WorkspaceUnitProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="unitName" className="block text-sm font-medium text-white/90 mb-2">
          Choose Your Workspace Name
        </label>
        <input
          id="unitName"
          type="text"
          value={unitName}
          onChange={(e) => onUnitNameChange(e.target.value)}
          placeholder="e.g., NAVSEA, Engineering Team, My Workspace"
          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
          disabled={loading}
        />
        <p className="mt-2 text-xs text-white/60">
          This can be real or fictional. It must be unique. You can join any workspace just by typing the same name.
          If you leave this blank, we'll generate a private workspace automatically.
        </p>
      </div>
    </div>
  )
}

