// StatsBar.tsx - Statistik-Anzeige Komponente

import React from 'react'
import type { StatsBarProps } from '../types'

const StatsBar: React.FC<StatsBarProps> = ({ 
  totalEvents, 
  eras, 
  periods, 
  events, 
  maxLanes 
}) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-amber-100 font-bold text-lg">{totalEvents}</div>
      <div className="text-amber-200/60 text-xs">Gesamt</div>
    </div>
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-amber-100 font-bold text-lg">{eras}</div>
      <div className="text-amber-200/60 text-xs">Äras</div>
    </div>
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-amber-100 font-bold text-lg">{periods}</div>
      <div className="text-amber-200/60 text-xs">Perioden</div>
    </div>
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-amber-100 font-bold text-lg">{events}</div>
      <div className="text-amber-200/60 text-xs">Events</div>
    </div>
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-amber-100 font-bold text-lg">{maxLanes}</div>
      <div className="text-amber-200/60 text-xs">Ebenen</div>
    </div>
  </div>
)

export default StatsBar