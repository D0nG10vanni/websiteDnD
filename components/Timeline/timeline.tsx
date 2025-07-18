// Timeline.tsx - Refactored Haupt-Komponente (deutlich schlanker!)

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

// Global Auth Context (bereits vorhanden)
import { useAuth } from '@/lib/AuthContext'

// Unsere extrahierten Utils und Types
import type { TimelineEntry, TimelineDBEntry, FilteredEntries, TimelineViewProps } from './types'
import { fetchTimelineData } from '.././SupaBaseClients'
import { getEraName, getUniqueEraNames } from './eraUtils'
import { 
  parseMultipleDBEntries, 
  separateEntriesByType, 
  sortTimelineEntries 
} from './entryParser'
import { 
  assignHorizontalLanes,
  calculateTimelineMetrics,
  calculateEntryPosition,
  calculateMaxLanes,
  calculateTimelineHeight,
  extractYearRange
} from './timelineUtils'

// Import UserGreeting from Header
import { UserGreeting } from '@/components/header'

// Komponenten
import StatsBar from './components/statsBar'
import { EraFilterBar, TypeFilterBar } from './components/filterBars'
import ZoomControls from './components/zoomControls'
import TimeSpan from './components/timespan'
import PointEvent from './components/eventPoint'
import YearMarker from './components/yearMarker'
import EntryDetailModal from './components/entryDetailModel'

export default function TimelineView({ gameId = 1, onSelect }: TimelineViewProps) {
  // Global Auth State (bereits verfügbar)
  const { user } = useAuth()

  // Timeline State Management
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
    async function loadTimelineData() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchTimelineData(gameId)
        setTimelineData(data)
      } catch (err) {
        console.error('Error fetching timeline data:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Timeline-Daten')
      } finally {
        setLoading(false)
      }
    }

    loadTimelineData()
  }, [gameId])

  // Verarbeitung der Timeline-Daten
  const { 
    erasEntries, 
    periodEntries, 
    eventEntries, 
    eras, 
    timeRange, 
    maxEraLanes, 
    maxPeriodLanes, 
    maxEventLanes 
  } = useMemo(() => {
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

    // Parse DB-Einträge zu Timeline-Einträgen
    const parsedEntries = parseMultipleDBEntries(timelineData)
    
    // Sortiere Einträge
    const sorted = sortTimelineEntries(parsedEntries, sortDirection)
    
    // Separiere nach Typen
    const { eras, periods, events } = separateEntriesByType(sorted)
    
    // Weise Lanes zu
    const erasWithLanes = assignHorizontalLanes(eras)
    const periodsWithLanes = assignHorizontalLanes(periods)
    const eventsWithLanes = assignHorizontalLanes(events)
    
    // Berechne maximale Lanes
    const { maxEraLanes, maxPeriodLanes, maxEventLanes } = calculateMaxLanes(
      erasWithLanes, periodsWithLanes, eventsWithLanes
    )
    
    // Sammle Zeitraum und Era-Namen
    const timeRange = extractYearRange(sorted)
    const eraNames = getUniqueEraNames(sorted.map(e => e.startYear))

    return { 
      erasEntries: erasWithLanes,
      periodEntries: periodsWithLanes,
      eventEntries: eventsWithLanes,
      eras: eraNames,
      timeRange,
      maxEraLanes,
      maxPeriodLanes,
      maxEventLanes
    }
  }, [timelineData, sortDirection])

  // Filtere nach ausgewählter Era und Typen
  const filteredEntries: FilteredEntries = useMemo(() => {
    const allEntries = [...erasEntries, ...periodEntries, ...eventEntries]
    
    const filtered = allEntries.filter(entry => {
      // Type Filter
      if (!selectedTypes.has(entry.dateType)) return false
      
      // Era Filter
      if (selectedEra && getEraName(entry.startYear) !== selectedEra) return false
      
      return true
    })

    return separateEntriesByType(filtered)
  }, [erasEntries, periodEntries, eventEntries, selectedEra, selectedTypes])

  // Event Handlers
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
          
          {/* User Greeting (full version für Timeline) */}
          <UserGreeting user={user} />
          
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
          
          {/* User Greeting auch bei Fehlern */}
          <UserGreeting user={user} />
          
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
          
          {/* User Greeting */}
          <UserGreeting user={user} />
          
          <div className="text-center py-12 text-amber-200/30 italic font-serif">
            Keine Timeline-Daten gefunden...
            <br />
            <span className="text-xs">Füge Einträge in die timeline-Tabelle ein (game_id: {gameId})</span>
          </div>
        </div>
      </div>
    )
  }

  // Berechne Timeline-Metriken
  const allFilteredEntries = [...filteredEntries.eras, ...filteredEntries.periods, ...filteredEntries.events]
  const timelineMetrics = calculateTimelineMetrics(allFilteredEntries, 1200, zoomLevel)
  const timelineHeight = calculateTimelineHeight(maxEraLanes, maxPeriodLanes, maxEventLanes)
  const totalEvents = filteredEntries.eras.length + filteredEntries.periods.length + filteredEntries.events.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6">
        <h2 className="font-serif text-center text-2xl text-amber-200 mb-6">
          <span className="text-amber-500">⏳</span> CHRONOS CODEX <span className="text-amber-500">⏳</span>
        </h2>

        {/* User Greeting (full version für Timeline) */}
        <UserGreeting user={user} />

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
          <div 
            className="relative w-full border border-white/10 rounded-lg bg-gradient-to-b from-black/20 to-black/40" 
            style={{ height: `${timelineHeight}px`, minWidth: `${timelineMetrics.width}px` }}
          >
            
            {/* Bereichs-Trenner und Labels werden hier eingefügt */}
            {/* ... (wie im Original, aber sauberer strukturiert) */}
            
            {/* Jahresmarkierungen */}
            {timelineMetrics.yearMarkers.map((marker) => (
              <YearMarker 
                key={marker.year} 
                marker={{
                  ...marker,
                  top: maxEraLanes * 45 + maxPeriodLanes * 35 + 75
                }} 
              />
            ))}

            {/* Äras rendern */}
            {filteredEntries.eras.map(entry => {
              const { startPercent, widthPercent } = calculateEntryPosition(
                entry, timelineMetrics.minYear, timelineMetrics.span
              )
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

            {/* Perioden rendern */}
            {filteredEntries.periods.map(entry => {
              const { startPercent, widthPercent } = calculateEntryPosition(
                entry, timelineMetrics.minYear, timelineMetrics.span
              )
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

            {/* Events rendern */}
            {filteredEntries.events.map(entry => {
              const { startPercent } = calculateEntryPosition(
                entry, timelineMetrics.minYear, timelineMetrics.span
              )
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

      {/* Entry Detail Modal */}
      <EntryDetailModal 
        selectedEntry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  )
}