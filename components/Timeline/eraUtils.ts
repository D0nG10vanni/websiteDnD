// eraUtils.ts - Era Namen, Farben & Logik

/**
 * Bestimmt den Era-Namen basierend auf dem Jahr
 * TODO: Diese Funktion soll später Eras aus Supabase laden
 */
export function getEraName(year: number): string {
  if (year < -3000) return 'Zeitalter der Elfen'
  if (year < -500) return 'Zeitalter der Zwerge'
  if (year < 0) return 'Zeitalter der Konjunktion'
  if (year < 1000) return 'Zeitalter der Menschen'
  return 'Zeitalter des Verfalls'
}

/**
 * Bestimmt die Tailwind-Farbklassen für eine Era basierend auf dem Jahr
 */
export function getEraColor(year: number): string {
  if (year < -3000) return 'from-emerald-700 to-green-900'       // Elfen
  if (year < -500) return 'from-yellow-700 to-amber-800'         // Zwerge
  if (year < 0) return 'from-purple-700 to-indigo-900'           // Konjunktion der Sphären
  if (year < 1000) return 'from-blue-600 to-cyan-700'            // Menschen
  return 'from-red-700 to-pink-800'                              // Verfall / Niedergang
}

/**
 * Bestimmt das Icon für eine Era basierend auf dem Jahr
 */
export function getEraIcon(year: number): string {
  if (year < -3000) return '🧝‍♀️'  // Elfen
  if (year < -500) return '⚒️'     // Zwerge
  if (year < 0) return '🌌'       // Konjunktion
  if (year < 1000) return '👑'    // Menschen
  return '💀'                     // Verfall
}

/**
 * Bestimmt die Beschreibung einer Era basierend auf dem Jahr
 */
export function getEraDescription(year: number): string {
  if (year < -3000) return 'Die Zeit der unsterblichen Elfen und ihrer magischen Reiche'
  if (year < -500) return 'Die goldene Ära der Zwergenmeister und großen Bergstädte'
  if (year < 0) return 'Die Konjunktion der Sphären bringt Monster und Chaos'
  if (year < 1000) return 'Menschen etablieren Königreiche und Zivilisation'
  return 'Eine Zeit des Niedergangs und der finsteren Mächte'
}

/**
 * Alle verfügbaren Eras mit ihren Eigenschaften
 */
export interface EraDefinition {
  name: string
  startYear: number
  endYear: number
  color: string
  icon: string
  description: string
}

export const ERA_DEFINITIONS: EraDefinition[] = [
  {
    name: 'Zeitalter der Elfen',
    startYear: -5000,
    endYear: -3000,
    color: 'from-emerald-700 to-green-900',
    icon: '🧝‍♀️',
    description: 'Die Zeit der unsterblichen Elfen und ihrer magischen Reiche'
  },
  {
    name: 'Zeitalter der Zwerge',
    startYear: -3000,
    endYear: -500,
    color: 'from-yellow-700 to-amber-800',
    icon: '⚒️',
    description: 'Die goldene Ära der Zwergenmeister und großen Bergstädte'
  },
  {
    name: 'Zeitalter der Konjunktion',
    startYear: -500,
    endYear: 0,
    color: 'from-purple-700 to-indigo-900',
    icon: '🌌',
    description: 'Die Konjunktion der Sphären bringt Monster und Chaos'
  },
  {
    name: 'Zeitalter der Menschen',
    startYear: 0,
    endYear: 1000,
    color: 'from-blue-600 to-cyan-700',
    icon: '👑',
    description: 'Menschen etablieren Königreiche und Zivilisation'
  },
  {
    name: 'Zeitalter des Verfalls',
    startYear: 1000,
    endYear: 9999,
    color: 'from-red-700 to-pink-800',
    icon: '💀',
    description: 'Eine Zeit des Niedergangs und der finsteren Mächte'
  }
]

/**
 * Findet die Era-Definition für ein bestimmtes Jahr
 */
export function getEraDefinition(year: number): EraDefinition {
  return ERA_DEFINITIONS.find(era => year >= era.startYear && year < era.endYear) 
    || ERA_DEFINITIONS[ERA_DEFINITIONS.length - 1] // Fallback zur letzten Era
}

/**
 * Sammelt alle einzigartigen Era-Namen aus einer Liste von Jahren
 */
export function getUniqueEraNames(years: number[]): string[] {
  const eraSet = new Set<string>()
  years.forEach(year => {
    eraSet.add(getEraName(year))
  })
  return Array.from(eraSet).sort()
}

/**
 * Prüft ob ein Jahr in einer bestimmten Era liegt
 */
export function isYearInEra(year: number, eraName: string): boolean {
  return getEraName(year) === eraName
}