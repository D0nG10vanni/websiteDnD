// FilterBars.tsx - Era und Type Filter Komponenten

import React from 'react'
import type { EraFilterBarProps, TypeFilterBarProps } from '../types'

// Era Filter Komponente
export const EraFilterBar: React.FC<EraFilterBarProps> = ({ 
  eras, 
  selectedEra, 
  onEraChange 
}) => (
  <div className="flex flex-wrap gap-2">
    <button
      onClick={() => onEraChange(null)}
      className={`px-3 py-1 rounded-full text-xs font-serif transition-all ${
        !selectedEra 
          ? 'bg-amber-600 text-white shadow-lg' 
          : 'bg-amber-900/20 text-amber-300 hover:bg-amber-900/40'
      }`}
    >
      Alle Epochen
    </button>
    {eras.map(era => (
      <button
        key={era}
        onClick={() => onEraChange(era === selectedEra ? null : era)}
        className={`px-3 py-1 rounded-full text-xs font-serif transition-all ${
          selectedEra === era
            ? 'bg-amber-600 text-white shadow-lg'
            : 'bg-amber-900/20 text-amber-300 hover:bg-amber-900/40'
        }`}
      >
        {era}
      </button>
    ))}
  </div>
)

// Type Filter Komponente
export const TypeFilterBar: React.FC<TypeFilterBarProps> = ({ 
  selectedTypes, 
  onTypeChange 
}) => {
  const types = [
    { key: 'era', label: 'Äras', color: 'purple' },
    { key: 'period', label: 'Perioden', color: 'blue' },
    { key: 'event', label: 'Events', color: 'green' }
  ]
  return (

    <div className="flex flex-wrap gap-2">
      {types.map(type => (
        <button
          key={type.key}
          onClick={() => onTypeChange(type.key)}
          className={`px-3 py-1 rounded-full text-xs font-serif transition-all ${
            selectedTypes.has(type.key)
              ? `bg-${type.color}-600 text-white shadow-lg`
              : `bg-${type.color}-900/20 text-${type.color}-300 hover:bg-${type.color}-900/40`
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}