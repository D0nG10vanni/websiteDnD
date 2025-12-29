// lib/characterService.ts - Service für Character-Operationen

import { supabase } from '@/lib/supabaseClient'

// Typ für das Inventar definieren (optional, aber hilfreich für TypeScript)
export type InventoryEntry = {
  id: number
  quantity: number
  equipped: boolean
  custom_name?: string
  items: {
    id: number
    name: string
    type: string
    rarity: string
    damage?: string
    armor_sp?: number
    weight?: number
    price?: number
    description?: string
    effects?: any
  } | null
}

export type Character = {
  id: string
  name: string
  race: string
  profession: string
  background: string
  level: number
  stats: any
  game_id?: number | null
  games?: {
    name: string
  }
  player_id: number
  created_at: string
  updated_at: string
  alive: boolean
  // NEU: Inventar Feld hinzufügen
  inventory?: InventoryEntry[]
}

export type CreateCharacterData = {
  name: string
  race: string
  profession: string
  background?: string
  level?: number
  stats?: any
  game_id?: string
  alive?: boolean
}

export class CharacterService {
  /**
   * HILFSMETHODE: Löst die Auth-UUID in die interne player_id (Zahl) auf
   */
  private static async resolvePlayerId(authUserId: string): Promise<number> {
    const { data, error } = await supabase
      .from('Users')
      .select('player_id')
      .eq('user_id', authUserId)
      .single()

    if (error || !data) {
      console.error('ID-Resolution Error:', error)
      throw new Error('Benutzerprofil konnte nicht aufgelöst werden.')
    }

    return data.player_id
  }

  /**
   * Lädt alle Charaktere eines Users (INKLUSIVE INVENTAR)
   */
  static async getUserCharacters(userId: string): Promise<Character[]> {
    const playerId = await this.resolvePlayerId(userId)

    const { data, error } = await supabase
      .from('characters')
      // UPDATE: Query erweitert um inventory:character_items und items:items
      .select(`
        *, 
        games (name),
        inventory:character_items(
          id,
          quantity,
          equipped,
          custom_name,
          items:items(*)
        )
      `) 
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Fehler beim Laden der Charaktere: ${error.message}`)
    }

    return (data as unknown as Character[]) || []
  }

  /**
   * Lädt einen spezifischen Charakter (INKLUSIVE INVENTAR)
   */
  static async getCharacter(characterId: string, userId: string): Promise<Character | null> {
    const playerId = await this.resolvePlayerId(userId)

    const { data, error } = await supabase
      .from('characters')
      // UPDATE: Auch hier das Inventar laden, damit es beim Einzelabruf da ist
      .select(`
        *, 
        games (name),
        inventory:character_items(
          id,
          quantity,
          equipped,
          custom_name,
          items:items(*)
        )
      `)
      .eq('id', characterId)
      .eq('player_id', playerId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Charakter nicht gefunden
      }
      throw new Error(`Fehler beim Laden des Charakters: ${error.message}`)
    }

    return data as unknown as Character
  }

  // ... Rest der Klasse bleibt unverändert ...

  /**
   * Lädt alle Spiele, in denen der User (via player_id) Mitglied ist.
   */
  static async getUserGames(userId: string): Promise<{ id: number; name: string }[]> {
    const playerId = await this.resolvePlayerId(userId)

    const { data, error } = await supabase
      .from('game_players')
      .select('game_id, games (id, name)')
      .eq('player_id', playerId)

    if (error) {
      console.error('Fehler beim Laden der Spiele:', error)
      return []
    }

    return data.map((entry: any) => ({
      id: entry.games.id,
      name: entry.games.name
    }))
  }

  static async createCharacter(characterData: CreateCharacterData, userId: string): Promise<Character> {
    const playerId = await this.resolvePlayerId(userId)

    const newCharacter = {
      ...characterData,
      player_id: playerId,
      game_id: characterData.game_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase.from('characters').insert([newCharacter]).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  static async updateCharacter(
    characterId: string, 
    updates: Partial<CreateCharacterData>, 
    userId: string
  ): Promise<Character> {
    const playerId = await this.resolvePlayerId(userId)

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('characters')
      .update(updateData)
      .eq('id', characterId)
      .eq('player_id', playerId)
      .select()
      .single()

    if (error) {
      throw new Error(`Fehler beim Aktualisieren des Charakters: ${error.message}`)
    }

    return data
  }

  static async deleteCharacter(characterId: string, userId: string): Promise<void> {
    const playerId = await this.resolvePlayerId(userId)

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)
      .eq('player_id', playerId)

    if (error) {
      throw new Error(`Fehler beim Löschen des Charakters: ${error.message}`)
    }
  }

  static async toggleCharacterStatus(characterId: string, userId: string): Promise<Character> {
    const character = await this.getCharacter(characterId, userId)
    if (!character) {
      throw new Error('Charakter nicht gefunden')
    }

    return this.updateCharacter(characterId, { alive: !character.alive }, userId)
  }

  static async getCharactersByGame(gameId: string, userId: string): Promise<Character[]> {
    const playerId = await this.resolvePlayerId(userId)

    // Optional: Hier könnte man auch das Inventar laden, falls der GM es sehen soll
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Fehler beim Laden der Spiel-Charaktere: ${error.message}`)
    }

    return data || []
  }

  static async getCharacterStats(userId: string): Promise<{
    total: number
    alive: number
    dead: number
    averageLevel: number
    uniqueRaces: number
    uniqueProfessions: number
    byRace: Record<string, number>
    byProfession: Record<string, number>
  }> {
    const characters = await this.getUserCharacters(userId)

    const alive = characters.filter(c => c.alive).length
    const dead = characters.length - alive
    const averageLevel = characters.length > 0 
      ? Math.round(characters.reduce((sum, c) => sum + c.level, 0) / characters.length)
      : 0

    const byRace: Record<string, number> = {}
    const byProfession: Record<string, number> = {}

    characters.forEach(character => {
      byRace[character.race] = (byRace[character.race] || 0) + 1
      byProfession[character.profession] = (byProfession[character.profession] || 0) + 1
    })

    return {
      total: characters.length,
      alive,
      dead,
      averageLevel,
      uniqueRaces: Object.keys(byRace).length,
      uniqueProfessions: Object.keys(byProfession).length,
      byRace,
      byProfession
    }
  }
}

// ... Hook (useUserCharacters) bleibt gleich, da er CharacterService aufruft ...
import { useState, useEffect } from 'react'

export function useUserCharacters(userId: string | undefined) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCharacters = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await CharacterService.getUserCharacters(userId)
      setCharacters(data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCharacters()
  }, [userId])

  const refetch = async () => {
    await fetchCharacters()
  }

  return {
    characters,
    loading,
    error,
    refetch
  }
}