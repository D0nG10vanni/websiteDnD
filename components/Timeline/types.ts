// types.ts - Alle TypeScript Definitionen für die Timeline

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
  verticalLane?: number
}

export type TimeRange = {
  minYear: number
  maxYear: number
}

export type TimelineMetrics = {
  width: number
  yearMarkers: YearMarker[]
  pixelsPerYear: number
  span: number
  minYear: number
  maxYear: number
}

export type YearMarker = {
  year: number
  percent: number
  type: string
  isImportant?: boolean
  hasEvents?: boolean
}

export type FilteredEntries = {
  eras: TimelineEntry[]
  periods: TimelineEntry[]
  events: TimelineEntry[]
}

// Props Types für Komponenten
export type StatsBarProps = {
  totalEvents: number
  eras: number
  periods: number
  events: number
  maxLanes: number
}

export type EraFilterBarProps = {
  eras: string[]
  selectedEra: string | null
  onEraChange: (era: string | null) => void
}

export type TypeFilterBarProps = {
  selectedTypes: Set<string>
  onTypeChange: (type: string) => void
}

export type ZoomControlsProps = {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  sortDirection: 'asc' | 'desc'
  onSortChange: () => void
}

export type TimeSpanProps = {
  entry: TimelineEntry
  startPercent: number
  widthPercent: number
  lane: number
  onClick: () => void
  layoutSection?: {
    top: number
    height: number
  }
}

export type PointEventProps = {
  entry: TimelineEntry
  positionPercent: number
  lane: number
  onClick: () => void
  layoutSection?: {
    top: number
    height: number
  }
  mainLineTop?: number
}

export type YearMarkerProps = {
  marker: YearMarker & { top?: number }
}

export type TimelineViewProps = {
  gameId?: number
  onSelect?: (entry: TimelineEntry) => void
}

// Supabase User Types
export type User = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    [key: string]: any
  }
  app_metadata?: {
    [key: string]: any
  }
}

// Props für UserGreeting Komponente
export type UserGreetingProps = {
  user: User | null
  loading: boolean
}