// === Types & Utils ===
import React, { useMemo, useState, useRef, useCallback } from 'react'
import type { Post } from '@/lib/types'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline'
import MarkdownRenderer from './MarkdownRenderer'

export type TimelineEntry = {
  date: string
  displayDate: string
  sortKey: number
  title: string
  id: number
  article: Post
  dateType: 'single' | 'range' | 'year' | 'dateRange'
  startYear: number
  endYear?: number
  startDate?: Date
  endDate?: Date
  duration?: number
  preview: string
  lane: number
}

type TimeRange = {
  minYear: number
  maxYear: number
}

// === Date Parser Utils ===
function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('.')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month - 1, day)
    }
  }
  return null
}

function extractDatesFromContent(content: string, article: Post): TimelineEntry[] {
  if (!content || typeof content !== 'string') return []
  
  const pattern = /§(\d{1,2}\.\d{1,2}\.\d{4}(?:-\d{1,2}\.\d{1,2}\.\d{4})?|\d{4}(?:-\d{4})?)§/g
  const matches = [...content.matchAll(pattern)]
  const preview = content.replace(/§[^§]+§/g, '').trim().substring(0, 120) + '...'

  return matches.map((match) => {
    const raw = match[1]
    let sortKey = 0
    let displayDate = raw
    let dateType: TimelineEntry['dateType'] = 'year'
    let startYear = 0
    let endYear: number | undefined
    let startDate: Date | undefined
    let endDate: Date | undefined
    let duration: number | undefined

    if (/^\d{1,2}\.\d{1,2}\.\d{4}-\d{1,2}\.\d{1,2}\.\d{4}$/.test(raw)) {
      const [startStr, endStr] = raw.split('-')
      const start = parseDate(startStr)
      const end = parseDate(endStr)
      
      if (start && end) {
        startDate = start
        endDate = end
        startYear = start.getFullYear()
        endYear = end.getFullYear()
        sortKey = start.getTime()
        displayDate = `${startStr} - ${endStr}`
        dateType = 'dateRange'
        duration = endYear - startYear
      }
    } else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(raw)) {
      const date = parseDate(raw)
      if (date) {
        startDate = date
        startYear = date.getFullYear()
        sortKey = date.getTime()
        displayDate = raw
        dateType = 'single'
      }
    } else if (/^\d{4}-\d{4}$/.test(raw)) {
      const [start, end] = raw.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end)) {
        startYear = start
        endYear = end
        sortKey = start * 365.25 * 24 * 60 * 60 * 1000
        displayDate = `${start} - ${end}`
        dateType = 'range'
        duration = end - start
      }
    } else if (/^\d{4}$/.test(raw)) {
      const year = parseInt(raw, 10)
      if (!isNaN(year)) {
        startYear = year
        sortKey = year * 365.25 * 24 * 60 * 60 * 1000
        displayDate = raw
        dateType = 'year'
      }
    }

    // Fallback für ungültige Daten
    if (isNaN(sortKey) || startYear === 0) {
      return null
    }

    return { 
      date: raw, 
      displayDate,
      sortKey, 
      title: article.title, 
      id: article.id,
      article,
      dateType,
      startYear,
      endYear: endYear ?? undefined,
      startDate,
      endDate,
      duration,
      preview,
      lane: 0
    }
  }).filter((entry): entry is Required<TimelineEntry> => entry !== null)
}

// === Era Utils ===
export function getEraName(year: number): string {
  if (year < 500) return 'Antike'
  if (year < 1000) return 'Frühmittelalter'
  if (year < 1500) return 'Hochmittelalter'
  if (year < 1800) return 'Frühe Neuzeit'
  if (year < 1900) return 'Moderne'
  if (year < 2000) return 'Zeitgenössisch'
  return 'Gegenwart'
}

export function getEraColor(year: number): string {
  if (year < 500) return 'from-purple-500 to-indigo-600'
  if (year < 1000) return 'from-blue-500 to-cyan-600'
  if (year < 1500) return 'from-green-500 to-emerald-600'
  if (year < 1800) return 'from-yellow-500 to-orange-600'
  if (year < 1900) return 'from-red-500 to-pink-600'
  if (year < 2000) return 'from-amber-500 to-yellow-600'
  return 'from-gray-500 to-slate-600'
}

// === Lane Assignment Algorithm ===
function assignLanes(entries: TimelineEntry[], timeRange: TimeRange): TimelineEntry[] {
  const sorted = [...entries].sort((a, b) => a.sortKey - b.sortKey)
  const lanes: { endYear: number; entries: TimelineEntry[] }[] = []
  
  return sorted.map(entry => {
    const startYear = entry.startYear
    const endYear = entry.endYear || startYear
    
    let assignedLane = 0
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i].endYear < startYear - 5) {
        assignedLane = i
        break
      }
      if (i === lanes.length - 1) {
        assignedLane = lanes.length
      }
    }
    
    if (assignedLane >= lanes.length) {
      lanes.push({ endYear, entries: [] })
    } else {
      lanes[assignedLane].endYear = Math.max(lanes[assignedLane].endYear, endYear)
    }
    
    const entryWithLane = { ...entry, lane: assignedLane }
    lanes[assignedLane].entries.push(entryWithLane)
    
    return entryWithLane
  })
}

// === Stats Bar Component ===
type StatsBarProps = {
  totalEvents: number
  timeSpans: number
  timePoints: number
  maxLanes: number
}

const StatsBar: React.FC<StatsBarProps> = ({ totalEvents, timeSpans, timePoints, maxLanes }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-amber-100 font-bold text-lg">{totalEvents}</div>
      <div className="text-amber-200/60 text-xs">Ereignisse</div>
    </div>
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-amber-100 font-bold text-lg">{timeSpans}</div>
      <div className="text-amber-200/60 text-xs">Zeitspannen</div>
    </div>
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-amber-100 font-bold text-lg">{timePoints}</div>
      <div className="text-amber-200/60 text-xs">Zeitpunkte</div>
    </div>
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-amber-100 font-bold text-lg">{maxLanes}</div>
      <div className="text-amber-200/60 text-xs">Spuren</div>
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

// === Timeline Entry Card Component ===
type TimelineEntryCardProps = {
  entry: TimelineEntry
  isRange: boolean
  position: { top: number; height: number }
  isLeft: boolean
  laneWidth: number
  onClick: () => void
}

const TimelineEntryCard: React.FC<TimelineEntryCardProps> = ({ 
  entry, isRange, position, isLeft, laneWidth, onClick 
}) => {
  const connectionLength = Math.min(60, laneWidth / 4)
  
  return (
    <>
      {/* Verbindungslinie zur Zeitachse */}
      <div 
        className="absolute top-6 bg-gradient-to-r from-amber-400/40 to-amber-300/30 h-0.5 rounded-full shadow-sm"
        style={{
          left: isLeft ? `${laneWidth - 20}px` : `-${connectionLength}px`,
          width: `${connectionLength}px`
        }}
      />

      {/* Verbindungspunkt an der Achse */}
      <div 
        className="absolute top-5 w-2 h-2 bg-amber-400/70 rounded-full border border-white/30 shadow-sm"
        style={{
          left: isLeft ? `${laneWidth + connectionLength - 40}px` : `-${connectionLength - 20}px`
        }}
      />

      {isRange ? (
        /* Zeitspanne als horizontaler Balken */
        <div 
          className="group cursor-pointer"
          onClick={onClick}
          style={{ height: `${position.height}px` }}
        >
          <div className={`w-full h-full rounded-xl bg-gradient-to-br ${getEraColor(entry.startYear)} opacity-90 hover:opacity-100 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-white/30 hover:border-white/50 p-4 flex flex-col justify-center backdrop-blur-sm`}>
            <div className="text-white text-lg font-bold font-serif mb-2 flex items-center">
              <span className="text-white/80 mr-2">⬟</span>
              {entry.title}
            </div>
            
            <div className="text-white/95 text-sm font-mono bg-black/20 rounded-lg px-3 py-1 mb-2 inline-block">
              {entry.displayDate}
            </div>
            
            <div className="text-white/80 text-sm">
              <span className="font-semibold">{entry.duration} Jahr{entry.duration !== 1 ? 'e' : ''}</span>
              <span className="mx-2">•</span>
              <span className="italic">{getEraName(entry.startYear)}</span>
            </div>
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white/90 text-xs mt-2 font-serif">
              ↗ Klicken für Details
            </div>
          </div>
        </div>
      ) : (
        /* Zeitpunkt als Punkt mit Karte */
        <div className="group cursor-pointer" onClick={onClick}>
          <div className="relative mx-auto mb-4" style={{ width: 'fit-content' }}>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getEraColor(entry.startYear)} shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 border-3 border-white/60 flex items-center justify-center`}>
              <div className="w-2 h-2 bg-white/80 rounded-full" />
            </div>
            <div className={`absolute inset-0 w-8 h-8 rounded-full border-2 border-amber-400/40 animate-pulse`} />
          </div>
          
          <div className="bg-gradient-to-br from-black/90 to-black/70 border-2 border-amber-900/60 rounded-xl p-4 hover:bg-gradient-to-br hover:from-black/95 hover:to-black/80 hover:border-amber-700/80 transition-all duration-300 shadow-xl backdrop-blur-sm">
            <div className="text-amber-200 font-serif font-bold text-lg mb-3 flex items-center">
              <span className="text-amber-500 mr-2">✦</span>
              {entry.title}
            </div>
            
            <div className={`inline-block px-3 py-1 rounded-lg text-sm font-mono bg-gradient-to-r ${getEraColor(entry.startYear)} text-white mb-3 shadow-md`}>
              {entry.displayDate}
            </div>
            
            <div className="text-amber-300/90 text-sm leading-relaxed mb-3 border-l-2 border-amber-600/30 pl-3">
              <MarkdownRenderer 
                content={entry.preview} 
                className="prose-timeline-preview"
                onLinkClick={() => {}}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-amber-400/70 text-sm font-serif italic">
                {getEraName(entry.startYear)}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400/80 text-xs font-serif flex items-center gap-1">
                <span>→</span>
                <span>Artikel öffnen</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// === Vertical Axis Component ===
type VerticalAxisProps = {
  timeRange: TimeRange
  timelineWidth: number
  timelineHeight: number
  zoomLevel: number
}

const VerticalAxis: React.FC<VerticalAxisProps> = ({ 
  timeRange, timelineWidth, timelineHeight, zoomLevel 
}) => {
  const yearMarkers = useMemo(() => {
    const markers = []
    const span = timeRange.maxYear - timeRange.minYear
    
    let interval
    if (span <= 50) interval = 10
    else if (span <= 100) interval = 25
    else if (span <= 200) interval = 50
    else if (span <= 500) interval = 100
    else if (span <= 1000) interval = 200
    else interval = 500
    
    const maxMarkers = 4
    const actualInterval = Math.max(interval, Math.ceil(span / maxMarkers / 10) * 10)
    
    markers.push({ 
      year: timeRange.minYear, 
      position: 0,
      isEndpoint: true 
    })
    
    if (span > 100) {
      for (let year = Math.ceil(timeRange.minYear / actualInterval) * actualInterval; 
           year < timeRange.maxYear; 
           year += actualInterval) {
        if (year > timeRange.minYear + 20 && year < timeRange.maxYear - 20) {
          const position = ((year - timeRange.minYear) / span) * 100 * zoomLevel
          markers.push({ year, position, isEndpoint: false })
        }
      }
    }
    
    markers.push({ 
      year: timeRange.maxYear, 
      position: 100 * zoomLevel,
      isEndpoint: true 
    })
    
    return markers
  }, [timeRange, zoomLevel])

  return (
    <div className="absolute" style={{ 
      left: `${timelineWidth / 2 - 2}px`,
      top: '60px',
      bottom: '60px',
      width: '6px'
    }}>
      <div className="w-full h-full bg-gradient-to-b from-amber-600/40 via-amber-500/60 to-amber-600/40 rounded-full shadow-xl border-2 border-amber-400/20" />
      
      {yearMarkers.map(({ year, position, isEndpoint }) => (
        <div
          key={year}
          className="absolute transform -translate-y-1/2"
          style={{ top: `${position + 60}px` }}
        >
          {!isEndpoint && (
            <>
              <div className="absolute right-3 flex items-center">
                <div className="text-sm text-amber-300/80 font-serif font-medium whitespace-nowrap bg-black/60 px-3 py-1 rounded-lg border border-amber-600/30 shadow-lg backdrop-blur-sm">
                  {year}
                </div>
                <div className="w-4 h-0.5 bg-amber-400/60 ml-2 rounded-full" />
              </div>
              
              <div className="absolute left-3 flex items-center">
                <div className="w-4 h-0.5 bg-amber-400/60 mr-2 rounded-full" />
                <div className="text-sm text-amber-300/80 font-serif font-medium whitespace-nowrap bg-black/60 px-3 py-1 rounded-lg border border-amber-600/30 shadow-lg backdrop-blur-sm">
                  {year}
                </div>
              </div>
              
              <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 bg-amber-400/80 rounded-full border border-white/40 shadow-md" />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// === Main Timeline Component ===
type TimelineViewProps = {
  articles: Post[]
  onSelect?: (article: Post) => void
}

export default function TimelineView({ articles, onSelect }: TimelineViewProps) {
  const [selectedEra, setSelectedEra] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedArticle, setSelectedArticle] = useState<Post | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  const { entries, eras, timeRange, maxLanes } = useMemo(() => {
    const result: TimelineEntry[] = []

    articles.forEach((article) => {
      if (article.content) {
        const dateMatches = extractDatesFromContent(article.content, article)
        result.push(...dateMatches)
      }
    })

    const sorted = result.sort((a, b) => 
      sortDirection === 'asc' ? a.sortKey - b.sortKey : b.sortKey - a.sortKey
    )

    const years = sorted.map(e => e.startYear).filter((y): y is number => typeof y === 'number')
    if (years.length === 0) {
      return { entries: [], eras: [], timeRange: { minYear: 0, maxYear: 0 }, maxLanes: 0 }
    }

    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)
    const withLanes = assignLanes(sorted, { minYear, maxYear })
    const maxLanesUsed = Math.max(...withLanes.map(e => e.lane), 0) + 1

    const eraSet = new Set<string>()
    withLanes.forEach(entry => {
      eraSet.add(getEraName(entry.startYear))
    })

    return { 
      entries: withLanes, 
      eras: Array.from(eraSet),
      timeRange: { minYear, maxYear },
      maxLanes: maxLanesUsed
    }
  }, [articles, sortDirection])

  const filteredEntries = useMemo(() => {
    if (!selectedEra) return entries
    return entries.filter(entry => getEraName(entry.startYear) === selectedEra)
  }, [entries, selectedEra])

  const handleArticleClick = useCallback((article: Post) => {
    setSelectedArticle(article)
    if (onSelect) onSelect(article)
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

  if (filteredEntries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6">
          <h2 className="font-serif text-center text-2xl text-amber-200 mb-6">
            <span className="text-amber-500">⏳</span> CHRONOS CODEX <span className="text-amber-500">⏳</span>
          </h2>
          <div className="text-center py-12 text-amber-200/30 italic font-serif">
            Keine datierten Ereignisse gefunden...
            <br />
            <span className="text-xs">Verwende das Format §Jahr§, §DD.MM.YYYY§, §Jahr1-Jahr2§ oder §DD.MM.YYYY-DD.MM.YYYY§</span>
          </div>
        </div>
      </div>
    )
  }

  const timelineHeight = Math.max(800, filteredEntries.length * 150) * zoomLevel
  const laneWidth = 300
  const timelineWidth = Math.max(800, maxLanes * laneWidth + 200)

  const calculateVerticalPosition = (entry: TimelineEntry): { top: number; height: number } => {
    const totalSpan = timeRange.maxYear - timeRange.minYear
    if (totalSpan <= 0) return { top: 0, height: 0 }
    
    const topPos = ((entry.startYear || 0) - timeRange.minYear) / totalSpan * 100 * zoomLevel
    
    if (entry.dateType === 'range' || entry.dateType === 'dateRange') {
      const bottomPos = ((entry.endYear || entry.startYear || 0) - timeRange.minYear) / totalSpan * 100 * zoomLevel
      return { 
        top: topPos, 
        height: Math.max(bottomPos - topPos, 30)
      }
    }
    
    return { top: topPos, height: 0 }
  }

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
          
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            sortDirection={sortDirection}
            onSortChange={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          />
        </div>

        <StatsBar
          totalEvents={filteredEntries.length}
          timeSpans={filteredEntries.filter(e => e.dateType === 'range' || e.dateType === 'dateRange').length}
          timePoints={filteredEntries.filter(e => e.dateType === 'single' || e.dateType === 'year').length}
          maxLanes={maxLanes}
        />
      </div>

      {/* Hinweise */}
      <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-3 text-center">
        <div className="text-amber-200/80 text-sm font-serif">
          💡 <strong>Strg + Mausrad</strong> zum Zoomen • <strong>Scrollen</strong> für Navigation • <strong>Klick</strong> für Details
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-6">
        <div className="overflow-auto" style={{ maxHeight: '800px' }} onWheel={handleScroll}>
          <div className="relative mx-auto" style={{ width: `${timelineWidth}px`, height: `${timelineHeight}px` }}>
            
            <VerticalAxis
              timeRange={timeRange}
              timelineWidth={timelineWidth}
              timelineHeight={timelineHeight}
              zoomLevel={zoomLevel}
            />

            {/* Timeline Entries */}
            {filteredEntries.map((entry, idx) => {
              const position = calculateVerticalPosition(entry)
              const isRange = entry.dateType === 'range' || entry.dateType === 'dateRange'
              const isLeft = entry.lane % 2 === 0
              const laneOffset = Math.floor(entry.lane / 2) + 1
              const horizontalPosition = isLeft 
                ? timelineWidth / 2 - 50 - (laneOffset * laneWidth)
                : timelineWidth / 2 + 50 + ((laneOffset - 1) * laneWidth)
              
              return (
                <div
                  key={`${entry.id}-${idx}`}
                  className="absolute transition-all duration-300"
                  style={{ 
                    left: `${horizontalPosition}px`,
                    top: `${position.top + 60}px`,
                    width: `${laneWidth - 20}px`
                  }}
                >
                  <TimelineEntryCard
                    entry={entry}
                    isRange={isRange}
                    position={position}
                    isLeft={isLeft}
                    laneWidth={laneWidth}
                    onClick={() => handleArticleClick(entry.article)}
                  />
                </div>
              )
            })}

            {/* Start/Ende Markierungen */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-black/90 to-black/70 border-2 border-amber-600/60 rounded-xl px-6 py-3 shadow-xl backdrop-blur-sm">
                <div className="flex items-center text-xl">
                  <span className="text-amber-500 font-bold">⟦</span>
                  <span className="font-serif text-amber-200 mx-3 font-bold">CHRONOS INITIUM</span>
                  <span className="text-amber-500 font-bold">⟧</span>
                </div>
                <div className="text-center text-amber-400/80 text-lg font-mono mt-1">{timeRange.minYear}</div>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-black/90 to-black/70 border-2 border-amber-600/60 rounded-xl px-6 py-3 shadow-xl backdrop-blur-sm">
                <div className="flex items-center text-xl">
                  <span className="text-amber-500 font-bold">⟦</span>
                  <span className="font-serif text-amber-200 mx-3 font-bold">CHRONOS FINIS</span>
                  <span className="text-amber-500 font-bold">⟧</span>
                </div>
                <div className="text-center text-amber-400/80 text-lg font-mono mt-1">{timeRange.maxYear}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Artikel-Modal */}
      <Dialog open={!!selectedArticle} onClose={() => setSelectedArticle(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="max-w-4xl w-full bg-gray-900 rounded-xl p-6 border border-amber-700 shadow-xl overflow-y-auto max-h-[80vh] text-white">
            <div className="flex justify-between items-start mb-4">
              <Dialog.Title className="text-xl font-bold text-amber-300 font-serif">
                <span className="text-amber-500 mr-2">❖</span>
                {selectedArticle?.title}
                <span className="text-amber-500 ml-2">❖</span>
              </Dialog.Title>
              <button 
                onClick={() => setSelectedArticle(null)} 
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="border-t border-amber-900/30 pt-4">
              <MarkdownRenderer 
                content={selectedArticle?.content || ''} 
                onLinkClick={(title) => {
                  const article = articles.find(a => a.title === title)
                  if (article) setSelectedArticle(article)
                }}
                className="prose-mystical"
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <style jsx>{`
        :global(.prose-mystical) {
          color: #f3f4f6;
        }
        :global(.prose-mystical h1, .prose-mystical h2, .prose-mystical h3) {
          color: #fbbf24;
        }
        :global(.prose-mystical p) {
          color: #e5e7eb;
        }
        :global(.prose-mystical strong) {
          color: #fbbf24;
        }
        
        /* Timeline Preview Styles */
        :global(.prose-timeline-preview) {
          font-size: 0.875rem;
          line-height: 1.4;
          color: #fcd34d;
        }
        :global(.prose-timeline-preview p) {
          margin: 0.25rem 0;
          color: #fde68a;
        }
        :global(.prose-timeline-preview strong) {
          color: #f59e0b;
          font-weight: 600;
        }
        :global(.prose-timeline-preview em) {
          color: #fbbf24;
          font-style: italic;
        }
        :global(.prose-timeline-preview code) {
          background: rgba(251, 191, 36, 0.1);
          color: #f59e0b;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }
        :global(.prose-timeline-preview ul, .prose-timeline-preview ol) {
          margin: 0.5rem 0;
          padding-left: 1rem;
        }
        :global(.prose-timeline-preview li) {
          margin: 0.125rem 0;
        }
        :global(.prose-timeline-preview blockquote) {
          border-left: 2px solid rgba(251, 191, 36, 0.3);
          padding-left: 0.5rem;
          margin: 0.5rem 0;
          font-style: italic;
          color: #fde68a;
        }
      `}</style>
    </div>
  )
}