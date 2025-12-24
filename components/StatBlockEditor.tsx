'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { CharacterService, type Character } from '@/lib/characterService' // Importiere Character Typ

// --- Types ---
type CoreStats = {
  INT: number
  REF: number
  DEX: number
  BODY: number
  SPD: number
  EMP: number
  CRA: number
  WILL: number
  LUCK: number
}

type DerivedStats = {
  STUN: number
  RUN: number
  LEAP: number
  HP: number
  STA: number
  ENC: number
  REC: number
  VIGOR: number
}

const baseStats: CoreStats = {
  INT: 5, REF: 5, DEX: 5, BODY: 5, SPD: 5,
  EMP: 5, CRA: 5, WILL: 5, LUCK: 5
}

const professions: Record<string, Partial<CoreStats>> = {
  Witcher: { REF: 1, DEX: 1, EMP: -4 },
  Mage: { WILL: 1, INT: 1 },
  'Man At Arms': { BODY: 1, REF: 1 },
  Bard: { EMP: 1, DEX: 1 },
  Craftsman: { INT: 1, CRA: 1 },
  Criminal: { DEX: 1, LUCK: 1 }
}

// --- Logic ---
function applyProfession(stats: CoreStats, prof: string): CoreStats {
  const mods = professions[prof] || {}
  const result = { ...stats }

  for (const key in mods) {
    const stat = key as keyof CoreStats
    result[stat] += mods[stat] ?? 0
  }

  // Witcher Special Rules
  if (prof === 'Witcher') {
    result.REF = Math.min(result.REF, 14)
    result.DEX = Math.min(result.DEX, 14)
    result.EMP = Math.max(1, Math.min(result.EMP, 6)) // Cap at 6, min 1
  }

  return result
}

function calcDerived(stats: CoreStats): DerivedStats {
  const STUN = Math.floor(stats.BODY / 2)
  const RUN = stats.SPD * 3
  const LEAP = Math.floor(stats.SPD / 2)
  const HP = stats.BODY + stats.WILL
  const STA = stats.BODY * 5
  const ENC = stats.BODY * 10
  const REC = STUN
  const VIGOR = stats.WILL

  return { STUN, RUN, LEAP, HP, STA, ENC, REC, VIGOR }
}

// --- Props ---
interface StatBlockEditorProps {
  initialCharacter?: Character | null; // NEU: Optionaler Charakter zum Bearbeiten
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function StatBlockEditor({ initialCharacter, onSuccess, onCancel }: StatBlockEditorProps) {
  const { user } = useAuth()
  
  // State für Spiele-Liste
  const [userGames, setUserGames] = useState<{ id: number; name: string }[]>([])

  // State initialisieren (Entweder leer oder aus initialCharacter)
  const [name, setName] = useState(initialCharacter?.name || '')
  const [race, setRace] = useState(initialCharacter?.race || 'Human')
  const [profession, setProfession] = useState<string>(initialCharacter?.profession || 'Witcher')
  const [background, setBackground] = useState(initialCharacter?.background || '')
  
  // Stats laden oder Default
  const [stats, setStats] = useState<CoreStats>(initialCharacter?.stats || baseStats)
  
  // Game Selection
  const [selectedGameId, setSelectedGameId] = useState<number | string>(initialCharacter?.game_id || '')

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Berechnungen
  const modifiedStats = applyProfession(stats, profession)
  const derived = calcDerived(modifiedStats)

  // Beim Laden: Spiele holen
  useEffect(() => {
    if (user?.id) {
      CharacterService.getUserGames(user.id).then(games => setUserGames(games))
    }
  }, [user?.id])

  const handleChange = (key: keyof CoreStats, value: string) => {
    const parsed = parseInt(value)
    if (!isNaN(parsed)) {
      setStats(prev => ({ ...prev, [key]: parsed }))
    }
  }

  const handleSave = async () => {
    if (!user) return

    if (!name.trim()) {
      setError('Der Charakter benötigt einen Namen.')
      return
    }

    setIsSaving(true)
    setError(null)

    const charData = {
      name,
      race,
      profession,
      background,
      level: initialCharacter?.level || 1, // Level behalten oder 1
      stats: modifiedStats, // Wir speichern die finalen Stats (mit Modifikatoren)
      game_id: selectedGameId ? String(selectedGameId) : undefined, // Spiel zuweisen (CreateCharacterData erwartet string)
      alive: initialCharacter?.alive ?? true
    }

    try {
      if (initialCharacter?.id) {
        // --- EDIT MODE ---
        await CharacterService.updateCharacter(initialCharacter.id, charData, user.id)
      } else {
        // --- CREATE MODE ---
        await CharacterService.createCharacter(charData, user.id)
      }

      if (onSuccess) onSuccess()
      else window.location.reload()

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Fehler beim Speichern')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 text-slate-200">
      
      {/* Metadaten Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        
        {/* Name */}
        <div>
          <label className="block text-amber-500 font-serif mb-1">Name des Helden</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Game Selection Dropdown (NEU) */}
        <div>
          <label className="block text-amber-500 font-serif mb-1">Kampagne / Spiel</label>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="">-- Kein Spiel zugewiesen --</option>
            {userGames.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        
        {/* Beruf */}
        <div>
          <label className="block text-amber-500 font-serif mb-1">Berufung</label>
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
          >
            {Object.keys(professions).map((prof) => (
              <option key={prof} value={prof}>{prof}</option>
            ))}
          </select>
        </div>

        {/* Rasse */}
        <div>
          <label className="block text-amber-500 font-serif mb-1">Volk / Rasse</label>
          <input
            type="text"
            value={race}
            onChange={(e) => setRace(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Hintergrund */}
        <div className="md:col-span-2">
          <label className="block text-amber-500 font-serif mb-1">Hintergrund</label>
          <input
            type="text"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Stats Sektion (Bleibt wie vorher, nur gekürzt für Übersicht) */}
      <div>
        <h3 className="text-xl font-serif text-amber-50 mb-4 border-b border-slate-700 pb-2">Charakterwerte (Basis)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats).map(([key, value]) => (
             <div key={key} className="bg-slate-800 p-2 rounded border border-slate-700 flex flex-col items-center">
                <label className="font-bold text-slate-400 text-xs mb-1">{key}</label>
                <input
                  type="number" min={1} max={20}
                  value={value}
                  onChange={(e) => handleChange(key as keyof CoreStats, e.target.value)}
                  className="w-full text-center bg-slate-900 border border-slate-600 rounded text-white"
                />
             </div>
          ))}
        </div>
      </div>

      {/* Derived Stats (Bleibt gleich) */}
      {/* ... */}

      {/* Buttons */}
      <div className="flex gap-4 pt-4 border-t border-slate-700">
        <button onClick={onCancel} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600">
          Abbrechen
        </button>
        <button onClick={handleSave} disabled={isSaving} className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded font-bold shadow-lg flex justify-center items-center gap-2">
          {isSaving ? <span className="loading loading-spinner"></span> : <span>⚔️</span>}
          {initialCharacter ? 'Änderungen Speichern' : 'Charakter Erstellen'}
        </button>
      </div>
    </div>
  )
}