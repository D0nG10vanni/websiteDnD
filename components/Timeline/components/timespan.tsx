// TimeSpan.tsx - Zeitspannen-Komponente für Äras und Perioden

import React from 'react'
import type { TimeSpanProps } from '../types'
import { getEraColor } from '../eraUtils'

const TimeSpan: React.FC<TimeSpanProps> = ({ 
  entry, 
  startPercent, 
  widthPercent, 
  lane,
  layoutSection, 
  onClick 
}) => {
  const isEra = entry.dateType === 'era'
  const isPeriod = entry.dateType === 'period'
  
  // Dynamische Positionierung basierend auf Typ
  let topOffset = 0
  let height = 0
  let barHeight = ''
  let zIndex = 10

  if (layoutSection) {
    const laneHeight = entry.dateType === 'era' ? 45 : 35
    height = entry.dateType === 'era' ? 35 : 30
    topOffset = layoutSection.top + lane * laneHeight
    barHeight = entry.dateType === 'era' ? 'h-3' : 'h-2'
    zIndex = entry.dateType === 'era' ? 30 : 20
  }

  
  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        left: `${Math.max(0, startPercent - 0.1)}%`, // Kleine Pufferzone
        width: `${Math.min(100 - startPercent, widthPercent + 0.2)}%`,
        top: `${topOffset}px`,
        height: `${height}px`,
        zIndex
      }}
      onClick={onClick}
    >
      {/* Zeitspanne Container mit Hintergrund */}
      <div className="relative w-full h-full bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm group-hover:bg-black/40 transition-all duration-300">
        
        {/* Hauptbalken */}
        <div className={`absolute top-1/2 left-2 right-2 ${barHeight} bg-gradient-to-r ${getEraColor(entry.startYear)} rounded-full shadow-lg transform -translate-y-1/2 group-hover:shadow-xl transition-all duration-300`}>
          {/* Glanz-Effekt */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
        </div>
        
        {/* Start- und Endmarkierungen */}
        <div className="absolute left-1 top-1/2 w-2 h-2 bg-white rounded-full transform -translate-y-1/2 shadow-lg border border-gray-600" />
        <div className="absolute right-1 top-1/2 w-2 h-2 bg-white rounded-full transform -translate-y-1/2 shadow-lg border border-gray-600" />
        
        {/* Titel-Container */}
        <div className="absolute -top-6 left-0 right-0 text-center">
          <div className={`inline-block px-2 py-0.5 rounded text-xs font-serif font-bold backdrop-blur-sm border ${
            isEra 
              ? 'bg-purple-900/80 text-purple-100 border-purple-600/50' 
              : 'bg-blue-900/80 text-blue-100 border-blue-600/50'
          }`}>
            {isEra ? '👑' : '📜'} {entry.name}
          </div>
        </div>
        
        {/* Dauer-Info */}
        {entry.duration && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="text-xs text-amber-200/80 font-serif bg-black/60 px-1 rounded">
              {entry.duration}J
            </div>
          </div>
        )}
        
        {/* Verbindungslinie zur Hauptlinie */}
        <div 
          className="absolute left-1/2 bg-gradient-to-b from-amber-400/60 to-amber-400/20 w-0.5 transform -translate-x-0.5"
          style={{ 
            top: `${height}px`, 
            height: `${240 - topOffset - height}px` 
          }}
        />
      </div>
    </div>
  )
}

export default TimeSpan