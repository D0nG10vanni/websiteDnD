// entryParser.ts - Konvertiert DB Einträge zu Timeline Einträgen

import type { TimelineDBEntry, TimelineEntry } from './types'
import { parseDate, formatDisplayDate } from './dateUtils'

/**
 * Konvertiert einen DB-Eintrag zu einem Timeline-Eintrag
 * Parst Daten und bestimmt Typ basierend auf DB-Flags
 */
export function parseDBEntry(entry: TimelineDBEntry): TimelineEntry | null {
  let startYear = 0
  let endYear: number | undefined
  let startDate: Date | undefined
  let endDate: Date | undefined
  let sortKey = 0
  let displayDate = ''
  let dateType: 'era' | 'period' | 'event' = 'event'
  let duration: number | undefined

  // Bestimme den Typ basierend auf DB-Flags
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

  // Validierung: Startjahr muss gesetzt sein
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
    lane: 0, // wird später von assignHorizontalLanes() zugewiesen
    dbEntry: entry
  }
}

/**
 * Konvertiert mehrere DB-Einträge zu Timeline-Einträgen
 * Filtert automatisch fehlerhafte Einträge heraus
 */
export function parseMultipleDBEntries(entries: TimelineDBEntry[]): TimelineEntry[] {
  const parsedEntries: TimelineEntry[] = []
  
  entries.forEach(dbEntry => {
    const parsed = parseDBEntry(dbEntry)
    if (parsed) {
      parsedEntries.push(parsed)
    }
  })
  
  return parsedEntries
}

/**
 * Separiert Timeline-Einträge nach Typ
 */
export function separateEntriesByType(entries: TimelineEntry[]): {
  eras: TimelineEntry[]
  periods: TimelineEntry[]
  events: TimelineEntry[]
} {
  const eras = entries.filter(e => e.dateType === 'era')
  const periods = entries.filter(e => e.dateType === 'period')
  const events = entries.filter(e => e.dateType === 'event')
  
  return { eras, periods, events }
}

/**
 * Sortiert Timeline-Einträge nach Datum
 */
export function sortTimelineEntries(
  entries: TimelineEntry[], 
  direction: 'asc' | 'desc' = 'asc'
): TimelineEntry[] {
  return [...entries].sort((a, b) => 
    direction === 'asc' ? a.sortKey - b.sortKey : b.sortKey - a.sortKey
  )
}

/**
 * Validiert einen DB-Eintrag auf Vollständigkeit
 */
export function validateDBEntry(entry: TimelineDBEntry): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Grundlegende Felder prüfen
  if (!entry.name || entry.name.trim() === '') {
    errors.push('Name ist erforderlich')
  }
  
  if (!entry.description || entry.description.trim() === '') {
    errors.push('Beschreibung ist erforderlich')
  }
  
  // Typ-Flags prüfen
  const typeFlags = [entry.is_era, entry.is_period, entry.is_event]
  const activeFlagsCount = typeFlags.filter(Boolean).length
  
  if (activeFlagsCount === 0) {
    errors.push('Mindestens ein Typ-Flag (is_era, is_period, is_event) muss gesetzt sein')
  }
  
  if (activeFlagsCount > 1) {
    errors.push('Nur ein Typ-Flag darf gesetzt sein')
  }
  
  // Datum-Validierung basierend auf Typ
  if (entry.is_event) {
    if (!entry.event_date) {
      errors.push('Event-Datum ist für Events erforderlich')
    } else if (!parseDate(entry.event_date)) {
      errors.push('Event-Datum hat ein ungültiges Format')
    }
  }
  
  if (entry.is_era || entry.is_period) {
    if (!entry.starting_date) {
      errors.push('Start-Datum ist für Eras und Perioden erforderlich')
    } else if (!parseDate(entry.starting_date)) {
      errors.push('Start-Datum hat ein ungültiges Format')
    }
    
    if (entry.end_date && !parseDate(entry.end_date)) {
      errors.push('End-Datum hat ein ungültiges Format')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validiert mehrere DB-Einträge und gibt einen Bericht zurück
 */
export function validateMultipleDBEntries(entries: TimelineDBEntry[]): {
  validEntries: TimelineDBEntry[]
  invalidEntries: Array<{ entry: TimelineDBEntry; errors: string[] }>
  summary: {
    total: number
    valid: number
    invalid: number
  }
} {
  const validEntries: TimelineDBEntry[] = []
  const invalidEntries: Array<{ entry: TimelineDBEntry; errors: string[] }> = []
  
  entries.forEach(entry => {
    const validation = validateDBEntry(entry)
    if (validation.isValid) {
      validEntries.push(entry)
    } else {
      invalidEntries.push({ entry, errors: validation.errors })
    }
  })
  
  return {
    validEntries,
    invalidEntries,
    summary: {
      total: entries.length,
      valid: validEntries.length,
      invalid: invalidEntries.length
    }
  }
}