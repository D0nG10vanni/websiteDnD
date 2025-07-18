// ZoomControls.tsx - Zoom und Sort Controls

import React from 'react'
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline'
import type { ZoomControlsProps } from '../types'

const ZoomControls: React.FC<ZoomControlsProps> = ({ 
  zoomLevel, 
  onZoomIn, 
  onZoomOut, 
  sortDirection, 
  onSortChange 
}) => (
  <div className="flex items-center gap-4">
    {/* Zoom Controls */}
    <div className="flex items-center gap-2">
      <span className="text-amber-200/60 text-sm font-serif">Zoom:</span>
      <button
        onClick={onZoomOut}
        className="p-1 bg-amber-900/20 hover:bg-amber-900/40 rounded text-amber-300 transition-colors"
        title="Herauszoomen"
      >
        <MagnifyingGlassMinusIcon className="w-4 h-4" />
      </button>
      <span className="text-amber-300 text-sm min-w-[3rem] text-center">
        {Math.round(zoomLevel * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        className="p-1 bg-amber-900/20 hover:bg-amber-900/40 rounded text-amber-300 transition-colors"
        title="Hineinzoomen"
      >
        <MagnifyingGlassPlusIcon className="w-4 h-4" />
      </button>
    </div>
    
    {/* Sort Controls */}
    <div className="flex items-center gap-2">
      <span className="text-amber-200/60 text-sm font-serif">Sortierung:</span>
      <button
        onClick={onSortChange}
        className="px-3 py-1 bg-amber-900/20 hover:bg-amber-900/40 rounded text-amber-300 text-sm font-serif transition-colors"
        title={`Aktuell: ${sortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}`}
      >
        {sortDirection === 'asc' ? '↗ Alt → Neu' : '↙ Neu → Alt'}
      </button>
    </div>
  </div>
)

export default ZoomControls