// lib/characterService.ts - Service für Character-Operationen

import { supabase } from '@/lib/supabaseClient'

export type Character = {
  id: string
  name: string
  race: string
  profession: string
  background: string
  level: number
  stats: any
  game_id: string
  player_id: number // KORRIGIERT: Ist in der DB ein int8 (Zahl), keine UUID
  created_at: string
  updated_at: string
  alive: boolean
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
      .from('Users') // Achtung: Case-Sensitive, falls Tabelle "Users" heißt
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
   * Lädt alle Charaktere eines Users
   */
  static async getUserCharacters(userId: string): Promise<Character[]> {
    // 1. UUID in Zahl umwandeln
    const playerId = await this.resolvePlayerId(userId)

    // 2. Mit der Zahl abfragen
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Fehler beim Laden der Charaktere: ${error.message}`)
    }

    return data || []
  }

  /**
   * Lädt einen spezifischen Charakter
   */
  static async getCharacter(characterId: string, userId: string): Promise<Character | null> {
    const playerId = await this.resolvePlayerId(userId)

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .eq('player_id', playerId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Charakter nicht gefunden
      }
      throw new Error(`Fehler beim Laden des Charakters: ${error.message}`)
    }

    return data
  }

  /**
   * Erstellt einen neuen Charakter
   */
  static async createCharacter(characterData: CreateCharacterData, userId: string): Promise<Character> {
    const playerId = await this.resolvePlayerId(userId)

    const newCharacter = {
      ...characterData,
      player_id: playerId, // Hier speichern wir die Zahl
      level: characterData.level || 1,
      alive: characterData.alive !== undefined ? characterData.alive : true,
      stats: characterData.stats || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('characters')
      .insert([newCharacter])
      .select()
      .single()

    if (error) {
      throw new Error(`Fehler beim Erstellen des Charakters: ${error.message}`)
    }

    return data
  }

  /**
   * Aktualisiert einen Charakter
   */
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

  /**
   * Löscht einen Charakter
   */
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

  /**
   * Markiert einen Charakter als tot/lebendig
   */
  static async toggleCharacterStatus(characterId: string, userId: string): Promise<Character> {
    // getCharacter ruft resolvePlayerId bereits intern auf, das ist okay
    const character = await this.getCharacter(characterId, userId)
    if (!character) {
      throw new Error('Charakter nicht gefunden')
    }

    return this.updateCharacter(characterId, { alive: !character.alive }, userId)
  }

  /**
   * Lädt Charaktere nach Spiel
   */
  static async getCharactersByGame(gameId: string, userId: string): Promise<Character[]> {
    const playerId = await this.resolvePlayerId(userId)

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

  /**
   * Charakterstatistiken für einen User
   */
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
    // getUserCharacters nutzt bereits resolvePlayerId
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

/**
 * React Hook für Character-Management
 */
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