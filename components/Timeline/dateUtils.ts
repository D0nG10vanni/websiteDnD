// dateUtils.ts - Datum-Parser & Formatter Funktionen

/**
 * Parst verschiedene Datumsformate zu einem Date-Objekt
 * Unterstützt: YYYY-MM-DD, DD.MM.YYYY, YYYY
 */
export function parseDate(dateStr: string): Date | null {
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

/**
 * Formatiert ein Datum als DD.MM.YYYY für bessere Lesbarkeit
 */
export function formatDisplayDate(dateStr: string): string {
  const date = parseDate(dateStr)
  if (!date) return dateStr
  
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}.${month}.${year}`
}

/**
 * Extrahiert das Jahr aus einem Datumsstring
 */
export function extractYear(dateStr: string): number {
  const date = parseDate(dateStr)
  return date ? date.getFullYear() : 0
}

/**
 * Prüft ob ein Datumsstring gültig ist
 */
export function isValidDateString(dateStr: string): boolean {
  return parseDate(dateStr) !== null
}

/**
 * Berechnet die Anzahl Tage zwischen zwei Daten
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  
  if (!start || !end) return 0
  
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Berechnet die Anzahl Jahre zwischen zwei Daten
 */
export function yearsBetween(startDate: string, endDate: string): number {
  const startYear = extractYear(startDate)
  const endYear = extractYear(endDate)
  
  if (startYear === 0 || endYear === 0) return 0
  
  return Math.abs(endYear - startYear)
}