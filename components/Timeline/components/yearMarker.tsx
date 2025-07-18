// YearMarker.tsx - Jahresmarkierungs-Komponente

import React from 'react'
import type { YearMarkerProps } from '../types'

const YearMarker: React.FC<YearMarkerProps> = ({ marker }) => {
  const getMarkerStyle = () => {
    if (marker.type === 'endpoint') {
      return {
        height: '16px',
        width: '3px',
        bg: 'bg-amber-400',
        textSize: 'text-sm font-bold',
        textColor: 'text-amber-400'
      }
    }
    if (marker.type === 'epoch') {
      return {
        height: '12px',
        width: '2px',
        bg: 'bg-purple-400',
        textSize: 'text-sm font-semibold',
        textColor: 'text-purple-400'
      }
    }
    if (marker.type === 'century') {
      return {
        height: '10px',
        width: '2px',
        bg: 'bg-blue-400',
        textSize: 'text-xs font-semibold',
        textColor: 'text-blue-400'
      }
    }
    if (marker.isImportant) {
      return {
        height: '8px',
        width: '1.5px',
        bg: 'bg-amber-300',
        textSize: 'text-xs font-medium',
        textColor: 'text-amber-300'
      }
    }
    if (marker.hasEvents) {
      return {
        height: '6px',
        width: '1px',
        bg: 'bg-green-400',
        textSize: 'text-xs',
        textColor: 'text-green-400'
      }
    }
    return {
      height: '4px',
      width: '1px',
      bg: 'bg-white/60',
      textSize: 'text-xs',
      textColor: 'text-white/60'
    }
  }
  
  const style = getMarkerStyle()
  const topPosition = marker.top || 195
  
  return (
    <div className="absolute" style={{ left: `${marker.percent}%`, top: `${topPosition}px` }}>
      {/* Marker Line */}
      <div 
        className={`${style.bg} ${style.width === '3px' ? 'w-1' : style.width === '2px' ? 'w-0.5' : 'w-px'} shadow-lg`} 
        style={{ height: style.height }} 
      />
      
      {/* Year Label */}
      <div className={`${style.textSize} ${style.textColor} mt-2 transform -translate-x-1/2 whitespace-nowrap font-serif bg-black/60 px-1 py-0.5 rounded border border-current/20`}>
        {marker.year}
        {marker.type === 'epoch' && <span className="text-xs ml-1">⚡</span>}
        {marker.type === 'century' && <span className="text-xs ml-1">◆</span>}
      </div>
    </div>
  )
}

export default YearMarker