// lib/games.ts
import { supabase } from './supabaseClient'

export type Game = {
  id: number
  name: string
  active: boolean
  created_at: string
}

/**
 * Lädt alle Spiele sortiert nach Erstellungsdatum
 */
export async function fetchGames(): Promise<Game[]> {
  // Supabase-Tabellen- und Spaltennamen in lowercase referenzieren
  const { data, error } = await supabase
    .from('games')  // lowercase table name
    .select('id, name, active, created_at')
    .order('created_at', { ascending: true })

    console.log('🕹️ fetchGames – data:', data)
    console.log('🕹️ fetchGames – error:', error)

  if (error) {
    console.error('Error fetching games:', error)
    throw error
  }

  // Mappe Großbuchstaben-Spalten auf lowercase fields
  return (data ?? []).map((g: any) => ({
    id: g.id,
    name: g.name,
    active: g.active,
    created_at: g.created_at,
  }))
}

/**
 * Lädt ein einzelnes Spiel anhand der ID
 */
export async function fetchGameById(id: number): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select('id, name, active, created_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching game id=${id}:`, error)
    throw error
  }

  const g = data as any
  return g
    ? { id: g.id, name: g.name, active: g.active, created_at: g.created_at }
    : null
}