// === Types & Utils ===
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline'
import { createClient } from '@supabase/supabase-js'

// Supabase Types
export type TimelineDBEntry = {
  id: number
  game_id: number
  created_at: string
  starting_date?: string
  end_date?: string
  is_period: boolean
  is_event: boolean
  event_date?: string
  description: string
  is_era: boolean
  name: string
}

export type TimelineEntry = {
  id: number
  name: string
  description: string
  displayDate: string
  sortKey: number
  dateType: 'era' | 'period' | 'event'
  startYear: number
  endYear?: number
  startDate?: Date
  endDate?: Date
  duration?: number
  lane: number
  dbEntry: TimelineDBEntry
}

type TimeRange = {
  minYear: number
  maxYear: number
}

// Supabase Client mit Umgebungsvariablen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// === Date Parser Utils ===
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  
  // ISO Date Format: YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }
  
  // German Date Format: DD.MM.YYYY
  const germanMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (germanMatch) {
    const [, day, month, year] = germanMatch
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }
  
  // Just Year: YYYY
  const yearMatch = dateStr.match(/^(\d{4})$/)
  if (yearMatch) {
    return new Date(parseInt(yearMatch[1]), 0, 1)
  }
  
  return null
}

function parseDBEntry(entry: TimelineDBEntry): TimelineEntry | null {
  let startYear = 0
  let endYear: number | undefined
  let startDate: Date | undefined
  let endDate: Date | undefined
  let sortKey = 0
  let displayDate = ''
  let dateType: 'era' | 'period' | 'event' = 'event'
  let duration: number | undefined

  // Bestimme den Typ
  if (entry.is_era) {
    dateType = 'era'
  } else if (entry.is_period) {
    dateType = 'period'
  } else if (entry.is_event) {
    dateType = 'event'
  }

  // Parse Daten basierend auf Typ
  if (dateType === 'event' && entry.event_date) {
    const eventDate = parseDate(entry.event_date)
    if (eventDate) {
      startDate = eventDate
      startYear = eventDate.getFullYear()
      sortKey = eventDate.getTime()
      displayDate = formatDisplayDate(entry.event_date)
    }
  } else if ((dateType === 'era' || dateType === 'period') && entry.starting_date) {
    const start = parseDate(entry.starting_date)
    if (start) {
      startDate = start
      startYear = start.getFullYear()
      sortKey = start.getTime()
      
      if (entry.end_date) {
        const end = parseDate(entry.end_date)
        if (end) {
          endDate = end
          endYear = end.getFullYear()
          duration = endYear - startYear
          displayDate = `${formatDisplayDate(entry.starting_date)} - ${formatDisplayDate(entry.end_date)}`
        }
      } else {
        displayDate = formatDisplayDate(entry.starting_date)
      }
    }
  }

  if (startYear === 0) {
    console.warn('Could not parse date for entry:', entry)
    return null
  }

  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    displayDate,
    sortKey,
    dateType,
    startYear,
    endYear,
    startDate,
    endDate,
    duration,
    lane: 0, // wird später zugewiesen
    dbEntry: entry
  }
}

function formatDisplayDate(dateStr: string): string {
  const date = parseDate(dateStr)
  if (!date) return dateStr
  
  // Formatiere als DD.MM.YYYY für bessere Lesbarkeit
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}.${month}.${year}`
}

// === Era Utils ===
export function getEraName(year: number): string {
  if (year < -3000) return 'Zeitalter der Elfen'
  if (year < -500) return 'Zeitalter der Zwerge'
  if (year < 0) return 'Zeitalter der Konjunktion'
  if (year < 1000) return 'Zeitalter der Menschen'
  return 'Zeitalter des Verfalls'
}

export function getEraColor(year: number): string {
  if (year < -3000) return 'from-emerald-700 to-green-900'       // Elfen
  if (year < -500) return 'from-yellow-700 to-amber-800'         // Zwerge
  if (year < 0) return 'from-purple-700 to-indigo-900'           // Konjunktion der Sphären
  if (year < 1000) return 'from-blue-600 to-cyan-700'            // Menschen
  return 'from-red-700 to-pink-800'                              // Verfall / Niedergang
}

// === Lane Assignment for Horizontal Layout ===
function assignHorizontalLanes(entries: TimelineEntry[]): TimelineEntry[] {
  const sorted = [...entries].sort((a, b) => a.sortKey - b.sortKey)
  const lanes: Array<{ endYear: number }> = []
  
  return sorted.map((entry) => {
    const startYear = entry.startYear
    const endYear = entry.endYear || startYear
    
    let assignedLane = -1
    
    // Suche nach verfügbarer Lane
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i].endYear < startYear - 5) { // 5 Jahre Mindestabstand
        assignedLane = i
        break
      }
    }
    
    // Wenn keine Lane gefunden, erstelle neue
    if (assignedLane === -1) {
      assignedLane = lanes.length
      lanes.push({ endYear })
    } else {
      lanes[assignedLane].endYear = Math.max(lanes[assignedLane].endYear, endYear)
    }
    
    return { ...entry, lane: assignedLane }
  })
}

// === Stats Bar Component ===
type StatsBarProps = {
  totalEvents: number
  eras: number
  periods: number
  events: number
  maxLanes: number
}

const StatsBar: React.FC<StatsBarProps> = ({ totalEvents, eras, periods, events, maxLanes }) => (
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

// === Era Filter Bar Component ===
type EraFilterBarProps = {
  eras: string[]
  selectedEra: string | null
  onEraChange: (era: string | null) => void
}

const EraFilterBar: React.FC<EraFilterBarProps> = ({ eras, selectedEra, onEraChange }) => (
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

// === Type Filter Bar Component ===
type TypeFilterBarProps = {
  selectedTypes: Set<string>
  onTypeChange: (type: string) => void
}

const TypeFilterBar: React.FC<TypeFilterBarProps> = ({ selectedTypes, onTypeChange }) => {
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

// === Zoom Controls Component ===
type ZoomControlsProps = {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  sortDirection: 'asc' | 'desc'
  onSortChange: () => void
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ 
  zoomLevel, onZoomIn, onZoomOut, sortDirection, onSortChange 
}) => (
  <div className="flex items-center gap-4">
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
    
    <div className="flex items-center gap-2">
      <span className="text-amber-200/60 text-sm font-serif">Sortierung:</span>
      <button
        onClick={onSortChange}
        className="px-3 py-1 bg-amber-900/20 hover:bg-amber-900/40 rounded text-amber-300 text-sm font-serif transition-colors"
      >
        {sortDirection === 'asc' ? '↗ Alt → Neu' : '↙ Neu → Alt'}
      </button>
    </div>
  </div>
)

// === Horizontal Timeline Components ===
type TimeSpanProps = {
  entry: TimelineEntry
  startPercent: number
  widthPercent: number
  lane: number
  onClick: () => void
}

const TimeSpan: React.FC<TimeSpanProps> = ({ entry, startPercent, widthPercent, lane, onClick }) => {
  const isEra = entry.dateType === 'era'
  const isPeriod = entry.dateType === 'period'
  
  // Dynamische Positionierung basierend auf Typ
  let topOffset = 0
  let height = 0
  let barHeight = ''
  let zIndex = 10
  
  if (isEra) {
    topOffset = 40 + lane * 45  // Äras ganz oben
    height = 35
    barHeight = 'h-3'
    zIndex = 30
  } else if (isPeriod) {
    topOffset = 120 + lane * 35  // Perioden in der Mitte
    height = 30
    barHeight = 'h-2'
    zIndex = 20
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

type PointEventProps = {
  entry: TimelineEntry
  positionPercent: number
  lane: number
  onClick: () => void
}

const PointEvent: React.FC<PointEventProps> = ({ entry, positionPercent, lane, onClick }) => {
  const bottomOffset = 280 + lane * 100 // Events unterhalb der Hauptlinie
  
  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        left: `${positionPercent}%`,
        top: '240px',
        transform: 'translateX(-50%)',
        zIndex: 40
      }}
      onClick={onClick}
    >
      {/* Verbindungslinie nach unten */}
      <div 
        className="absolute left-1/2 top-0 w-0.5 bg-gradient-to-b from-amber-400/80 to-amber-400/30 transform -translate-x-0.5 rounded-full"
        style={{ height: `${bottomOffset - 240}px` }}
      />
      
      {/* Hauptpunkt mit Glow-Effekt */}
      <div className="relative">
        <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${getEraColor(entry.startYear)} border-2 border-white shadow-lg group-hover:scale-125 transition-all duration-300`}>
          {/* Innerer Glow */}
          <div className="absolute inset-0.5 bg-white/30 rounded-full blur-sm"></div>
        </div>
        
        {/* Pulsierender Ring bei Hover */}
        <div className="absolute inset-0 rounded-full bg-amber-400/20 scale-150 opacity-0 group-hover:opacity-100 group-hover:scale-200 transition-all duration-500"></div>
      </div>
      
      {/* Info-Card mit verbessertem Design */}
      <div 
        className="absolute bg-gray-900/95 border border-amber-500/60 rounded-xl p-4 text-sm text-white font-serif shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 w-[280px] transform group-hover:scale-105"
        style={{ 
          top: `${bottomOffset - 240}px`,
          left: '-140px'
        }}
      >
        {/* Header mit Icon und Typ */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-600/30">
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
          <div className="text-gray-200 text-sm leading-relaxed line-clamp-3">
            {entry.description.substring(0, 150)}...
          </div>
        </div>
        
        {/* Pfeil zur Verbindung */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-amber-500/60"></div>
      </div>
    </div>
  )
}

// === Dynamic Timeline Logic ===
function calculateTimelineMetrics(entries: TimelineEntry[], containerWidth: number = 1200, zoomLevel: number = 1) {
  if (entries.length === 0) return { width: containerWidth, yearMarkers: [], pixelsPerYear: 1 }
  
  const years = entries.map(e => e.startYear).concat(entries.filter(e => e.endYear).map(e => e.endYear!))
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const span = maxYear - minYear
  
  // Dynamische Breite basierend auf Zeitspanne und Ereignisdichte
  const eventDensity = entries.length / span
  let basePixelsPerYear = 2
  
  // Anpassung basierend auf Zeitspanne
  if (span > 2000) basePixelsPerYear = 0.8
  else if (span > 1000) basePixelsPerYear = 1.2
  else if (span > 500) basePixelsPerYear = 2
  else if (span > 100) basePixelsPerYear = 4
  else if (span > 50) basePixelsPerYear = 8
  else basePixelsPerYear = 12
  
  // Anpassung basierend auf Ereignisdichte
  if (eventDensity > 1) basePixelsPerYear *= 1.5
  else if (eventDensity > 0.5) basePixelsPerYear *= 1.2
  
  const pixelsPerYear = basePixelsPerYear * zoomLevel
  const calculatedWidth = Math.max(containerWidth, span * pixelsPerYear)
  
  // Intelligente Jahresmarkierungen
  const yearMarkers = calculateYearMarkers(minYear, maxYear, calculatedWidth, entries)
  
  return {
    width: calculatedWidth,
    yearMarkers,
    pixelsPerYear,
    span,
    minYear,
    maxYear
  }
}

function calculateYearMarkers(minYear: number, maxYear: number, timelineWidth: number, entries: TimelineEntry[]) {
  const span = maxYear - minYear
  const markers: Array<{
    year: number
    percent: number
    type: string
    isImportant?: boolean
    hasEvents?: boolean
  }> = []
  
  // Zielabstand zwischen Markierungen (in Pixeln)
  const targetSpacing = 100
  const maxMarkers = Math.floor(timelineWidth / targetSpacing)
  
  // Berechne optimales Intervall
  let interval = Math.ceil(span / maxMarkers)
  
  // Runde auf "schöne" Zahlen
  const niceIntervals = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000]
  interval = niceIntervals.find(nice => nice >= interval) || interval
  
  // Erkenne wichtige historische Wendepunkte in den Daten
  const eventYears = new Set(entries.map(e => e.startYear))
  const importantYears = []
  
  // Jahrhundertwenden
  for (let century = Math.floor(minYear / 100) * 100; century <= maxYear; century += 100) {
    if (century >= minYear && century <= maxYear) {
      importantYears.push({ year: century, type: 'century' })
    }
  }
  
  // Epochenwechsel
  const epochs = [500, 1000, 1500, 1800, 1900, 2000]
  epochs.forEach(epoch => {
    if (epoch >= minYear && epoch <= maxYear) {
      importantYears.push({ year: epoch, type: 'epoch' })
    }
  })
  
  // Füge Start- und Endpunkt hinzu
  markers.push({ 
    year: minYear, 
    percent: 0, 
    type: 'endpoint',
    isImportant: false 
  })
  
  // Reguläre Intervall-Markierungen
  for (let year = Math.ceil(minYear / interval) * interval; year < maxYear; year += interval) {
    const percent = ((year - minYear) / span) * 100
    const isImportant = importantYears.some(imp => Math.abs(imp.year - year) <= interval / 4)
    const hasEvents = eventYears.has(year) || 
                     Array.from(eventYears).some(eventYear => Math.abs(eventYear - year) <= 2)
    
    markers.push({ 
      year, 
      percent, 
      type: 'regular',
      isImportant,
      hasEvents
    })
  }
  
  // Füge wichtige Jahre hinzu, auch wenn sie nicht im Raster liegen
  importantYears.forEach(({ year, type }) => {
    if (!markers.some(m => Math.abs(m.year - year) <= interval / 4)) {
      const percent = ((year - minYear) / span) * 100
      markers.push({ 
        year, 
        percent, 
        type: type as 'epoch' | 'century',
        isImportant: true,
        hasEvents: eventYears.has(year)
      })
    }
  })
  
  // Endpunkt
  markers.push({ 
    year: maxYear, 
    percent: 100, 
    type: 'endpoint',
    isImportant: false 
  })
  
  return markers.sort((a, b) => a.year - b.year)
}

// === Enhanced Year Marker Component ===
type YearMarkerProps = {
  marker: {
    year: number
    percent: number
    type: string
    isImportant?: boolean
    hasEvents?: boolean
    top?: number
  }
}

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
        {marker.hasEvents && <span className="text-xs ml-1">●</span>}
      </div>
    </div>
  )
}

// === Main Timeline Component ===
type TimelineViewProps = {
  gameId?: number
  onSelect?: (entry: TimelineEntry) => void
}

export default function TimelineView({ gameId = 1, onSelect }: TimelineViewProps) {
  const [timelineData, setTimelineData] = useState<TimelineDBEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEra, setSelectedEra] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['era', 'period', 'event']))
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  // Daten von Supabase laden
  useEffect(() => {
    async function fetchTimelineData() {
      try {
        setLoading(true)
        setError(null)
        
        const { data, error } = await supabase
          .from('timeline')
          .select('*')
          .eq('game_id', gameId)
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        setTimelineData(data || [])
      } catch (err) {
        console.error('Error fetching timeline data:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Timeline-Daten')
      } finally {
        setLoading(false)
      }
    }

    fetchTimelineData()
  }, [gameId])

  const { erasEntries, periodEntries, eventEntries, eras, timeRange, maxEraLanes, maxPeriodLanes, maxEventLanes } = useMemo(() => {
    if (timelineData.length === 0) {
      return { 
        erasEntries: [], 
        periodEntries: [], 
        eventEntries: [], 
        eras: [], 
        timeRange: { minYear: 0, maxYear: 0 }, 
        maxEraLanes: 0, 
        maxPeriodLanes: 0, 
        maxEventLanes: 0 
      }
    }

    const parsedEntries: TimelineEntry[] = []
    
    // Parse alle DB Einträge
    timelineData.forEach(dbEntry => {
      const parsed = parseDBEntry(dbEntry)
      if (parsed) {
        parsedEntries.push(parsed)
      }
    })

    // Sortiere Einträge
    const sorted = parsedEntries.sort((a, b) => 
      sortDirection === 'asc' ? a.sortKey - b.sortKey : b.sortKey - a.sortKey
    )

    // Separiere nach Typen
    const eras = sorted.filter(e => e.dateType === 'era')
    const periods = sorted.filter(e => e.dateType === 'period')
    const events = sorted.filter(e => e.dateType === 'event')

    // Weise Lanes zu
    const erasWithLanes = assignHorizontalLanes(eras)
    const periodsWithLanes = assignHorizontalLanes(periods)
    const eventsWithLanes = assignHorizontalLanes(events)

    // Berechne maximale Lanes
    const maxEraLanesUsed = erasWithLanes.length > 0 ? Math.max(...erasWithLanes.map(e => e.lane)) + 1 : 0
    const maxPeriodLanesUsed = periodsWithLanes.length > 0 ? Math.max(...periodsWithLanes.map(e => e.lane)) + 1 : 0
    const maxEventLanesUsed = eventsWithLanes.length > 0 ? Math.max(...eventsWithLanes.map(e => e.lane)) + 1 : 0

    // Sammle alle Jahre für Zeitraum
    const allYears = sorted.map(e => e.startYear).concat(sorted.filter(e => e.endYear).map(e => e.endYear!))
    const minYear = allYears.length > 0 ? Math.min(...allYears) : 0
    const maxYear = allYears.length > 0 ? Math.max(...allYears) : 0

    // Sammle einzigartige Era-Namen
    const eraSet = new Set<string>()
    sorted.forEach(entry => {
      eraSet.add(getEraName(entry.startYear))
    })

    return { 
      erasEntries: erasWithLanes,
      periodEntries: periodsWithLanes,
      eventEntries: eventsWithLanes,
      eras: Array.from(eraSet),
      timeRange: { minYear, maxYear },
      maxEraLanes: maxEraLanesUsed,
      maxPeriodLanes: maxPeriodLanesUsed,
      maxEventLanes: maxEventLanesUsed
    }
  }, [timelineData, sortDirection])

  // Filtere nach ausgewählter Era und Typen
  const filteredEntries = useMemo(() => {
    const allEntries = [...erasEntries, ...periodEntries, ...eventEntries]
    
    let filtered = allEntries.filter(entry => {
      // Type Filter
      if (!selectedTypes.has(entry.dateType)) return false
      
      // Era Filter
      if (selectedEra && getEraName(entry.startYear) !== selectedEra) return false
      
      return true
    })

    return {
      eras: filtered.filter(e => e.dateType === 'era'),
      periods: filtered.filter(e => e.dateType === 'period'),
      events: filtered.filter(e => e.dateType === 'event')
    }
  }, [erasEntries, periodEntries, eventEntries, selectedEra, selectedTypes])

  const handleEntryClick = useCallback((entry: TimelineEntry) => {
    setSelectedEntry(entry)
    if (onSelect) onSelect(entry)
  }, [onSelect])

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5))
  }, [])

  const handleScroll = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY < 0) {
        handleZoomIn()
      } else {
        handleZoomOut()
      }
    }
  }, [handleZoomIn, handleZoomOut])

  const handleTypeChange = useCallback((type: string) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }, [])

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6">
          <h2 className="font-serif text-center text-2xl text-amber-200 mb-6">
            <span className="text-amber-500">⏳</span> CHRONOS CODEX <span className="text-amber-500">⏳</span>
          </h2>
          <div className="text-center py-12 text-amber-200/60 italic font-serif">
            Lade Timeline-Daten...
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-red-900/40 p-6">
          <h2 className="font-serif text-center text-2xl text-red-200 mb-6">
            <span className="text-red-500">⚠️</span> FEHLER <span className="text-red-500">⚠️</span>
          </h2>
          <div className="text-center py-12 text-red-200/80 font-serif">
            {error}
            <div className="mt-4 text-sm text-red-200/60">
              Bitte überprüfe deine Supabase-Konfiguration und Netzwerkverbindung.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty State
  if (timelineData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6">
          <h2 className="font-serif text-center text-2xl text-amber-200 mb-6">
            <span className="text-amber-500">⏳</span> CHRONOS CODEX <span className="text-amber-500">⏳</span>
          </h2>
          <div className="text-center py-12 text-amber-200/30 italic font-serif">
            Keine Timeline-Daten gefunden...
            <br />
            <span className="text-xs">Füge Einträge in die timeline-Tabelle ein (game_id: {gameId})</span>
          </div>
        </div>
      </div>
    )
  }

  const allFilteredEntries = [...filteredEntries.eras, ...filteredEntries.periods, ...filteredEntries.events]
  const timelineMetrics = calculateTimelineMetrics(allFilteredEntries, 1200, zoomLevel)
  
  // Dynamische Höhenberechnung mit mehr Platz
  const eraHeight = maxEraLanes * 45 + 60    // Äras oben
  const periodHeight = maxPeriodLanes * 35 + 40  // Perioden mitte  
  const eventHeight = maxEventLanes * 100 + 80   // Events unten
  const timelineHeight = eraHeight + periodHeight + eventHeight + 200 // + Hauptlinie und Padding

  const calculatePosition = (entry: TimelineEntry) => {
    const minYear = timelineMetrics.minYear ?? 0
    const span = timelineMetrics.span ?? 1
    const startPercent = ((entry.startYear - minYear) / span) * 100
    const endPercent = entry.endYear ? ((entry.endYear - minYear) / span) * 100 : startPercent
    return { startPercent, endPercent, widthPercent: Math.max(1, endPercent - startPercent) } // Mindestbreite
  }

  const totalEvents = filteredEntries.eras.length + filteredEntries.periods.length + filteredEntries.events.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6">
        <h2 className="font-serif text-center text-2xl text-amber-200 mb-6">
          <span className="text-amber-500">⏳</span> CHRONOS CODEX <span className="text-amber-500">⏳</span>
        </h2>

        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <EraFilterBar 
            eras={eras}
            selectedEra={selectedEra}
            onEraChange={setSelectedEra}
          />
          
          <TypeFilterBar
            selectedTypes={selectedTypes}
            onTypeChange={handleTypeChange}
          />
          
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            sortDirection={sortDirection}
            onSortChange={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          />
        </div>

        <StatsBar
          totalEvents={totalEvents}
          eras={filteredEntries.eras.length}
          periods={filteredEntries.periods.length}
          events={filteredEntries.events.length}
          maxLanes={Math.max(maxEraLanes, maxPeriodLanes, maxEventLanes)}
        />
      </div>

      {/* Legende */}
      <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-gradient-to-r from-purple-700 to-indigo-900 rounded border border-purple-400"></div>
              <span className="text-amber-200/80 text-sm font-serif">👑 Äras</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-gradient-to-r from-blue-600 to-cyan-700 rounded border border-blue-400"></div>
              <span className="text-amber-200/80 text-sm font-serif">📜 Perioden</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-br from-red-700 to-pink-800 rounded-full border border-white"></div>
              <span className="text-amber-200/80 text-sm font-serif">⚡ Events</span>
            </div>
          </div>
          <div className="text-amber-200/60 text-sm font-serif">
            💡 <strong>Strg + Mausrad</strong> zum Zoomen • <strong>Hover</strong> für Details
          </div>
        </div>
      </div>

      {/* Horizontal Timeline */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-6">
        <div className="overflow-auto" style={{ maxHeight: '700px' }} onWheel={handleScroll}>
          <div className="relative w-full border border-white/10 rounded-lg bg-gradient-to-b from-black/20 to-black/40" style={{ height: `${timelineHeight}px`, minWidth: `${timelineMetrics.width}px` }}>
            
            {/* Bereichs-Trenner */}
            <div className="absolute w-full border-t border-dashed border-purple-400/30" style={{ top: `${eraHeight}px` }}>
              <div className="absolute -top-2 left-4 bg-black px-2 text-xs text-purple-300 font-serif">Äras</div>
            </div>
            <div className="absolute w-full border-t border-dashed border-blue-400/30" style={{ top: `${eraHeight + periodHeight}px` }}>
              <div className="absolute -top-2 left-4 bg-black px-2 text-xs text-blue-300 font-serif">Perioden</div>
            </div>
            
            {/* Hauptlinie (horizontal, prominent) */}
            <div 
              className="absolute w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full shadow-lg" 
              style={{ top: `${eraHeight + periodHeight + 40}px` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
            </div>
            
            {/* Hauptlinie Label */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 bg-black/80 px-3 py-1 rounded-full border border-amber-500/50"
              style={{ top: `${eraHeight + periodHeight + 25}px` }}
            >
              <span className="text-amber-300 text-xs font-serif font-bold">⟦ ZEITLINIE ⟧</span>
            </div>
            
            {/* Events Label */}
            <div className="absolute w-full border-t border-dashed border-green-400/30" style={{ top: `${eraHeight + periodHeight + 80}px` }}>
              <div className="absolute -top-2 left-4 bg-black px-2 text-xs text-green-300 font-serif">Events</div>
            </div>
            
            {/* Dynamische Jahresmarkierungen */}
            {timelineMetrics.yearMarkers.map((marker) => (
              <YearMarker 
                key={marker.year} 
                marker={{
                  ...marker,
                  top: eraHeight + periodHeight + 35 // Angepasste Position
                }} 
              />
            ))}

            {/* Timeline-Info */}
            <div className="absolute text-amber-300/60 text-xs font-serif bg-black/60 px-2 py-1 rounded" style={{ left: '20px', top: `${timelineHeight - 30}px` }}>
              {timelineMetrics.span} Jahre • {timelineMetrics.pixelsPerYear.toFixed(1)} px/Jahr • {Math.round(timelineMetrics.width)}px
            </div>

            {/* Start/Ende Markierungen */}
            <div className="absolute text-amber-400 text-sm font-serif font-bold bg-black/80 px-3 py-1 rounded border border-amber-500/50" style={{ left: '20px', top: '10px' }}>
              ⟦ {timelineMetrics.minYear} ⟧
            </div>
            <div className="absolute text-amber-400 text-sm font-serif font-bold bg-black/80 px-3 py-1 rounded border border-amber-500/50" style={{ right: '20px', top: '10px' }}>
              ⟦ {timelineMetrics.maxYear} ⟧
            </div>

            {/* Äras (oberster Bereich) */}
            {filteredEntries.eras.map(entry => {
              const { startPercent, widthPercent } = calculatePosition(entry)
              return (
                <TimeSpan
                  key={`era-${entry.id}-${entry.lane}`}
                  entry={entry}
                  startPercent={startPercent}
                  widthPercent={widthPercent}
                  lane={entry.lane}
                  onClick={() => handleEntryClick(entry)}
                />
              )
            })}

            {/* Perioden (mittlerer Bereich) */}
            {filteredEntries.periods.map(entry => {
              const { startPercent, widthPercent } = calculatePosition(entry)
              return (
                <TimeSpan
                  key={`period-${entry.id}-${entry.lane}`}
                  entry={entry}
                  startPercent={startPercent}
                  widthPercent={widthPercent}
                  lane={entry.lane}
                  onClick={() => handleEntryClick(entry)}
                />
              )
            })}

            {/* Events (unterer Bereich) */}
            {filteredEntries.events.map(entry => {
              const { startPercent } = calculatePosition(entry)
              return (
                <PointEvent
                  key={`event-${entry.id}-${entry.lane}`}
                  entry={entry}
                  positionPercent={startPercent}
                  lane={entry.lane}
                  onClick={() => handleEntryClick(entry)}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Entry-Detail-Modal */}
      <Dialog open={!!selectedEntry} onClose={() => setSelectedEntry(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="max-w-4xl w-full bg-gray-900 rounded-xl p-6 border border-amber-700 shadow-xl overflow-y-auto max-h-[80vh] text-white">
            <div className="flex justify-between items-start mb-4">
              <Dialog.Title className="text-xl font-bold text-amber-300 font-serif">
                <span className="text-amber-500 mr-2">
                  {selectedEntry?.dateType === 'era' ? '👑' : 
                   selectedEntry?.dateType === 'period' ? '📜' : '⚡'}
                </span>
                {selectedEntry?.name}
                <span className="text-amber-500 ml-2">❖</span>
              </Dialog.Title>
              <button 
                onClick={() => setSelectedEntry(null)} 
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {selectedEntry && (
              <div className="border-t border-amber-900/30 pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-amber-200/60 text-xs mb-1">Typ</div>
                    <div className="text-amber-300 font-semibold">
                      {selectedEntry.dateType === 'era' ? 'Ära' :
                       selectedEntry.dateType === 'period' ? 'Periode' : 'Ereignis'}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-amber-200/60 text-xs mb-1">Datum/Zeitraum</div>
                    <div className="text-amber-300 font-semibold">{selectedEntry.displayDate}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-amber-200/60 text-xs mb-1">Zeitalter</div>
                    <div className="text-amber-300 font-semibold">{getEraName(selectedEntry.startYear)}</div>
                  </div>
                </div>
                
                {selectedEntry.duration && (
                  <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-3">
                    <div className="text-amber-200/60 text-xs mb-1">Dauer</div>
                    <div className="text-amber-300">{selectedEntry.duration} Jahre</div>
                  </div>
                )}
                
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="text-amber-200/60 text-xs mb-2">Beschreibung</div>
                  <div className="text-gray-200 leading-relaxed">{selectedEntry.description}</div>
                </div>
                
                <div className="text-xs text-gray-400 mt-4">
                  ID: {selectedEntry.id} • Erstellt am: {new Date(selectedEntry.dbEntry.created_at).toLocaleString('de-DE')}
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      <style jsx>{`
        :global(.line-clamp-3) {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}