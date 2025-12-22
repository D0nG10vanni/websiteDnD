// TimeSpan.tsx - UPDATE

import React from 'react'
import type { TimeSpanProps } from '../types'
import { getEraColor } from '../eraUtils'

const TimeSpan: React.FC<TimeSpanProps> = ({ 
  entry, 
  startPercent, 
  widthPercent, 
  lane,
  layoutSection, 
  mainLineTop, // <-- NEU: Empfangen der Hauptlinien-Position
  onClick 
}) => {
  const isEra = entry.dateType === 'era'
  
  // Dynamische Positionierung
  let topOffset = 0
  let height = 0
  let barHeight = ''
  let zIndex = 10

  if (layoutSection) {
    const laneHeight = isEra ? 45 : 35
    height = isEra ? 35 : 30
    topOffset = layoutSection.top + lane * laneHeight
    barHeight = isEra ? 'h-3' : 'h-2'
    zIndex = isEra ? 30 : 20
  }

  // Berechnung der Verbindungslinie
  // Wenn mainLineTop da ist, nutzen wir es, sonst Fallback (für Sicherheit)
  const connectionLineLength = mainLineTop 
    ? mainLineTop - topOffset - height 
    : 100 // Fallback

  // Wir zeichnen die Linie nur, wenn sie positiv ist
  const showConnection = connectionLineLength > 0

  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        left: `${Math.max(0, startPercent - 0.1)}%`,
        width: `${Math.min(100 - startPercent, widthPercent + 0.2)}%`,
        top: `${topOffset}px`,
        height: `${height}px`,
        zIndex
      }}
      onClick={onClick}
    >
      {/* Container Background */}
      <div className="relative w-full h-full bg-black/20 border border-white/5 rounded-lg backdrop-blur-[1px] group-hover:bg-black/40 transition-all duration-300">
        
        {/* Hauptbalken */}
        <div className={`absolute top-1/2 left-0 right-0 ${barHeight} bg-gradient-to-r ${getEraColor(entry.startYear)} rounded-full shadow-md transform -translate-y-1/2 group-hover:shadow-lg transition-all duration-300 opacity-90`}>
          {/* Glanz */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full"></div>
        </div>
        
        {/* Titel-Label (Über dem Balken schwebend für bessere Lesbarkeit) */}
        <div className="absolute -top-5 left-0 overflow-visible whitespace-nowrap z-50">
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-serif font-bold backdrop-blur-md border shadow-sm transition-transform group-hover:scale-105 ${
            isEra 
              ? 'bg-purple-900/90 text-purple-100 border-purple-500/30' 
              : 'bg-slate-900/90 text-amber-100 border-amber-500/30'
          }`}>
            <span>{isEra ? '👑' : '📜'}</span>
            <span className="max-w-[150px] truncate">{entry.name}</span>
          </div>
        </div>
        
        {/* HINWEIS: Dauer-Anzeige ("75J") wurde hier ENTFERNT, um Visual Noise zu reduzieren. */}
        
        {/* DEZENTE Verbindungslinie zur Hauptlinie */}
        {showConnection && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ 
              top: `${height}px`, 
              height: `${connectionLineLength}px`,
              width: '1px'
            }}
          >
            {/* Gestrichelte Linie */}
            <div className="w-full h-full border-l border-dashed border-white/20 group-hover:border-white/40 transition-colors"></div>
            
            {/* Kleiner Punkt am Ende auf der Hauptlinie */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/20"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TimeSpan