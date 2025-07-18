// supabaseClient.ts - Supabase Setup & API calls

import { createClient } from '@supabase/supabase-js'
import type { TimelineDBEntry } from './Timeline/types'

// Supabase Client mit Umgebungsvariablen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Lädt alle Timeline-Daten für ein bestimmtes Spiel
 */
export async function fetchTimelineData(gameId: number): Promise<TimelineDBEntry[]> {
  const { data, error } = await supabase
    .from('timeline')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

/**
 * Lädt alle Eras für ein bestimmtes Spiel (für zukünftige Implementierung)
 * HIER SOLLEN STATT DEN DUMMY ERAS NOCH DIE KORREKTEN ERAS AUS SUPABASE GEZOGEN WERDEN
 */
export async function fetchErasFromDatabase(gameId: number): Promise<TimelineDBEntry[]> {
  const { data, error } = await supabase
    .from('timeline')
    .select('*')
    .eq('game_id', gameId)
    .eq('is_era', true)
    .order('starting_date', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

/**
 * Lädt alle Perioden für ein bestimmtes Spiel
 */
export async function fetchPeriodsFromDatabase(gameId: number): Promise<TimelineDBEntry[]> {
  const { data, error } = await supabase
    .from('timeline')
    .select('*')
    .eq('game_id', gameId)
    .eq('is_period', true)
    .order('starting_date', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

/**
 * Lädt alle Events für ein bestimmtes Spiel
 */
export async function fetchEventsFromDatabase(gameId: number): Promise<TimelineDBEntry[]> {
  const { data, error } = await supabase
    .from('timeline')
    .select('*')
    .eq('game_id', gameId)
    .eq('is_event', true)
    .order('event_date', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

/**
 * Holt den aktuell eingeloggten User
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw error
  }
  
  return user
}

/**
 * Holt die Session des aktuell eingeloggten Users
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    throw error
  }
  
  return session
}

/**
 * Lauscht auf Auth-Änderungen (Login/Logout)
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}