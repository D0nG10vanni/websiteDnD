// timelineUtils.ts - Timeline Berechnungen, Lane Assignment & Metriken

import type { TimelineEntry, TimelineMetrics, YearMarker } from './types'

export interface LayoutSection {
  top: number
  height: number
}

export interface LayoutMetrics {
  totalHeight: number
  mainLine: { top: number }
  eraSection: LayoutSection
  periodSection: LayoutSection
  eventSection: LayoutSection
}

export function generateLayoutMetrics(
  maxEraLanes: number,
  maxPeriodLanes: number,
  maxEventLanes: number
): LayoutMetrics {
  const spacing = {
    era: 45,          // Höhe pro Ära-Lane
    period: 35,       // Höhe pro Perioden-Lane
    event: 100,       // Höhe pro Event-Lane (unterhalb der Linie)
    gap: 40,          // Abstand zwischen den Sektionen
    topOffset: 60,    // Platz ganz oben für Legende/Header
    // mainLine: 240  <-- GELÖSCHT: Kein fester Wert mehr!
  }

  // 1. Ära Sektion (Oben)
  const eraHeight = Math.max(maxEraLanes, 1) * spacing.era
  
  // 2. Perioden Sektion (Mitte)
  const periodTop = spacing.topOffset + eraHeight + spacing.gap
  const periodHeight = Math.max(maxPeriodLanes, 1) * spacing.period
  
  // 3. Hauptlinie (Dynamisch berechnet!)
  // Sie liegt unterhalb der Perioden + einem kleinen Puffer
  const mainLineTop = periodTop + periodHeight + 50 

  // 4. Event Sektion (Unten)
  const eventTop = mainLineTop + 40 // Events starten unter der Linie
  const eventHeight = Math.max(maxEventLanes, 1) * spacing.event

  const totalHeight = eventTop + eventHeight + 50

  return {
    totalHeight,
    mainLine: { top: mainLineTop },
    eraSection: {
      top: spacing.topOffset,
      height: eraHeight,
    },
    periodSection: {
      top: periodTop,
      height: periodHeight,
    },
    eventSection: {
      top: eventTop,
      height: eventHeight,
    },
  }
}

/**
 * Weist Timeline-Einträgen horizontale Lanes zu, um Überlappungen zu vermeiden
 */
export function assignHorizontalLanes(entries: TimelineEntry[]): TimelineEntry[] {
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

/**
 * Berechnet Timeline-Metriken wie Breite, Jahresmarkierungen und Pixel pro Jahr
 */
export function calculateTimelineMetrics(
  entries: TimelineEntry[], 
  containerWidth: number = 1200, 
  zoomLevel: number = 1
): TimelineMetrics {
  if (entries.length === 0) {
    return { 
      width: containerWidth, 
      yearMarkers: [], 
      pixelsPerYear: 1, 
      span: 0, 
      minYear: 0, 
      maxYear: 0 
    }
  }
  
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

/**
 * Berechnet intelligente Jahresmarkierungen für die Timeline
 */
export function calculateYearMarkers(
  minYear: number, 
  maxYear: number, 
  timelineWidth: number, 
  entries: TimelineEntry[]
): YearMarker[] {
  const span = maxYear - minYear
  const markers: YearMarker[] = []
  
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
  const epochs = [-3000, -500, 0, 1000] // Aus den Era-Definitionen
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

/**
 * Berechnet die Position und Breite eines Timeline-Eintrags in Prozent
 */
export function calculateEntryPosition(
  entry: TimelineEntry, 
  minYear: number, 
  span: number
): { startPercent: number; endPercent: number; widthPercent: number } {
  const startPercent = ((entry.startYear - minYear) / span) * 100
  const endPercent = entry.endYear ? ((entry.endYear - minYear) / span) * 100 : startPercent
  const widthPercent = Math.max(1, endPercent - startPercent) // Mindestbreite von 1%
  
  return { startPercent, endPercent, widthPercent }
}

/**
 * Berechnet die vertikale Position eines Events, um Überlappungen zu vermeiden
 */

export function assignVerticalEventLanes(events: TimelineEntry[]): TimelineEntry[] {
  const lanes: TimelineEntry[][] = []

  for (const event of events) {
    const start = event.startYear

    // Finde erste freie Lane (keine Überlappung im Jahr)
    let laneIndex = 0
    while (lanes[laneIndex]?.some(e => Math.abs(e.startYear - start) < 10)) {
      laneIndex++
    }

    if (!lanes[laneIndex]) lanes[laneIndex] = []
    lanes[laneIndex].push(event)

    event.verticalLane = laneIndex // ← neue Property für vertikale Platzierung
  }

  return events
}

/**
 * Berechnet die maximale Anzahl von Lanes für verschiedene Entry-Typen
 */
export function calculateMaxLanes(
  erasEntries: TimelineEntry[],
  periodEntries: TimelineEntry[],
  eventEntries: TimelineEntry[]
): { maxEraLanes: number; maxPeriodLanes: number; maxEventLanes: number } {
  const maxEraLanes = erasEntries.length > 0 ? Math.max(...erasEntries.map(e => e.lane)) + 1 : 0
  const maxPeriodLanes = periodEntries.length > 0 ? Math.max(...periodEntries.map(e => e.lane)) + 1 : 0
  const maxEventLanes = eventEntries.length > 0 ? Math.max(...eventEntries.map(e => e.lane)) + 1 : 0
  
  return { maxEraLanes, maxPeriodLanes, maxEventLanes }
}

/**
 * Berechnet die dynamische Höhe der Timeline basierend auf den Lanes
 */
export function calculateTimelineHeight(
  maxEraLanes: number,
  maxPeriodLanes: number,
  maxEventLanes: number
): number {
  const eraHeight = maxEraLanes * 45 + 60     // Äras oben
  const periodHeight = maxPeriodLanes * 35 + 40   // Perioden mitte  
  const eventHeight = maxEventLanes * 100 + 80    // Events unten
  
  return eraHeight + periodHeight + eventHeight + 200 // + Hauptlinie und Padding
}

/**
 * Sammelt alle Jahre aus Timeline-Einträgen für Zeitbereich-Berechnung
 */
export function extractYearRange(entries: TimelineEntry[]): { minYear: number; maxYear: number } {
  if (entries.length === 0) return { minYear: 0, maxYear: 0 }
  
  const allYears = entries.map(e => e.startYear).concat(entries.filter(e => e.endYear).map(e => e.endYear!))
  const minYear = Math.min(...allYears)
  const maxYear = Math.max(...allYears)
  
  return { minYear, maxYear }
}