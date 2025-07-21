// PointEvent.tsx - Event-Punkt Komponente (jetzt unterhalb der Timeline)

import React from 'react'
import type { PointEventProps } from '../types'
import { getEraColor, getEraName } from '../eraUtils'

const PointEvent: React.FC<PointEventProps> = ({ 
  entry, 
  positionPercent, 
  lane, 
  onClick,
  layoutSection,
  mainLineTop
}) => {
  // Fallback für Legacy-Modus
  let eventTop: number
  let connectionHeight: number
  
  if (layoutSection && mainLineTop !== undefined) {
    // Neues Layout-System
    const laneHeight = 70
    eventTop = layoutSection.top + (lane * laneHeight)
    connectionHeight = eventTop - mainLineTop - 10
  } else {
    // Legacy-Fallback
    eventTop = 280 + lane * 100
    connectionHeight = eventTop - 240
  }
  
  const baseTop = mainLineTop !== undefined ? mainLineTop : 240
  
  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        left: `${positionPercent}%`,
        top: `${baseTop}px`,
        transform: 'translateX(-50%)',
        zIndex: 40
      }}
      onClick={onClick}
    >
      {/* Verbindungslinie nach unten zur Event-Position */}
      <div 
        className="absolute left-1/2 top-10 w-0.5 bg-gradient-to-b from-amber-400/80 to-amber-400/30 transform -translate-x-0.5 rounded-full"
        style={{ height: `${Math.max(connectionHeight, 20)}px` }}
      />
      
      {/* Event-Punkt auf der Hauptlinie */}
      <div className="relative top-5">
        <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${getEraColor(entry.startYear)} border-2 border-white shadow-lg group-hover:scale-125 transition-all duration-300`}>
          {/* Innerer Glow */}
          <div className="absolute inset-0.5 bg-white/30 rounded-full blur-sm"></div>
        </div>
        
        {/* Pulsierender Ring bei Hover */}
        <div className="absolute inset-0 rounded-full bg-amber-400/20 scale-150 opacity-0 group-hover:opacity-100 group-hover:scale-200 transition-all duration-500"></div>
      </div>
      
      {/* Event-Details unterhalb der Timeline */}
      <div 
        className="absolute"
        style={{ 
          top: `${Math.max(connectionHeight + 20, 40)}px`,
          left: '-140px',
          width: '280px'
        }}
      >
        {/* Event-Card Container */}
        <div className="bg-gray-900/95 border border-amber-500/60 rounded-xl p-4 text-sm text-white font-serif shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105">
          
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-600/30">
            <div className="text-lg">⚡</div>
            <div className="flex-1">
              <div className="text-amber-300 font-bold text-base">{entry.name}</div>
              <div className="text-amber-200/60 text-xs">Event • {getEraName(entry.startYear)}</div>
            </div>
          </div>
          
          {/* Datum */}
          <div className="mb-3">
            <div className="text-amber-200/80 text-xs mb-1">Datum</div>
            <div className="text-amber-100 font-medium">{entry.displayDate}</div>
          </div>
          
          {/* Beschreibung */}
          <div className="mb-2">
            <div className="text-amber-200/80 text-xs mb-1">Beschreibung</div>
            <div className="text-gray-200 text-sm leading-relaxed line-clamp-4">
              {entry.description.length > 200 
                ? `${entry.description.substring(0, 200)}...`
                : entry.description
              }
            </div>
          </div>
          
          {/* Pfeil zur Verbindung (zeigt nach oben) */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-amber-500/60"></div>
        </div>
        
        {/* Event-Label (permanent sichtbar) */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-800/90 text-amber-200 text-xs px-2 py-1 rounded border border-amber-600/40 font-serif font-medium backdrop-blur-sm">
            {entry.name}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PointEvent