'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { CharacterService } from '@/lib/characterService'

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
  onSuccess?: () => void; // Callback um das Modal zu schließen
  onCancel?: () => void;
}

export default function StatBlockEditor({ onSuccess, onCancel }: StatBlockEditorProps) {
  const { user } = useAuth()
  
  // State für Metadaten
  const [name, setName] = useState('')
  const [race, setRace] = useState('Human')
  const [profession, setProfession] = useState<string>('Witcher')
  const [background, setBackground] = useState('')

  // State für Stats
  const [stats, setStats] = useState<CoreStats>(baseStats)
  
  // UI State
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modifiedStats = applyProfession(stats, profession)
  const derived = calcDerived(modifiedStats)

  const handleChange = (key: keyof CoreStats, value: string) => {
    const parsed = parseInt(value)
    if (!isNaN(parsed)) {
      setStats(prev => ({ ...prev, [key]: parsed }))
    }
  }

  const handleSave = async () => {
    if (!user) {
      setError('Du musst eingeloggt sein.')
      return
    }
    if (!name.trim()) {
      setError('Der Charakter benötigt einen Namen.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await CharacterService.createCharacter({
        name,
        race,
        profession,
        background,
        level: 1,
        stats: modifiedStats, // Wir speichern die fertig berechneten Stats
        alive: true
      }, user.id)

      // Erfolg!
      if (onSuccess) onSuccess()
      else window.location.reload() // Fallback falls kein Callback da ist

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Fehler beim Speichern')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 text-slate-200">
      
      {/* 1. Metadaten Sektion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div>
          <label className="block text-amber-500 font-serif mb-1">Name des Helden</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Geralt von Riva..."
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
          />
        </div>
        
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

        <div>
          <label className="block text-amber-500 font-serif mb-1">Volk / Rasse</label>
          <input
            type="text"
            value={race}
            onChange={(e) => setRace(e.target.value)}
            placeholder="Mensch, Elf, Zwerg..."
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-amber-500 font-serif mb-1">Hintergrund (Optional)</label>
          <input
            type="text"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="Ein Hexer der Wolfsschule..."
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 2. Hauptattribute */}
      <div>
        <h3 className="text-xl font-serif text-amber-50 mb-4 border-b border-slate-700 pb-2">Charakterwerte</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(stats).map(([key, value]) => {
            const modValue = modifiedStats[key as keyof CoreStats]
            const isModified = modValue !== value
            
            return (
              <div key={key} className="bg-slate-800 p-3 rounded border border-slate-700 flex flex-col items-center">
                <label className="font-bold text-slate-400 mb-1">{key}</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={value}
                  onChange={(e) => handleChange(key as keyof CoreStats, e.target.value)}
                  className="w-16 text-center bg-slate-900 border border-slate-600 rounded p-1 text-white font-mono"
                />
                {isModified && (
                  <span className="text-xs mt-1 text-amber-400 font-mono">
                    Mod: {modValue}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Abgeleitete Werte */}
      <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
        <h3 className="text-lg font-serif text-amber-50 mb-4">Abgeleitete Werte</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(derived).map(([key, value]) => (
            <div key={key} className="flex flex-col items-center p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold">{key}</span>
              <span className="text-amber-50 font-mono text-lg">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded text-sm text-center">
          {error}
        </div>
      )}

      {/* 4. Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-slate-700">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors font-medium border border-slate-600"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded transition-all font-bold shadow-lg flex justify-center items-center gap-2"
        >
          {isSaving ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Schmiede Charakter...
            </>
          ) : (
            <>
              <span>⚔️</span> Charakter Speichern
            </>
          )}
        </button>
      </div>
    </div>
  )
}